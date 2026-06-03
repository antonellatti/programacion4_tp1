import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare var bootstrap: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslateModule, CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  idiomaActual = 'es';
  usuarioActual: any = null;
  nombreUsuario = '';
  esAdmin = false;
  nickname = '';
  nicknameTemp = '';

  constructor(
    private translate: TranslateService,
    private supabase: SupabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    // 1. Recuperamos el invitado primero
    const nicknameGuardado = localStorage.getItem('guest_nickname');
    if (nicknameGuardado) {
      this.nickname = nicknameGuardado;
    }

    // 2. Obtiene usuario de Supabase inmediatamente
    this.usuarioActual = await this.supabase.getUsuarioActual();
    if (this.usuarioActual) {
      this.nombreUsuario = await this.supabase.getNombreUsuario(this.usuarioActual.id);
      const { data } = await this.supabase.client
        .from('usuarios')
        .select('es_admin')
        .eq('id', this.usuarioActual.id)
        .single();
      this.esAdmin = data?.es_admin || false;
    }
    this.cdr.detectChanges();

    // 3. Escucha cambios de sesión de Supabase
    this.supabase.onAuthChange(async (user) => {
      this.usuarioActual = user;
      if (user) {
        this.nombreUsuario = await this.supabase.getNombreUsuario(user.id);
        // CORRECCIÓN: Solo limpia el invitado si REALMENTE entra un usuario de base de datos válido
        this.limpiarInvitadoExplicito();
      }
      this.cdr.detectChanges();
    });
  }

  cambiarIdioma() {
    this.idiomaActual = this.idiomaActual === 'es' ? 'en' : 'es';
    this.translate.use(this.idiomaActual);
  }

  async cerrarSesion() {
    await this.supabase.logout();
    this.usuarioActual = null;
    this.esAdmin = false;
    this.limpiarInvitadoExplicito();
    this.router.navigate(['/home']);
    this.cdr.detectChanges();
  }

  get tieneAcceso(): boolean {
    return !!this.usuarioActual || !!this.nickname;
  }

  abrirModalNickname() {
    const modal = new bootstrap.Modal(document.getElementById('nicknameModal'));
    modal.show();
  }
  
  confirmarNickname() {
    if (!this.nicknameTemp.trim()) return;
    this.nickname = this.nicknameTemp.trim();
    
    // Guardamos en localStorage para que tu AuthGuard de rutas lo lea de una
    localStorage.setItem('guest_nickname', this.nickname); 
    
    // Ocultamos modal con la API de Bootstrap
    bootstrap.Modal.getInstance(document.getElementById('nicknameModal'))?.hide();
    
    // OBLIGAMOS a Angular a redibujar el Nav y las Cards con el acceso concedido
    this.cdr.detectChanges();
  }

  salirInvitado() {
    this.limpiarInvitadoExplicito();
    this.cdr.detectChanges();
  }

  // Método auxiliar interno para no romper los ciclos de Supabase al arrancar
  private limpiarInvitadoExplicito() {
    this.nickname = '';
    this.nicknameTemp = '';
    localStorage.removeItem('guest_nickname');
  }
}