// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';  // Login component
import { ChatComponent } from './components/chat/chat.component';  // Chat component
import { RegisterComponent } from './components/register/register';  // Import RegisterComponent
import { AdminComponent } from './components/admin/admin.component';
import { AuthGuard } from '../app/guard/auth.guard';

// Define and export APP_ROUTES
export const APP_ROUTES: Routes = [

    { path: '', component: LoginComponent },
    { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },  // Login page
    { path: 'register', component: RegisterComponent },  // Register page
    { path: 'chat', component: ChatComponent }
];
