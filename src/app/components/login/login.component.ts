import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule, CommonModule],  // Import FormsModule in imports
  standalone: true 
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';  // Store error messages
  successMessage: string = '';  // Store success messages
  isLoading: boolean = false;  // Show loading state

  constructor(private authService: AuthService, private router: Router) {}  // Inject Router

  // Login functionality
  login() {
    if (this.username.trim() && this.password.trim()) {
      this.isLoading = true;  // Show loading state
      this.authService.login(this.username, this.password).subscribe(
        (response) => {
          console.log('Login successful:', response);
          this.successMessage = 'Login successful, redirecting to chat...';

          // Save the JWT token, assuming the backend returns a 'token' field in the response
          const token = response?.token; 

          if (token) {
            localStorage.setItem('authToken', token);  // Store in localStorage or sessionStorage
            localStorage.setItem('username', response?.username);
          }

          // Save login status, typically store JWT token or other user information
          setTimeout(() => {
            this.router.navigate(['/chat']);  // Redirect to chat page after successful login
          }, 2000);
        },
        (error) => {
          console.error('Login failed:', error);
          this.errorMessage = error?.error?.message || 'Login failed. Please check your credentials.';
          this.isLoading = false;  
        },
        () => {
          this.isLoading = false;  
        }
      );
    } else {
      this.errorMessage = 'Username and password are required';
    }
  }

  // Redirect to the registration page when clicked
  onRegisterClick() {
    this.router.navigate(['/register']);
  }
}
