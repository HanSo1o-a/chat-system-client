// src/app/components/register/register.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],  // Import FormsModule
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})

export class RegisterComponent {
  username: string = '';
  email: string = '';  // Add email field
  password: string = '';
  errorMessage: string = '';  // Store error messages
  successMessage: string = '';  // Store success messages
  isLoading: boolean = false;  // Show loading state

  constructor(private authService: AuthService, private router: Router) {}

  // Register user
  register() {
    // Input validation
    if (!this.username.trim()) {
      this.errorMessage = 'Username is required';
      return;
    }
    if (!this.email.trim() || !this.validateEmail(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }
    if (!this.password.trim() || this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return;
    }

    this.errorMessage = '';  // Clear error messages

    this.isLoading = true;  // Show loading state
    this.authService.register(this.username, this.email, this.password).subscribe(
      (response) => {
        console.log('Registration successful:', response);
        this.successMessage = 'Registration successful, redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);  // Redirect to login page after successful registration
        }, 2000);
      },
      (error) => {
        this.errorMessage = error?.error?.message || 'Registration failed. Please try again.';
        this.isLoading = false;  // Hide loading state after the request is complete
      },
      () => {
        this.isLoading = false;  // Hide loading state after the request is complete
      }
    );
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }

  onLoginClick() {
    this.router.navigate(['/login']);  // Navigate to the login page when the register link is clicked
  }
}
