import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import { Router } from '@angular/router';

interface Mensaje {
  id: string;
  usuario_id: string;
  usuario_email: string;
  usuario_nombre: string;
  mensaje: string;
  created_at: string;
}

@Component({
  selector: 'app-chat-flotante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-flotante.html',
  styleUrl: './chat-flotante.css'
})
export class ChatFlotante implements OnInit, OnDestroy {
  @ViewChild('mensajesContainer') mensajesContainer!: ElementRef;

  mensajes: Mensaje[] = [];
  nuevoMensaje = '';
  usuarioActual: any = null;
  nombreUsuario = '';
  cargando = false;
  expandido = false;
  suscripcion: any;

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}
  
  get estaEnChat(): boolean {
    return this.router.url === '/chat';
  }

  async ngOnInit() {
    this.usuarioActual = await this.supabase.getUsuarioActual();
    if (this.usuarioActual) {
      this.nombreUsuario = await this.supabase.getNombreUsuario(this.usuarioActual.id);
      await this.cargarMensajes();
      this.suscribirseAlChat();
    }

    this.supabase.onAuthChange(async (user) => {
      this.usuarioActual = user;
      if (user) {
        this.nombreUsuario = await this.supabase.getNombreUsuario(user.id);
        await this.cargarMensajes();
        this.suscribirseAlChat();
      } else {
        this.mensajes = [];
        this.expandido = false;
      }
      this.cdr.detectChanges();
    });
  }

  async cargarMensajes() {
    const { data } = await this.supabase.client
      .from('chat_mensajes')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);

    if (data) {
      this.mensajes = data;
      this.cdr.detectChanges();
      this.scrollAbajo();
    }
  }

  suscribirseAlChat() {
    if (this.suscripcion) {
      this.supabase.client.removeChannel(this.suscripcion);
    }
    this.suscripcion = this.supabase.client
      .channel('chat-flotante', {
        config: {
          presence: { key: this.usuarioActual?.id }
        }
      })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_mensajes' },
        (payload) => {
          this.mensajes.push(payload.new as Mensaje);
          this.cdr.detectChanges();
          this.scrollAbajo();
        }
      )
      .subscribe((status) => {
        console.log('Chat status:', status);
      });
  }

  async enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.usuarioActual) return;
    this.cargando = true;

    await this.supabase.client
      .from('chat_mensajes')
      .insert({
        usuario_id: this.usuarioActual.id,
        usuario_email: this.usuarioActual.email,
        usuario_nombre: this.nombreUsuario || this.usuarioActual.email,
        mensaje: this.nuevoMensaje.trim()
      });

    this.nuevoMensaje = '';
    this.cargando = false;
    this.cdr.detectChanges();
  }

  toggleChat() {
    this.expandido = !this.expandido;
    if (this.expandido) {
      this.scrollAbajo();
    }
    this.cdr.detectChanges();
  }

  esMio(mensaje: Mensaje): boolean {
    return mensaje.usuario_id === this.usuarioActual?.id;
  }

  formatearHora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  scrollAbajo() {
    setTimeout(() => {
      if (this.mensajesContainer) {
        this.mensajesContainer.nativeElement.scrollTop = this.mensajesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  ngOnDestroy() {
    if (this.suscripcion) {
      this.supabase.client.removeChannel(this.suscripcion);
    }
  }
}