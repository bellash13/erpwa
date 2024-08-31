import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async register() {
    if (this.registerForm.valid) {
      const { username, password } = this.registerForm.value;
      const isRegistered = await this.authService.register(username, password);
      if (isRegistered) {
        this.router.navigate(['/login']);
      } else {
        this.errorMessage = 'Registration failed. Please try again.';
      }
    }
  }
}