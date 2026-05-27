import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { CommonModule } from '@angular/common';
declare var bootstrap: any;

@Component({
  selector: 'app-encuesta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './encuesta.html',
  styleUrl: './encuesta.css'
})
export class Encuesta {
  form: FormGroup;
  errorMsg = '';
  enviado = false;
  cargando = false;

  juegos = ['Ahorcado', 'Mayor o Menor', 'Preguntados', 'Adivina el Crucero'];
  mejoras = ['Diseño', 'Dificultad', 'Variedad de preguntas', 'Velocidad', 'Otro'];

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      nombre_apellido: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(18), Validators.max(99)]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{1,10}$')]],
      juego_favorito: ['', Validators.required],
      mejoras: this.fb.group({
        Diseño: [false],
        Dificultad: [false],
        'Variedad de preguntas': [false],
        Velocidad: [false],
        Otro: [false]
      }),
      comentario: ['', Validators.required]
    });
  }

  alMenosUnaMejora(): boolean {
    const mejoras = this.form.get('mejoras')?.value;
    return Object.values(mejoras).some(v => v === true);
  }

  mostrarError(mensaje: string) {
    this.errorMsg = mensaje;
    const modal = new bootstrap.Modal(document.getElementById('errorModalEncuesta'));
    modal.show();
  }

  getMejorasSeleccionadas(): string {
    const mejoras = this.form.get('mejoras')?.value;
    return Object.keys(mejoras).filter(k => mejoras[k]).join(', ');
  }

  async enviar() {
    if (this.form.invalid) {
      this.mostrarError('Por favor completá todos los campos correctamente.');
      return;
    }
    if (!this.alMenosUnaMejora()) {
      this.mostrarError('Seleccioná al menos una opción de mejora.');
      return;
    }

    this.cargando = true;
    const user = await this.supabase.getUsuarioActual();

    try {
      await this.supabase.client
        .from('encuestas')
        .insert({
          usuario_id: user?.id,
          usuario_email: user?.email,
          nombre_apellido: this.form.value.nombre_apellido,
          edad: this.form.value.edad,
          telefono: this.form.value.telefono,
          pregunta1: this.form.value.juego_favorito,
          pregunta2: this.getMejorasSeleccionadas(),
          pregunta3: this.form.value.comentario
        });
      this.enviado = true;
      this.cdr.detectChanges();
    } catch (e: any) {
      this.mostrarError('Error al enviar la encuesta.');
    } finally {
      this.cargando = false;
    }
  }
}