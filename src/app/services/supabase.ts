import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  get client() {
    return this.supabase;
  }

  // Autenticacion
  async registrar(email: string, password: string, datos: any) {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw error;

    const { error: errorDatos } = await this.supabase
      .from('usuarios')
      .insert({
        id: data.user!.id,
        nombre: datos.nombre,
        apellido: datos.apellido,
        edad: datos.edad,
        email: email
      });
    if (errorDatos) throw errorDatos;
    return data;
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getUsuarioActual() {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }
  async getNombreUsuario(id: string) {
  const { data } = await this.supabase
    .from('usuarios')
    .select('nombre')
    .eq('id', id)
    .single();
  return data?.nombre;
}

  onAuthChange(callback: (user: any) => void) {
    this.supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null);
    });
  }
  
  async getIdentificadorUsuario(): Promise<{ id: string | null; nombre: string }> {
    const { data } = await this.supabase.auth.getUser();
    const user = data.user;

    if (user) {
      // Si está logueado, buscamos su nombre en la tabla 'usuarios'
      const nombreReal = await this.getNombreUsuario(user.id);
      return {
        id: user.id,
        nombre: nombreReal || user.email || 'Usuario Registrado'
      };
    } else {
      // Si no hay sesión, es un invitado
      const nicknameInvitado = localStorage.getItem('guest_nickname');
      return {
        id: null, // El UUID queda en null para la base de datos
        nombre: nicknameInvitado ? `Invitado: ${nicknameInvitado}` : 'Invitado Anónimo'
      };
    }
  }

}