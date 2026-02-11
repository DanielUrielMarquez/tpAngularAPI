import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';
// Guard para proteger rutas que requieren autenticación
export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
// Verificar el estado de autenticación del usuario
  return authState(auth).pipe(
    take(1),
    map(user => (user ? true : router.parseUrl('/login')))// Si el usuario está autenticado, permite el acceso; de lo contrario, redirige al login
  );
};
