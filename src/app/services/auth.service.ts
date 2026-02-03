import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from '@angular/fire/auth';
import { authState } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User | null>;

  constructor(private auth: Auth) {
    this.user$ = authState(this.auth);
  }

  // Registro con username
  async register(email: string, password: string, username: string) {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: username });
    }
    return cred;
  }

  // Login
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  // Logout
  logout() {
    return signOut(this.auth);
  }

  // Usuario actual
  get user(): User | null {
    return this.auth.currentUser;
  }

  // Verificar sesión
  isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }
}
