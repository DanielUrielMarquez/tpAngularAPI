import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  successMessage = '';
// Inyectar AuthService y Router
  constructor(private auth: AuthService, private router: Router) {}
// Método de registro
  async register() {
    if (!this.username || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Completá todos los campos';
      this.successMessage = '';
      return;
    }
// Verificar que las contraseñas coincidan
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      this.successMessage = '';
      return;
    }
// Intentar registro
    try {
      await this.auth.register(this.email, this.password, this.username);
      this.errorMessage = '';
      this.successMessage = 'Cuenta creada exitosamente';
// Se redirige al login después de el mensaje de validación
      setTimeout(() => {
        this.router.navigate(['/pokemon']);
      }, 800);
    } catch (err: any) {
      this.errorMessage = err?.message || 'Error al registrarse';
      this.successMessage = '';
    }
  }
}
