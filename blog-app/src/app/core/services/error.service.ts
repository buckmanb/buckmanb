// src/app/core/services/error.service.ts
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private snackBar = inject(MatSnackBar);

  showError(error: any) {
    let message = 'An error occurred';

    if (error?.message) {
      // Handle Firebase specific errors
      if (error.message.includes('auth/invalid-email')) {
        message = 'Invalid email address';
      } else if (error.message.includes('auth/invalid-credential')) {
        message = 'Invalid username/password combination';
      }
      else if (error.message.includes('auth/user-not-found')) {
        message = 'User not found';
      } else if (error.message.includes('auth/wrong-password')) {
        message = 'Invalid password';
      } else if (error.message.includes('auth/email-already-in-use')) {
        message = 'Email is already registered';
      } else if (error.message.includes('auth/popup-closed-by-user')) {
        message = 'Sign in was cancelled';
      } else if (error.message.includes('auth/cancelled-popup-request')) {
        message = 'Only one popup can be open at a time';
      } else if (error.message.includes('auth/popup-blocked')) {
        message = 'Sign in popup was blocked by the browser';
      } else {
        message = error.message;
      }
    }

    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }

  showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['success-snackbar']
    });
  }
}