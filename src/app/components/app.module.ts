// src/app/app.module.ts
import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { ChatComponent } from './chat/chat.component';
import { LoginComponent } from './login/login.component';
import { RouterModule, Routes } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_ROUTES } from '../app.routes';  // Import route configuration
import { AuthInterceptor } from '../interceptors/auth-interceptor'; 

@NgModule({
  declarations: [],  // Remove component declarations
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot(APP_ROUTES),
    AppComponent,      // Include standalone component
    ChatComponent,     // Include standalone component
    LoginComponent,    // Include standalone component
  ],

  providers: [
    provideHttpClient()
  ],
})
export class AppModule {}
