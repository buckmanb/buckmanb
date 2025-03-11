// src/app/features/blog/comments/comment-form.component.ts
import { Component, EventEmitter, Input, Output, inject, signal, ViewChild, ElementRef, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommentService, Comment } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <form [formGroup]="commentForm" (ngSubmit)="onSubmit()" (click)="$event.stopPropagation()" class="comment-form" #commentFormElement>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ isEditing ? 'Edit your comment' : 'Write a comment' }}</mat-label>
        <textarea 
          matInput 
          formControlName="content" 
          rows="3" 
          [placeholder]="isReply 
            ? 'Write a reply...' 
            : (isEditing ? 'Edit your comment' : 'Join the discussion...')"
          cdkTextareaAutosize
          #autosize="cdkTextareaAutosize"
          cdkAutosizeMinRows="3"
          cdkAutosizeMaxRows="10">
        </textarea>
        <mat-error *ngIf="commentForm.get('content')?.hasError('required')">
          Comment content is required
        </mat-error>
        <mat-error *ngIf="commentForm.get('content')?.hasError('maxlength')">
          Comment cannot exceed 1000 characters
        </mat-error>
        <mat-hint align="end">{{ commentForm.get('content')?.value?.length || 0 }}/1000</mat-hint>
      </mat-form-field>
      
      <div class="comment-status" *ngIf="!isAdmin()">
        <p class="status-note" *ngIf="!isAutoApproved()">
          Note: Your comment will need to be approved by a moderator before it appears publicly.
        </p>
      </div>
      
      <div class="form-actions">
        <button 
          *ngIf="isEditing || isReply" 
          type="button" 
          mat-button 
          (click)="onCancel()"
          [disabled]="submitting()">
          Cancel
        </button>
        
        <button 
          type="submit" 
          mat-raised-button 
          color="primary"
          [disabled]="commentForm.invalid || submitting()">
          <span *ngIf="!submitting()">{{ getSubmitButtonText() }}</span>
          <mat-spinner *ngIf="submitting()" diameter="20"></mat-spinner>
        </button>
      </div>
    </form>
  `,
  styles: [`
    .comment-form {
      display: flex;
      flex-direction: column;
      margin-bottom: 16px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }
    
    button[type="submit"] {
      min-width: 120px;
      position: relative;
    }
    
    mat-spinner {
      margin: 0 auto;
    }
    
    .comment-status {
      margin-top: 4px;
      font-size: 0.85rem;
    }
    
    .status-note {
      color: var(--text-secondary);
      font-style: italic;
      margin: 0;
    }
  `]
})
export class CommentFormComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private commentService = inject(CommentService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  
  @Input() postId!: string;
  @Input() parentId?: string;
  @Input() commentId?: string;
  @Input() initialContent: string = '';
  @Input() isEditing: boolean = false;
  @Input() isReply: boolean = false;
  @Input() depth: number = 0;
  @Input() autoFocus: boolean = false;
  
  @Output() commentAdded = new EventEmitter<Comment>();
  @Output() commentUpdated = new EventEmitter<Comment>();
  @Output() cancelEdit = new EventEmitter<void>();
  
  @ViewChild('commentFormElement') formElement?: ElementRef;
  
  submitting = signal<boolean>(false);
  formInitialized = signal<boolean>(false);
  
  commentForm = this.fb.group({
    content: ['', [Validators.required, Validators.maxLength(1000)]]
  });
  
  // Listen for clicks outside the component
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    // Only process if form is initialized and not currently editing or submitting
    if (this.formInitialized() && !this.isEditing && !this.submitting()) {
      // Check if we have the form element reference
      if (this.formElement) {
        // Check if click is outside of form
        if (!this.formElement.nativeElement.contains(event.target)) {
          // If form is empty, cancel
          const content = this.commentForm.get('content')?.value;
          if (!content || content.trim() === '') {
            this.cancelEdit.emit();
          }
        }
      }
    }
  }
  
  ngOnInit() {
    if (this.initialContent) {
      this.commentForm.patchValue({ content: this.initialContent });
    }
  }
  
  ngAfterViewInit() {
    // Mark the form as initialized
    this.formInitialized.set(true);
    
    // If auto-focus is enabled, focus the textarea
    if (this.autoFocus && this.formElement) {
      setTimeout(() => {
        const textarea = this.formElement?.nativeElement.querySelector('textarea');
        if (textarea) {
          textarea.focus();
        }
      }, 100);
    }
  }
  
  isAdmin(): boolean {
    return this.authService.profile()?.role === 'admin';
  }
  
  isAutoApproved(): boolean {
    const role = this.authService.profile()?.role;
    return role === 'admin' || role === 'author';
  }
  
  getSubmitButtonText(): string {
    if (this.isEditing) {
      return 'Update';
    } else if (this.isReply) {
      return 'Reply';
    } else {
      return 'Post Comment';
    }
  }
  
  async onSubmit() {
    if (this.commentForm.invalid) return;
    
    const content = this.commentForm.get('content')?.value || '';
    
    this.submitting.set(true);
    
    try {
      if (this.isEditing && this.commentId) {
        // Update existing comment
        await this.commentService.updateComment(this.commentId, { content });
        
        // Construct updated comment object for UI update
        const user = this.authService.currentUser();
        const profile = this.authService.profile();
        
        if (!user || !profile) throw new Error('User not found');
        
        const updatedComment: Comment = {
          id: this.commentId,
          postId: this.postId,
          content,
          authorId: user.uid,
          authorName: profile.displayName,
          authorPhotoURL: profile.photoURL,
          depth: this.depth,
          status: this.isAutoApproved() ? 'approved' : 'pending',
          updatedAt: new Date()
        } as Comment;
        
        this.commentUpdated.emit(updatedComment);
        this.commentForm.reset();
        
        // Show success message
        const statusNote = this.isAutoApproved() 
          ? 'Comment updated successfully.'
          : 'Comment updated and awaiting approval.';
        this.snackBar.open(statusNote, 'Close', { duration: 3000 });
      } else {
        // Add new comment or reply
        const comment: Partial<Comment> = {
          postId: this.postId,
          content,
          depth: this.parentId ? this.depth + 1 : 0,
        };
        
        // Only add parentId if it exists - this is the key fix
        if (this.parentId) {
          comment.parentId = this.parentId;
        }
        
        const commentId = await this.commentService.addComment(comment);
        
        // For the UI, we'll create a complete comment object
        const user = this.authService.currentUser();
        const profile = this.authService.profile();
        
        if (!user || !profile) throw new Error('User not found');
        
        // Create the complete comment for UI updates
        const addedComment = {
          id: commentId,
          postId: this.postId,
          content,
          authorId: user.uid,
          authorName: profile.displayName,
          depth: this.parentId ? this.depth + 1 : 0,
          status: this.isAutoApproved() ? 'approved' : 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          likes: 0,
          replyCount: 0
        } as Comment;
        
        // Only add these properties if they exist
        if (profile.photoURL) {
          addedComment.authorPhotoURL = profile.photoURL;
        }
        
        if (this.parentId) {
          addedComment.parentId = this.parentId;
        }
        
        this.commentAdded.emit(addedComment);
        this.commentForm.reset();
        
        // Show success message
        const statusNote = this.isAutoApproved() 
          ? 'Comment posted successfully.'
          : 'Comment submitted and awaiting approval.';
        this.snackBar.open(statusNote, 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error saving comment:', error);
      this.snackBar.open('Error saving comment. Please try again.', 'Close', { duration: 3000 });
    } finally {
      this.submitting.set(false);
    }
  }
   
  onCancel() {
    this.commentForm.reset();
    this.cancelEdit.emit();
  }
}