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
  nicknameInvitado = ''; /* <-- Agregamos la propiedad para guardar al invitado de tu localStorage */
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

  /* <-- Propiedad que tu HTML necesita leer para renderizarse o no --> */
  get tieneAccesoAlChat(): boolean {
    return !!this.usuarioActual || !!this.nicknameInvitado;
  }

  async ngOnInit() {
    // 1. Buscamos si hay un invitado logueado en el navegador
    this.nicknameInvitado = localStorage.getItem('guest_nickname') || '';

    // 2. Comprobamos el estado del usuario de base de datos
    this.usuarioActual = await this.supabase.getUsuarioActual();
    if (this.usuarioActual) {
      this.nombreUsuario = await this.supabase.getNombreUsuario(this.usuarioActual.id);
    }

    // 3. Si es usuario real O es invitado, cargamos el chat sin trabas
    if (this.tieneAccesoAlChat) {
      await this.cargarMensajes();
      this.suscribirseAlChat();
    }
    this.cdr.detectChanges();

    // 4. Escuchamos cambios de sesión
    this.supabase.onAuthChange(async (user) => {
      this.usuarioActual = user;
      // Volvemos a leer por las dudas si mutó el estado en simultáneo
      this.nicknameInvitado = localStorage.getItem('guest_nickname') || '';

      if (user) {
        this.nombreUsuario = await this.supabase.getNombreUsuario(user.id);
        await this.cargarMensajes();
        this.suscribirseAlChat();
      } else {
        // vaciamos el chat si no hay usuario o invitado, Si hay invitado activo, dejamos los mensajes vivos.
        if (!this.nicknameInvitado) {
          this.mensajes = [];
          this.expandido = false;
        } else {
          await this.cargarMensajes();
          this.suscribirseAlChat();
        }
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

    // Identificador único para el canal basado en el tipo de sesión activo
    const idPresencia = this.usuarioActual?.id || `invitado-${this.nicknameInvitado}`;

    this.suscripcion = this.supabase.client
      .channel('chat-flotante', {
        config: {
          presence: { key: idPresencia }
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
    // Si no hay texto o directamente no tiene accesos concedidos, frenamos
    if (!this.nuevoMensaje.trim() || !this.tieneAccesoAlChat) return;
    this.cargando = true;

    // Evaluamos dinámicamente los campos requeridos por la estructura de la bdbdd    const idEmisor = this.usuarioActual?.id || `invitado-${this.nicknameInvitado}`;
    const idEmisor = this.usuarioActual?.id || `invitado-${this.nicknameInvitado}`;
    const emailEmisor = this.usuarioActual?.email || 'invitado@playground.com';
    const nombreEmisor = this.usuarioActual ? (this.nombreUsuario || this.usuarioActual.email) : this.nicknameInvitado;

    await this.supabase.client
      .from('chat_mensajes')
      .insert({
        usuario_id: idEmisor,
        usuario_email: emailEmisor,
        usuario_nombre: nombreEmisor,
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

  // Compara contra cualquiera de las formas válidas de sesión activa
  esMio(mensaje: Mensaje): boolean {
    const idActual = this.usuarioActual?.id || `invitado-${this.nicknameInvitado}`;
    return mensaje.usuario_id === idActual;
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