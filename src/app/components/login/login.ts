import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, TranslateModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  form: FormGroup;
  error = '';
  cargando = false;

  usuariosRapidos = [
    { email: 'antonella@hotmail.com', password: '123456', nombre: 'Antonella' },
    { email: 'putty@miau.com', password: '111111', nombre: 'Tutti' },
    { email: 'leonardo@miau.com', password: '222222', nombre: 'Leonardo' }
  ];

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async iniciarSesion() {
    if (this.form.invalid) return;
    this.cargando = true;
    this.error = '';
    try {
      await this.supabase.login(this.form.value.email, this.form.value.password);
      this.router.navigate(['/home']);
    } catch (e: any) {
      this.error = 'Email o contraseña incorrectos';
    } finally {
      this.cargando = false;
    }
  }

  async loginRapido(usuario: any) {
    this.cargando = true;
    this.error = '';
    try {
      await this.supabase.login(usuario.email, usuario.password);
      this.router.navigate(['/home']);
    } catch (e: any) {
      this.error = 'Error en inicio de sesion rapido';
    } finally {
      this.cargando = false;
    }
  }
}