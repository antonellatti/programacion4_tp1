import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import { RouterLink } from '@angular/router';

interface Mensaje {
  id: string;
  usuario_id: string;
  usuario_email: string;
  usuario_nombre: string;
  mensaje: string;
  created_at: string;
}

@Component({
  selector: 'app-chat-global',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chat-global.html',
  styleUrl: './chat-global.css'
})
export class ChatGlobal implements OnInit, OnDestroy {
  @ViewChild('mensajesContainer') mensajesContainer!: ElementRef;

  mensajes: Mensaje[] = [];
  nuevoMensaje = '';
  usuarioActual: any = null;
  nombreUsuario = '';
  cargando = false;
  suscripcion: any;

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.usuarioActual = await this.supabase.getUsuarioActual();
    if (this.usuarioActual) {
      this.nombreUsuario = await this.supabase.getNombreUsuario(this.usuarioActual.id);
    }
    await this.cargarMensajes();
    this.suscribirseAlChat();
  }

  async cargarMensajes() {
    const { data } = await this.supabase.client
      .from('chat_mensajes')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (data) {
      this.mensajes = data;
      this.cdr.detectChanges();
      this.scrollAbajo();
    }
  }

  suscribirseAlChat() {
    this.suscripcion = this.supabase.client
      .channel('chat')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chat_mensajes' },
        (payload) => {
          this.mensajes.push(payload.new as Mensaje);
          this.cdr.detectChanges();
          this.scrollAbajo();
        }
      )
      .subscribe();
  }

  async enviarMensaje() {
    const nicknameInvitado = localStorage.getItem('guest_nickname');
    if (!this.nuevoMensaje.trim() || (!this.usuarioActual && !nicknameInvitado)) return;
    
    this.cargando = true;

    // UUID real si está logueado, null si es invitado para no romper la columna UUID
    const idEmisor = this.usuarioActual ? this.usuarioActual.id : null;
    
    // Definimos los textos para guardar
    const emailEmisor = this.usuarioActual ? this.usuarioActual.email : 'invitado@playground.com';
    const nombreEmisor = this.usuarioActual 
      ? (this.nombreUsuario || this.usuarioActual.email) 
      : (nicknameInvitado || 'Invitado Anónimo');

    try {
      await this.supabase.client
        .from('chat_mensajes')
        .insert({
          usuario_id: idEmisor,
          usuario_email: emailEmisor,
          usuario_nombre: nombreEmisor,
          mensaje: this.nuevoMensaje.trim()
        });

      this.nuevoMensaje = ''; // Solo limpia el input si completó el proceso
    } catch (error) {
      console.error('Error al enviar en chat global:', error);
    }

    this.cargando = false;
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