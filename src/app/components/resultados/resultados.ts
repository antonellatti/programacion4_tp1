import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './resultados.html',
  styleUrl: './resultados.css'
})
export class Resultados implements OnInit {
  resultadosAhorcado: any[] = [];
  resultadosMayorMenor: any[] = [];
  resultadosPreguntados: any[] = [];
  resultadosCrucero: any[] = [];
  cargando = true;

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await Promise.all([
      this.cargarAhorcado(),
      this.cargarMayorMenor(),
      this.cargarPreguntados(),
      this.cargarCrucero()
    ]);
    this.cargando = false;
    this.cdr.detectChanges();
  }

  async cargarAhorcado() {
    const { data } = await this.supabase.client
      .from('resultados_ahorcado')
      .select('*')
      .order('gano', { ascending: false })
      .order('intentos_usados', { ascending: true });
    this.resultadosAhorcado = data || [];
  }

  async cargarMayorMenor() {
    const { data } = await this.supabase.client
      .from('resultados_mayor_menor')
      .select('*')
      .order('cartas_acertadas', { ascending: false });
    this.resultadosMayorMenor = data || [];
  }

  async cargarPreguntados() {
    const { data } = await this.supabase.client
      .from('resultados_preguntados')
      .select('*')
      .order('correctas', { ascending: false });
    this.resultadosPreguntados = data || [];
  }

  async cargarCrucero() {
    const { data } = await this.supabase.client
      .from('resultados_adivina_crucero')
      .select('*')
      .order('correctas', { ascending: false });
    this.resultadosCrucero = data || [];
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }
}