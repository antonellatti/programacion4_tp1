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
    this.mazo = [];
    for (const palo of this.palos) {
      for (let valor = 1; valor <= 10; valor++) {
        this.mazo.push({
          valor,
          palo,
          imagen: ''
        });
      }
    }
    this.mazo = this.mezclar(this.mazo);
    this.cartaActual = this.mazo.pop()!;
    this.cartasAcertadas = 0;
    this.totalCartas = 0;
    this.juegoTerminado = false;
    this.mostrarSiguiente = false;
    this.mensajeResultado = '';
    this.cdr.detectChanges();
  }

  mezclar(mazo: Carta[]): Carta[] {
    return mazo.sort(() => Math.random() - 0.5);
  }

  elegir(opcion: 'mayor' | 'menor') {
    if (!this.mazo.length) {
      this.terminarJuego();
      return;
    }

    this.cartaSiguiente = this.mazo.pop()!;
    this.totalCartas++;
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

    setTimeout(() => {
      this.cartaActual = this.cartaSiguiente;
      this.cartaSiguiente = null;
      this.mostrarSiguiente = false;
      this.mensajeResultado = '';

      if (!this.mazo.length) {
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
    oros: '🪙',
    copas: '🏆',
    espadas: '⚔️',
    bastos: '🪵'
  };
  return emojis[palo] || '';
}
  async guardarResultado() {
    const user = await this.supabase.getUsuarioActual();
    if (!user) return;

    await this.supabase.client
      .from('resultados_mayor_menor')
      .insert({
        usuario_id: user.id,
        usuario_email: user.email,
        cartas_acertadas: this.cartasAcertadas,
        total_cartas: this.totalCartas
      });
  }
}