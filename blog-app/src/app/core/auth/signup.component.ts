import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from './auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    RouterLink
  ],
  template: `
    <div class="flex justify-center items-center min-h-[80vh]">
      <mat-card class="max-w-md w-full m-4">
        <mat-card-header>
          <mat-card-title>Sign Up</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 mt-4">
            <mat-form-field>
              <mat-label>Display Name</mat-label>
              <input matInput formControlName="displayName">
            </mat-form-field>

            <mat-form-field>
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email">
            </mat-form-field>

            <mat-form-field>
              <mat-label>Password</mat-label>
              <input matInput formControlName="password" type="password">
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" [disabled]="!signupForm.valid">
              Sign Up
            </button>
          </form>

          <mat-divider class="my-4"></mat-divider>

          <button mat-stroked-button color="accent" class="w-full" (click)="onGoogleSignup()">
            Sign up with Google
          </button>

          <div class="mt-4 text-center">
            <a mat-button routerLink="/auth/login">Already have an account? Login</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class SignupComponent {
  signupForm = inject(FormBuilder).nonNullable.group({
    displayName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    if (this.signupForm.valid) {
      try {
        const { email, password, displayName } = this.signupForm.getRawValue();
        await this.authService.emailSignUp(email, password, displayName);
      } catch (error) {
        console.error('Signup error:', error);
        // Handle error (show message to user)
      }
    }
  }

  async onGoogleSignup() {
    try {
      await this.authService.googleSignIn();
    } catch (error) {
      console.error('Google signup error:', error);
      // Handle error (show message to user)
    }
  }
}