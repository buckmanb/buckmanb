import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { ErrorService } from '../services/error.service';
import { GoogleAuthService } from '../services/google-auth.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

declare global {
  const google: any;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatIconModule,
    RouterLink
  ],
  animations: [
    trigger('fadeSlideInOut', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(-10px)'
      })),
      transition('void <=> *', animate('300ms ease-in-out'))
    ]),
    trigger('loadingOverlay', [
      state('void', style({
        opacity: 0
      })),
      state('*', style({
        opacity: 1
      })),
      transition('void <=> *', animate('200ms ease-in-out'))
    ])
  ],
  template: `
    <div class="flex justify-center items-center min-h-[80vh]">
      <mat-card class="max-w-md w-full m-4 login-card">
        <!-- Loading overlay animation -->
        <div 
          *ngIf="loading()" 
          @loadingOverlay 
          class="loading-overlay">
          <div class="loading-content">
            <mat-progress-spinner
              [diameter]="50"
              [strokeWidth]="4"
              mode="indeterminate"
              color="primary">
            </mat-progress-spinner>
            <p class="loading-text">Processing...</p>
          </div>
        </div>
        
        <mat-card-header>
          <mat-card-title>Login</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 mt-4">
            <!-- Display form-level errors -->
            <div *ngIf="loginForm.errors?.['customError']" @fadeSlideInOut class="error-alert">
              <div>
                <mat-icon class="error-icon">error</mat-icon> 
                {{loginForm.errors?.['customError']}}
              </div>
            </div>

            <mat-form-field style="display: block;">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" [readonly]="loading()">
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>

            <mat-form-field style="display: block;">
              <mat-label>Password</mat-label>
              <input matInput formControlName="password" type="password" [readonly]="loading()">
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
              <mat-error *ngIf="loginForm.get('password')?.hasError('minlength')">
                Password must be at least 6 characters
              </mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" 
                    [disabled]="!loginForm.valid || loading()"
                    class="w-full login-button">
              <span>Login</span>
            </button>
          </form>

          <mat-divider class="my-4"></mat-divider>

          <button mat-stroked-button 
                  (click)="onGoogleLogin()"
                  [disabled]="loading()"
                  class="w-full google-btn">
            <div class="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" class="google-icon">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>Login with Google</span>
            </div>
          </button>         

          <div class="mt-4 text-center">
            <a mat-button routerLink="/auth/signup" [disabled]="loading()">
              Need an account? Sign up
            </a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-card {
      position: relative;
      overflow: hidden;
    }
    
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10;
      backdrop-filter: blur(2px);
    }
    
    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    
    .loading-text {
      color: var(--primary-color);
      font-weight: 500;
      font-size: 1rem;
      letter-spacing: 0.5px;
      animation: pulse 1.5s infinite;
    }
    
    @keyframes pulse {
      0% {
        opacity: 0.6;
      }
      50% {
        opacity: 1;
      }
      100% {
        opacity: 0.6;
      }
    }
    
    .login-button {
      height: 36px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .google-btn {
      height: 40px !important;
      font-weight: 500 !important;
      letter-spacing: 0.25px;
      border: 1px solid #dadce0 !important;
      background-color: white !important;
      color: #3c4043 !important;
      transition: all 0.2s ease;
      
      &:hover:not([disabled]) {
        background-color: #f8f9fa !important;
        box-shadow: 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15) !important;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .google-icon {
        margin-right: 8px;
        vertical-align: middle;
      }
    }

    .error-alert {
      background-color: rgba(244, 67, 54, 0.1);
      color: #f44336;
      padding: 10px 16px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-left: 3px solid #f44336;
    }

    .error-alert div {
      display: flex;
      align-items: center;
    }

    .error-icon {
      margin-right: 8px;
      font-size: 18px;
      height: 18px;
      width: 18px;
    }

    :host {
      display: block;
    }

    .my-4 {
      margin-top: 1rem;
      margin-bottom: 1rem;
    }

    .mt-4 {
      margin-top: 1rem;
    }

    .w-full {
      width: 100%;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private errorService = inject(ErrorService);
  private googleAuthService = inject(GoogleAuthService);
  
  loginForm = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Single loading state for the entire form
  loading = signal<boolean>(false);

  onServerGoogleLogin() {
    if (this.loading()) return;
    
    this.loading.set(true);
    this.googleAuthService.redirectToGoogleLogin();
      // .catch((error: any) => {
      //   this.handleLoginError(error);
      //   this.loading.set(false);
      // });
  }

  async onSubmit() {
    if (this.loginForm.valid && !this.loading()) {
      try {
        this.loading.set(true);
        const { email, password } = this.loginForm.getRawValue();
        
        try {
          await this.authService.emailSignIn(email, password);
        } catch (error: any) {
          this.handleLoginError(error);
          throw error; // Re-throw to ensure we skip to finally block
        }
      } catch (error: any) {
        console.error('Login error:', error.message || error);
      } finally {
        this.loading.set(false);
      }
    }
  }
  
  /**
   * Google login with optimized cancellation handling
   */
  async onGoogleLogin() {
    if (this.loading()) return;
    
    this.loading.set(true);
    
    try {
      await this.authService.googleSignIn();
    } catch (error: any) {
      this.handleLoginError(error);
    } finally {
      this.loading.set(false);
    }
  }
  
  /**
   * Centralized error handling for both login methods
   */
  private handleLoginError(error: any): void {
    // Get error code from error message or error object
    const errorCode = error.code || 
                    (error.message && error.message.includes('auth/') ? 
                    error.message.split('auth/')[1].split(')')[0] : 
                    'unknown-error');
    
    // If user cancelled Google login, just return without error message
    if (
      errorCode === 'auth/popup-closed-by-user' || 
      (error.message && (
        error.message.includes('popup closed') ||
        error.message.includes('cancel')
      ))
    ) {
      console.log('User cancelled login');
      return;
    }
    
    // Determine the appropriate error message
    let errorMessage: string;
    switch (errorCode) {
      case 'invalid-credential':
      case 'invalid-email':
      case 'user-not-found':
      case 'wrong-password':
        errorMessage = 'Invalid email or password';
        break;
      case 'user-disabled':
        errorMessage = 'This account has been disabled';
        break;
      case 'too-many-requests':
        errorMessage = 'Too many failed login attempts. Please try again later';
        break;
      case 'network-request-failed':
        errorMessage = 'Network error. Please check your internet connection';
        break;
      case 'auth/popup-blocked':
        errorMessage = 'Sign-in popup was blocked. Please allow popups for this site';
        break;
      default:
        errorMessage = 'Login failed. Please try again';
        break;
    }
    
    // Set the form error
    this.loginForm.setErrors({ customError: errorMessage });
  }
}