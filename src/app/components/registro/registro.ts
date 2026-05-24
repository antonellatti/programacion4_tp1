import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
declare var bootstrap: any;

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, TranslateModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  form: FormGroup;
  errorMsg = '';
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  mostrarError(mensaje: string) {
    this.errorMsg = mensaje;
    const modal = new bootstrap.Modal(document.getElementById('errorModalRegistro'));
    modal.show();
  }

  async registrar() {
    if (this.form.invalid) {
      this.mostrarError('Por favor completá todos los campos correctamente.');
      return;
    }
    this.cargando = true;
    try {
      await this.supabase.registrar(
        this.form.value.email,
        this.form.value.password,
        {
          nombre: this.form.value.nombre,
          apellido: this.form.value.apellido,
          edad: this.form.value.edad
        }
      );
      this.router.navigate(['/home']);
    } catch (e: any) {
      this.mostrarError(e.message || 'Error al registrarse.');
    } finally {
      this.cargando = false;
    }
  }
}