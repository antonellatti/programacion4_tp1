import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { Registro } from './components/registro/registro';
import { QuienSoy } from './components/quien-soy/quien-soy';


export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: Home },
    { path: 'login', component: Login },
    { path: 'registro', component: Registro },
    { path: 'quien-soy', component: QuienSoy },
    { path: '**', redirectTo: 'home' }
];