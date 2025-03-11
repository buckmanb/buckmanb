// src/app/core/auth/google-callback.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GoogleAuthService } from '../services/google-auth.service';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="callback-container">
      <mat-spinner diameter="50"></mat-spinner>
      <p>Completing sign-in process...</p>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      height: 100vh;
      text-align: center;
    }
  `]
})
export class GoogleCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private googleAuthService = inject(GoogleAuthService);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const email = params['email'];
      const name = params['name'];
      const picture = params['picture'];
      const error = params['error'];
      console.log("GooglCallbackComponent ngOnInit");
      console.log(params);

      if (error) {
        console.error('Authentication error:', error);
        this.router.navigate(['/auth/login'], { 
          queryParams: { error: 'Authentication failed' } 
        });
        return;
      }

      if (!token || !email) {
        console.error('Missing token or email in callback');
        this.router.navigate(['/auth/login'], { 
          queryParams: { error: 'Invalid authentication response' } 
        });
        return;
      }

      // Process the authentication
      this.googleAuthService.handleGoogleCallback(token, email, name, picture)
        .catch(err => {
          console.error('Failed to handle Google callback:', err);
          this.router.navigate(['/auth/login'], { 
            queryParams: { error: 'Authentication processing failed' } 
          });
        });
    });
  }
}