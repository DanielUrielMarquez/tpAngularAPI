import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';

  @Output() close = new EventEmitter<void>();

  constructor(private auth: AuthService) {}

  async register() {
    if (!this.username || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Completá todos los campos';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    try {
      await this.auth.register(this.email, this.password, this.username);
      this.errorMessage = '';
      this.close.emit();
    } catch (err: any) {
      this.errorMessage = err?.message || 'Error al registrarse';
    }
  }

  cerrar() {
    this.close.emit();
  }
}
