import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmButton?: string;
  cancelButton?: string;
  color?: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ data.cancelButton || 'Cancel' }}</button>
      <button 
        mat-raised-button 
        [color]="data.color || 'primary'" 
        [mat-dialog-close]="true">
        {{ data.confirmButton || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .mat-dialog-title {
      margin: 0 0 16px;
    }
    
    .mat-dialog-content {
      margin: 0 0 24px;
    }
    
    .mat-dialog-actions {
      padding: 16px 0 0;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
