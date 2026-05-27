import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const user = await this.supabase.getUsuarioActual();
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    const { data } = await this.supabase.client
      .from('usuarios')
      .select('es_admin')
      .eq('id', user.id)
      .single();

    if (data?.es_admin) {
      return true;
    } else {
      this.router.navigate(['/home']);
      return false;
    }
  }
}