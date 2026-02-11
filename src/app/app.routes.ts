import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegistroComponent } from './auth/registro/registro.component';
import { PokemonListComponent } from './components/pokemon-list/pokemon-list.component';
import { authGuard } from './auth.guard';
// Definición de las rutas de la aplicación
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'pokemon', component: PokemonListComponent, canActivate: [authGuard] }, // Ruta protegida por el guard de autenticación
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
