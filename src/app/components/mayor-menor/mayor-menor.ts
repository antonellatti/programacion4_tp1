import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

interface Carta {
  valor: number;
  palo: string;
  imagen: string;
}

@Component({
  selector: 'app-mayor-menor',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mayor-menor.html',
  styleUrl: './mayor-menor.css'
})
export class MayorMenor implements OnInit {

  palos = ['oros', 'copas', 'espadas', 'bastos'];
  mazo: Carta[] = [];
  cartaActual: Carta | null = null;
  cartaSiguiente: Carta | null = null;
  cartasAcertadas = 0;
  totalCartas = 0;
  juegoTerminado = false;
  mensajeResultado = '';
  mostrarSiguiente = false;

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.iniciarJuego();
  }

  iniciarJuego() {
    let mazoBase: Carta[] = [];
    for (const palo of this.palos) {
      for (let valor = 1; valor <= 10; valor++) {
        mazoBase.push({ valor, palo, imagen: '' });
      }
    }

    // Mezclamos el mazo y removemos los empates consecutivos de entrada
    this.mazo = this.generarMazoSinEmpates(mazoBase);
    
    this.cartaActual = this.mazo.pop()!;
    this.cartasAcertadas = 0;
    this.totalCartas = 0;
    this.juegoTerminado = false;
    this.mostrarSiguiente = false;
    this.mensajeResultado = '';
    this.cdr.detectChanges();
  }

  // Algoritmo Fisher-Yates para un mezclado verdaderamente aleatorio
  mezclar(mazo: Carta[]): Carta[] {
    for (let i = mazo.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
    }
    return mazo;
  }

  // Garantiza que no existan dos cartas seguidas con el mismo valor numérico
  generarMazoSinEmpates(mazoBase: Carta[]): Carta[] {
    let mazoMezclado = this.mezclar([...mazoBase]);
    let resultado: Carta[] = [];

    while (mazoMezclado.length > 0) {
      const carta = mazoMezclado.pop()!;
      
      // Si es igual a la última que agregamos, la devolvemos al inicio para separarla
      if (resultado.length > 0 && carta.valor === resultado[resultado.length - 1].valor) {
        mazoMezclado.unshift(carta);
        // Si solo quedan duplicados idénticos al final, mezclamos de nuevo para resetear el orden
        if (mazoMezclado.every(c => c.valor === carta.valor)) {
          mazoMezclado = this.mezclar(mazoMezclado);
        }
      } else {
        resultado.push(carta);
      }
    }
    return resultado;
  }

  elegir(opcion: 'mayor' | 'menor') {
    // 1. CONTROL DE ENTRADA: Si ya llegó a 15 intentos, frena de inmediato
    if (this.totalCartas >= 15 || !this.mazo.length) {
      this.terminarJuego();
      return;
    }

    // 2. INCREMENTO INMEDIATO: Sumamos el intento ni bien el usuario hace clic
    this.totalCartas++;

    // Extraemos la primera carta candidata
    let candidata = this.mazo.pop()!;
    
    // El resto de tu lógica limpia para manejar la carta siguiente...
    this.cartaSiguiente = candidata;
    this.mostrarSiguiente = true;

    const esCorrecta =
      (opcion === 'mayor' && this.cartaSiguiente.valor > this.cartaActual!.valor) ||
      (opcion === 'menor' && this.cartaSiguiente.valor < this.cartaActual!.valor);

    if (esCorrecta) {
      this.cartasAcertadas++;
      this.mensajeResultado = '✅ ¡Correcto! ✅';
    } else {
      this.mensajeResultado = '❌ ¡Incorrecto! ❌';
    }

    this.cdr.detectChanges();

    // 3. CONTROL DE SALIDA: Evaluamos el cierre al terminar la animación
    setTimeout(() => {
      this.cartaActual = this.cartaSiguiente;
      this.cartaSiguiente = null;
      this.mostrarSiguiente = false;
      this.mensajeResultado = '';

      // Si con este intento se alcanzaron las 15 jugadas o se vació el mazo, termina el juego
      if (this.totalCartas >= 15 || !this.mazo.length) {
        this.terminarJuego();
      }
      this.cdr.detectChanges();
    }, 1500);
  }

  terminarJuego() {
    this.juegoTerminado = true;
    this.guardarResultado();
  }
  
  getEmoji(palo: string): string {
    const emojis: { [key: string]: string } = {
      oros: '🪙', copas: '🏆', espadas: '⚔️', bastos: '🪵'
    };
    return emojis[palo] || '';
  }

  async guardarResultado() {
    // Llamamos al servicio centralizado
    const usuario = await this.supabase.getIdentificadorUsuario();

    await this.supabase.client
      .from('resultados_mayor_menor') // tabla del juego
      .insert({
        usuario_id: usuario.id, // Va el UUID o null
        usuario_email: usuario.nombre, // Guarda Nombre o Nickname limpio
        cartas_acertadas: this.cartasAcertadas,
        total_cartas: this.totalCartas
      });
  }

}