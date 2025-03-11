import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { EMPTY, catchError, finalize, from, tap } from 'rxjs';

@Component({
  selector: 'app-invite-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Invite User</h2>
    <form [formGroup]="inviteForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <p>Send an invitation email to a new user.</p>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" placeholder="user@example.com" required>
          <mat-error *ngIf="inviteForm.get('email')?.hasError('email')">
            Please enter a valid email address
          </mat-error>
          <mat-error *ngIf="inviteForm.get('email')?.hasError('required')">
            Email is required
          </mat-error>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Display Name</mat-label>
          <input matInput formControlName="displayName" placeholder="John Doe" required>
          <mat-error *ngIf="inviteForm.get('displayName')?.hasError('required')">
            Display name is required
          </mat-error>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Initial Role</mat-label>
          <mat-select formControlName="role" required>
            <mat-option value="user">User</mat-option>
            <mat-option value="author">Author</mat-option>
            <mat-option value="admin">Admin</mat-option>
          </mat-select>
          <mat-error *ngIf="inviteForm.get('role')?.hasError('required')">
            Role is required
          </mat-error>
        </mat-form-field>
        
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close [disabled]="isSubmitting">Cancel</button>
        <button 
          mat-raised-button 
          color="primary" 
          type="submit" 
          [disabled]="inviteForm.invalid || isSubmitting">
          <mat-spinner diameter="20" *ngIf="isSubmitting"></mat-spinner>
          <span *ngIf="!isSubmitting">Send Invitation</span>
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    
    mat-dialog-content {
      min-width: 350px;
    }
    
    button mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class InviteUserDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<InviteUserDialogComponent>);
  private functions = inject(Functions);
  private snackBar = inject(MatSnackBar);
  
  inviteForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    displayName: ['', Validators.required],
    role: ['user', Validators.required]
  });
  
  isSubmitting = false;
  
  onSubmit() {
    if (this.inviteForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    
    const { email, displayName, role } = this.inviteForm.value;
    
    const inviteUser = httpsCallable(this.functions, 'inviteUser');
    
    from(inviteUser({ email, displayName, role })).pipe(
      tap(() => {
        this.snackBar.open(`Invitation sent to ${email}`, 'Close', {
          duration: 3000
        });
        this.dialogRef.close(true);
      }),
      catchError(error => {
        console.error('Error inviting user:', error);
        this.snackBar.open(`Error: ${error.message}`, 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
        return EMPTY;
      }),
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe();
  }
}
