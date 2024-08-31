import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  async login() {
    const isAuthenticatedLocally = await this.authService.loginLocally(
      this.username,
      this.password
    );
    if (isAuthenticatedLocally) {
      const isAuthenticatedOnline = await this.authService.loginOnline(
        this.username,
        this.password
      );
      if (isAuthenticatedOnline) {
        await this.authService.syncDataOnOnline();
      }
      this.router.navigate(['/customers']);
    } else {
      this.errorMessage = 'Invalid credentials';
    }
  }
}
