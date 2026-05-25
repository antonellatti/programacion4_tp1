import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SupabaseService } from '../../services/supabase';
import { TranslateService } from '@ngx-translate/core';


interface Pregunta {
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  opciones: string[];
}

declare var bootstrap: any;

@Component({
  selector: 'app-preguntados',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './preguntados.html',
  styleUrl: './preguntados.css'
})
export class Preguntados implements OnInit {
  preguntas: Pregunta[] = [];
  preguntaActual: Pregunta | null = null;
  indicePregunta = 0;
  correctas = 0;
  respuestaSeleccionada = '';
  respuestaCorrecta = false;
  juegoTerminado = false;
  cargando = true;
  error = false;
  errorMsg = '';

  constructor(
    private http: HttpClient,
    private supabase: SupabaseService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarPreguntas();
  }

  cargarPreguntas() {
    this.cargando = true;
    this.error = false;
    const idioma = this.translate.currentLang || 'es';
    const url = `https://the-trivia-api.com/v2/questions?limit=10`;

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.preguntas = data.map(p => {
          const opciones = [...p.incorrectAnswers, p.correctAnswer]
            .sort(() => Math.random() - 0.5);
          return {
            question: p.question.text,
            correctAnswer: p.correctAnswer,
            incorrectAnswers: p.incorrectAnswers,
            opciones
          };
        });
        this.preguntaActual = this.preguntas[0];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mostrarError('Error al cargar las preguntas.');
        this.error = true;
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  responder(opcion: string) {
    if (this.respuestaSeleccionada) return;
    this.respuestaSeleccionada = opcion;
    this.respuestaCorrecta = opcion === this.preguntaActual?.correctAnswer;
    if (this.respuestaCorrecta) this.correctas++;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.siguientePregunta();
    }, 1500);
  }

  siguientePregunta() {
    this.indicePregunta++;
    if (this.indicePregunta >= this.preguntas.length) {
      this.juegoTerminado = true;
      this.guardarResultado();
    } else {
      this.preguntaActual = this.preguntas[this.indicePregunta];
      this.respuestaSeleccionada = '';
      this.respuestaCorrecta = false;
    }
    this.cdr.detectChanges();
  }

  async guardarResultado() {
    const user = await this.supabase.getUsuarioActual();
    if (!user) return;

    await this.supabase.client
      .from('resultados_preguntados')
      .insert({
        usuario_id: user.id,
        usuario_email: user.email,
        correctas: this.correctas,
        total_preguntas: this.preguntas.length
      });
  }

  reiniciar() {
    this.indicePregunta = 0;
    this.correctas = 0;
    this.respuestaSeleccionada = '';
    this.juegoTerminado = false;
    this.cargarPreguntas();
  }

  getClaseOpcion(opcion: string): string {
    if (!this.respuestaSeleccionada) return '';
    if (opcion === this.preguntaActual?.correctAnswer) return 'correcta';
    if (opcion === this.respuestaSeleccionada) return 'errada';
    return '';
  }

  mostrarError(mensaje: string) {
    this.errorMsg = mensaje;
    const modal = new bootstrap.Modal(document.getElementById('errorModalPreguntados'));
    modal.show();
  }

}