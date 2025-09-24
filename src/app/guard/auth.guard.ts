// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../components/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    
    const token = this.authService.getAuthToken();  // Get Token
    const userRole = this.authService.getUserRole();  // Get user role
    console.log(userRole);

    // If there is a token and the role is admin or superadmin, allow access
    if (token && (userRole === 'admin' || userRole === 'superadmin')) {
      return true;  // Allow access
    } else {
      this.router.navigate(['/login']);  // If not logged in or role is not suitable, redirect to login page
      return false;
    }
  }
}
