// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';  // Backend API address

  constructor(private http: HttpClient) {}

  // User login
  login(username: string, password: string): Observable<any> {
    const loginData = { username, password };
    return this.http.post<any>(`${this.apiUrl}/login`, loginData);
  }

  // Registration function
  register(username: string, email: string, password: string): Observable<any> {
    const registerData = { username, email, password };  // Send email and username
    return this.http.post<any>(`${this.apiUrl}/register`, registerData);  // Send registration request to backend
  }

  // Save token to localStorage
  saveToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  // Get token
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Decode token to get user role
  getUserRole(): string | null {
    const token = this.getAuthToken();
    if (token) {
      const decodedToken: any = jwtDecode(token);  // Decode JWT Token
      console.log(decodedToken);
      return decodedToken?.role || null;  // Return role field
    }
    return null;
  }

  getUserId(): string | null {
    const token = this.getAuthToken();
    if (token) {
      const decodedToken: any = jwtDecode(token);  // Decode JWT Token
      return decodedToken?.userId || null;
    }
    return null;
  }

  // Check if the user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    return !!token;  // If Token exists, consider the user as logged in
  }

  
   // Update the username in the backend
   updateUsername(oldUsername: string, newUsername: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/update-username`, {
      oldUsername,
      newUsername
    });
  }

  // Chat service to exit a group
exitGroup(groupId: string, username: string): Observable<any> {
  return this.http.post<any>('http://localhost:3000/api/groups/exit-group', { groupId, username });
}

  
}
