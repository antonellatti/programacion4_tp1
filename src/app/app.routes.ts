import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { Registro } from './components/registro/registro';
import { QuienSoy } from './components/quien-soy/quien-soy';
import { AuthGuard } from './guards/auth-guard';

export const routes: Routes = [
    { path: '',  component: Home },
    { path: 'home', component: Home },
    { path: 'login', component: Login },
    { path: 'registro', component: Registro },
    { path: 'quien-soy', component: QuienSoy },
    { path: '**', redirectTo: '' }
];
























//     { path: 'chat', canActivate: [AuthGuard] },
//     { path: 'resultados', canActivate: [AuthGuard] },
//     { path: 'ahorcado', canActivate: [AuthGuard] },
//     { path: 'mayor-menor', canActivate: [AuthGuard] },
//     { path: 'preguntados', canActivate: [AuthGuard] },
//     { path: 'juego-propio', canActivate: [AuthGuard] },
//     { path: '**', redirectTo: 'home' }
// ];