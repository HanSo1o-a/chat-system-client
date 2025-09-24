import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/components/app.component'; 
import { APP_ROUTES } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  
  providers: [provideHttpClient(),
    provideRouter(APP_ROUTES)]
}).catch(err => console.error(err));