import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase';

@Injectable({ providedIn: 'root' })

export class AuthGuard implements CanActivate {
  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const user = await this.supabase.getUsuarioActual();
    const esInvitado = !!localStorage.getItem('guest_nickname'); // Verificamos si existe nickname invitado
    if (user || esInvitado) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}