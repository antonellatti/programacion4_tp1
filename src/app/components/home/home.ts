import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslateModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  idiomaActual = 'es';
  usuarioActual: any = null;
  nombreUsuario = '';

  constructor(
    private translate: TranslateService,
    private supabase: SupabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    // obtiene usuario inmediatamente
    this.usuarioActual = await this.supabase.getUsuarioActual();
    if (this.usuarioActual) {
    this.nombreUsuario = await this.supabase.getNombreUsuario(this.usuarioActual.id);
    }
    this.cdr.detectChanges();

    // escucha cambios de sesion
    this.supabase.onAuthChange(async (user) => {
      this.usuarioActual = user;
      if (user) {
        this.nombreUsuario = await this.supabase.getNombreUsuario(user.id);
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
    this.cdr.detectChanges();
    this.router.navigate(['/home']);
  }
}