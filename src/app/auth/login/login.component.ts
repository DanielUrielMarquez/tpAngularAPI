import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  @Output() close = new EventEmitter<void>();
  @Output() goRegister = new EventEmitter<void>();

  constructor(private auth: AuthService) {}

  async login() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Completá todos los campos';
      return;
    }

    try {
      await this.auth.login(this.email, this.password);
      this.errorMessage = '';
      this.close.emit();
    } catch (err: any) {
      this.errorMessage = err?.message || 'Error al iniciar sesión';
    }
  }

  cerrar() {
    this.close.emit();
  }

  irARegistro() {
    this.goRegister.emit();
  }
}
