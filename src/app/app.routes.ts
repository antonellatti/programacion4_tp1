import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { Registro } from './components/registro/registro';
import { QuienSoy } from './components/quien-soy/quien-soy';
import { AuthGuard } from './guards/auth-guard';
import { Ahorcado } from './components/ahorcado/ahorcado';
import { MayorMenor } from './components/mayor-menor/mayor-menor';
import { ChatGlobal } from './components/chat-global/chat-global';
import { Preguntados } from './components/preguntados/preguntados';
import { AdivinaCrucero } from './components/adivina-crucero/adivina-crucero';
import { Resultados } from './components/resultados/resultados';

export const routes: Routes = [
    { path: '',  component: Home },
    { path: 'home', component: Home },
    { path: 'login', component: Login },
    { path: 'registro', component: Registro },
    { path: 'quien-soy', component: QuienSoy },
    { path: 'ahorcado', component: Ahorcado, canActivate: [AuthGuard] },
    { path: 'mayor-menor', component: MayorMenor, canActivate: [AuthGuard] },
    { path: 'chat', component: ChatGlobal, canActivate: [AuthGuard] },
    { path: 'preguntados', component: Preguntados, canActivate: [AuthGuard] },
    { path: 'adivina-crucero', component: AdivinaCrucero, canActivate: [AuthGuard] },
    { path: 'resultados', component: Resultados, canActivate: [AuthGuard] },
    { path: '**', redirectTo: '' }
];