import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-resultados-encuestas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './resultados-encuestas.html',
  styleUrl: './resultados-encuestas.css'
})
export class ResultadosEncuestas implements OnInit {
  encuestas: any[] = [];
  cargando = true;

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const { data } = await this.supabase.client
      .from('encuestas')
      .select('*')
      .order('created_at', { ascending: false });

    this.encuestas = data || [];
    this.cargando = false;
    this.cdr.detectChanges();
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }
}