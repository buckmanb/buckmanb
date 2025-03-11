// src/app/features/blog/comments/flag-comment-dialog.component.ts
import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommentService } from '../../../core/services/comment.service';

export interface FlagCommentDialogData {
  width: string;
  commentId: string;
}

@Component({
  selector: 'app-flag-comment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Flag Comment</h2>
    <div mat-dialog-content>
      <p>Please tell us why you're flagging this comment:</p>
      
      <form [formGroup]="flagForm">
        <mat-radio-group formControlName="reason" class="flag-radio-group">
          <mat-radio-button value="spam">Spam</mat-radio-button>
          <mat-radio-button value="offensive">Offensive content</mat-radio-button>
          <mat-radio-button value="harassment">Harassment</mat-radio-button>
          <mat-radio-button value="other">Other</mat-radio-button>
        </mat-radio-group>
        
        <mat-form-field *ngIf="needsExplanation()" appearance="outline" class="full-width">
          <mat-label>Please explain</mat-label>
          <textarea 
            matInput 
            formControlName="explanation"
            rows="3"
            placeholder="Please provide more details about why this comment is inappropriate">
          </textarea>
          <mat-error *ngIf="flagForm.get('explanation')?.hasError('required')">
            Explanation is required when selecting 'Other'
          </mat-error>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button 
        mat-raised-button 
        color="warn" 
        [disabled]="!flagForm.valid || submitting()"
        (click)="submitFlag()">
        <span *ngIf="!submitting()">Flag Comment</span>
        <mat-spinner *ngIf="submitting()" diameter="20"></mat-spinner>
      </button>
    </div>
  `,
  styles: [`
    .flag-radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .full-width {
      width: 100%;
    }
  `]
})
export class FlagCommentDialogComponent {
  private fb = inject(FormBuilder);
  private commentService = inject(CommentService);
  private dialogRef = inject(MatDialogRef<FlagCommentDialogComponent>);
  private commentId: string = '';
    
  submitting = signal<boolean>(false);
  
  flagForm = this.fb.group({
    reason: ['spam', Validators.required],
    explanation: ['']
  });
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FlagCommentDialogData
  ) {
    // this.commentId = this.data.commentId;

    console.debug(data.commentId);

    // Add conditional validation for explanation
    this.flagForm.get('reason')?.valueChanges.subscribe(reason => {
      const explanationControl = this.flagForm.get('explanation');
      if (reason === 'other') {
        explanationControl?.setValidators(Validators.required);
      } else {
        explanationControl?.clearValidators();
      }
      explanationControl?.updateValueAndValidity();
    });
  }
  
  needsExplanation(): boolean {
    return this.flagForm.get('reason')?.value === 'other';
  }
  
  async submitFlag() {
    if (!this.flagForm.valid) return;
    
    this.submitting.set(true);
    
    try {
      // Get form values
      const reason = this.flagForm.get('reason')?.value || 'spam';
      const explanation = this.flagForm.get('explanation')?.value || '';
      
      // Combine reason and explanation
      let flagReason = reason;
      if (reason === 'other' && explanation) {
        flagReason = `${reason}: ${explanation}`;
      }
      
      // Flag the comment
      await this.commentService.flagCommentByUser(this.data.commentId, flagReason);
      
      // Close the dialog with success
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error flagging comment:', error);
    } finally {
      this.submitting.set(false);
    }
  }
}