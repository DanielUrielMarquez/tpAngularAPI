import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  async login() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Completá todos los campos';
      return;
    }

    try {
      await this.auth.login(this.email, this.password);
      this.errorMessage = '';
      this.router.navigate(['/pokemon']);
    } catch (err: any) {
      this.errorMessage = err?.message || 'Error al iniciar sesión';
    }
  }
}
