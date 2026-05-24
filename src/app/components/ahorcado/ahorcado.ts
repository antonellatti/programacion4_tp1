import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-ahorcado',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ahorcado.html',
  styleUrl: './ahorcado.css'
})
export class Ahorcado implements OnInit {

  categorias = [
    { nombre: 'Informática', valor: 'informatica' },
    { nombre: 'Barcos', valor: 'barcos' }
  ];

  palabras: { [key: string]: string[] } = {
    informatica: ['javascript', 'angular', 'typescript', 'componente', 'servidor', 'database', 'variable', 'funcion', 'algoritmo', 'interfaz'],
    barcos: ['crucero', 'capitan', 'ancla', 'cubierta', 'proa', 'popa', 'velero', 'submarino', 'portaaviones', 'fragata']
  };

  categoriaSeleccionada = '';
  palabraSecreta = '';
  letrasAdivinadas: string[] = [];
  letrasErradas: string[] = [];
  juegoTerminado = false;
  gano = false;
  tiempoSegundos = 0;
  intervalo: any;
  maxIntentos = 6;

  abecedario = 'abcdefghijklmnopqrstuvwxyz'.split('');

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {}

  seleccionarCategoria(categoria: string) {
    this.categoriaSeleccionada = categoria;
    const lista = this.palabras[categoria];
    this.palabraSecreta = lista[Math.floor(Math.random() * lista.length)];
    this.letrasAdivinadas = [];
    this.letrasErradas = [];
    this.juegoTerminado = false;
    this.gano = false;
    this.tiempoSegundos = 0;
    this.intervalo = setInterval(() => {
      this.tiempoSegundos++;
      this.cdr.detectChanges();
    }, 1000);
  }

  get palabraMostrada(): string {
    return this.palabraSecreta
      .split('')
      .map(l => this.letrasAdivinadas.includes(l) ? l : '_')
      .join(' ');
  }

  get intentosRestantes(): number {
    return this.maxIntentos - this.letrasErradas.length;
  }

  letraUsada(letra: string): boolean {
    return this.letrasAdivinadas.includes(letra) || this.letrasErradas.includes(letra);
  }

  elegirLetra(letra: string) {
    if (this.juegoTerminado || this.letraUsada(letra)) return;

    if (this.palabraSecreta.includes(letra)) {
      this.letrasAdivinadas.push(letra);
      const todasAdivinadas = this.palabraSecreta.split('').every(l => this.letrasAdivinadas.includes(l));
      if (todasAdivinadas) {
        this.gano = true;
        this.terminarJuego();
      }
    } else {
      this.letrasErradas.push(letra);
      if (this.letrasErradas.length >= this.maxIntentos) {
        this.gano = false;
        this.terminarJuego();
      }
    }
    this.cdr.detectChanges();
  }

  terminarJuego() {
    this.juegoTerminado = true;
    clearInterval(this.intervalo);
    this.guardarResultado();
  }

  async guardarResultado() {
    const user = await this.supabase.getUsuarioActual();
    if (!user) return;

    await this.supabase.client
      .from('resultados_ahorcado')
      .insert({
        usuario_id: user.id,
        usuario_email: user.email,
        palabra: this.palabraSecreta,
        gano: this.gano,
        intentos_usados: this.letrasErradas.length,
        tiempo_segundos: this.tiempoSegundos
      });
  }

  reiniciar() {
    this.seleccionarCategoria(this.categoriaSeleccionada);
  }
}