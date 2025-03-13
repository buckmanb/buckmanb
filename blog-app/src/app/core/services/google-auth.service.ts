// src/app/core/services/google-auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ErrorService } from './error.service';
import { environment } from '../../../environments/environment';
import { Observable, from, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private authService = inject(AuthService);
  private router = inject(Router);
  private errorService = inject(ErrorService);
  private http = inject(HttpClient);

  // Server URL for Google authentication
  private serverUrl = environment.apiServerUrl || 'http://localhost:3000';

  /**
   * Redirect to Google login page (server-side flow)
   */
  redirectToGoogleLogin(): void {
    window.location.href = `${this.serverUrl}/api/auth/google`;
  }

  /**
   * Handle the callback from Google OAuth
   * @param token The ID token
   * @param email User's email
   * @param name User's display name
   * @param picture User's profile picture URL
   */
  async handleGoogleCallback(token: string, email: string, name: string, picture: string): Promise<void> {
    try {
      console.log('Handling Google callback with token', token);
      // Here we use your existing AuthService to handle the sign-in
      // This assumes your AuthService can process a Google ID token
      await this.authService.processGoogleToken(token, email, name, picture);
      
      this.router.navigate(['/']);
      this.errorService.showSuccess('Successfully signed in with Google!');
    } catch (error) {
      console.error('Error handling Google callback:', error);
      this.errorService.showError('Failed to authenticate with Google');
      this.router.navigate(['/auth/login']);
    }
  }
}