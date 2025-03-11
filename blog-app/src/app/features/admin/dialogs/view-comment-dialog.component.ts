import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Comment } from '../../../core/services/comment.service';

export interface ViewCommentDialogData {
  comment: Comment;
  postTitle: string;
}

@Component({
  selector: 'app-view-comment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Comment by {{ data.comment.authorName }}</h2>
    <div mat-dialog-content>
      <p class="post-info">On post: {{ data.postTitle }}</p>
      <p class="date-info">Posted: {{ formatDate(data.comment.createdAt) }}</p>
      
      <div class="comment-content">
        {{ data.comment.content }}
      </div>
      
      <div *ngIf="data.comment.flagReason" class="flag-info">
        <h3>Flag reason:</h3>
        <p>{{ data.comment.flagReason }}</p>
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </div>
  `,
  styles: [`
    .post-info, .date-info {
      color: var(--text-secondary);
      margin-bottom: 8px;
    }
    
    .comment-content {
      margin: 16px 0;
      padding: 16px;
      background-color: var(--surface-color);
      border-radius: 4px;
      white-space: pre-wrap;
    }
    
    .flag-info {
      margin-top: 16px;
      padding: 8px 16px;
      background-color: rgba(244, 67, 54, 0.1);
      border-left: 3px solid var(--error-color);
      border-radius: 2px;
    }
    
    .flag-info h3 {
      margin-top: 8px;
      margin-bottom: 4px;
      font-size: 1rem;
      color: var(--error-color);
    }
  `]
})
export class ViewCommentDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ViewCommentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ViewCommentDialogData
  ) {}
  
  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}