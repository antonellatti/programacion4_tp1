import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SupabaseService } from '../../services/supabase';
declare var bootstrap: any;

interface Item {
  archivo: string;
  nombre: string;
}

interface Pregunta {
  imagen: string;
  respuestaCorrecta: string;
  opciones: string[];
}

@Component({
  selector: 'app-adivina-crucero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './adivina-crucero.html',
  styleUrl: './adivina-crucero.css'
})
export class AdivinaCrucero implements OnInit {

  categorias = [
    { nombre: 'Cruceros 🚢', valor: 'cruceros' },
    { nombre: 'Puertos ⚓', valor: 'puertos' }
  ];

  cruceros: Item[] = [];
  puertos: Item[] = [];

  categoriaSeleccionada = '';
  preguntas: Pregunta[] = [];
  preguntaActual: Pregunta | null = null;
  indicePregunta = 0;
  correctas = 0;
  respuestaSeleccionada = '';
  mostrandoFeedback = false;
  juegoTerminado = false;
  errorMsg = '';

  constructor(
    private http: HttpClient,
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.http.get<Item[]>('/assets/jsons/cruceros.json').subscribe(data => {
      this.cruceros = data;
      this.cdr.detectChanges();
    });
    this.http.get<Item[]>('/assets/jsons/puertos.json').subscribe(data => {
      this.puertos = data;
      this.cdr.detectChanges();
    });
  }

  seleccionarCategoria(categoria: string) {
    this.categoriaSeleccionada = categoria;
    const lista = categoria === 'cruceros' ? this.cruceros : this.puertos;
    this.preguntas = this.generarPreguntas(lista);
    this.indicePregunta = 0;
    this.correctas = 0;
    this.respuestaSeleccionada = '';
    this.mostrandoFeedback = false;
    this.juegoTerminado = false;
    this.preguntaActual = this.preguntas[0];
    this.cdr.detectChanges();
  }

  generarPreguntas(lista: Item[]): Pregunta[] {
    const mezclada = [...lista].sort(() => Math.random() - 0.5).slice(0, 10);
    return mezclada.map(item => {
      const nombresUnicos = [...new Set(lista.map(i => i.nombre))].filter(n => n !== item.nombre);
      const incorrectas = nombresUnicos.sort(() => Math.random() - 0.5).slice(0, 3);
      const opciones = [...incorrectas, item.nombre].sort(() => Math.random() - 0.5);
      return {
        imagen: `/assets/imgs/adivinacrucero/${this.categoriaSeleccionada}/${item.archivo}.jpg`,
        respuestaCorrecta: item.nombre,
        opciones
      };
    });
  }

  responder(opcion: string) {
    if (this.respuestaSeleccionada) return;
    this.respuestaSeleccionada = opcion;
    this.mostrandoFeedback = true;
    if (opcion === this.preguntaActual?.respuestaCorrecta) this.correctas++;
    this.cdr.detectChanges();
  
    this.ngZone.run(() => {
      setTimeout(() => {
        this.mostrandoFeedback = false;
        this.siguientePregunta();
        this.cdr.detectChanges();
      }, 1250);
    });
  }

  siguientePregunta() {
    this.indicePregunta++;
    
    if (this.indicePregunta >= this.preguntas.length) {
      this.juegoTerminado = true;
      this.preguntaActual = null; 
      this.respuestaSeleccionada = '';
      this.mostrandoFeedback = false;
  
      // Supabase ejecuta
      this.guardarResultado()
        .then(() => {
          console.log('Resultado guardado con éxito en Supabase');
        })
        .catch(err => {
          console.error('Error crítico al guardar en Supabase:', err);
          // modal de error
          this.mostrarError('No se pudieron guardar tus estadísticas, pero completaste el juego.');
        });
  
    } else { //si hay mas preguntas
      this.preguntaActual = this.preguntas[this.indicePregunta];
      this.respuestaSeleccionada = '';
    }
    this.cdr.detectChanges(); // angular: re-renderizar
  }


  async guardarResultado() {
    const user = await this.supabase.getUsuarioActual();
    if (!user) return;

    await this.supabase.client
      .from('resultados_adivina_crucero')
      .insert({
        usuario_id: user.id,
        usuario_email: user.email,
        correctas: this.correctas,
        total_preguntas: this.preguntas.length,
        categoria: this.categoriaSeleccionada
      });
  }

  reiniciar() {
    this.seleccionarCategoria(this.categoriaSeleccionada);
  }

  volverCategorias() {
    this.categoriaSeleccionada = '';
    this.preguntaActual = null;
    this.juegoTerminado = false;     // apaga la pantalla de juego terminado
    this.mostrandoFeedback = false;  // ñimpia el feedback
    this.indicePregunta = 0;         // reset contador p/ prox partida
    this.respuestaSeleccionada = ''; // limpia cualquier selección residual
    this.cdr.detectChanges();
  }

  getClaseOpcion(opcion: string): string {
    if (!this.respuestaSeleccionada) return '';
    if (opcion === this.preguntaActual?.respuestaCorrecta) return 'correcta';
    if (opcion === this.respuestaSeleccionada) return 'errada';
    return '';
  }

  mostrarError(mensaje: string) {
    this.errorMsg = mensaje;
    const modal = new bootstrap.Modal(document.getElementById('errorModalCrucero'));
    modal.show();
  }
}