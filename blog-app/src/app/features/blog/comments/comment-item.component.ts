// src/app/features/blog/comments/comment-item.component.ts
import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { CommentService, Comment } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/auth/auth.service';
import { CommentFormComponent } from './comment-form.component';
import { FlagCommentDialogComponent } from './flag-comment-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    CommentFormComponent,
    RouterModule
  ],
  template: `
    <div class="comment-container" [style.margin-left.px]="indentForDepth(comment.depth)">
      <mat-card class="comment-card" [class.deleted]="comment.status === 'deleted'">
        <div class="comment-header">
        <div class="author-info">
            <div class="author-avatar clickable-avatar">
              <img *ngIf="comment.authorPhotoURL" 
                  [src]="comment.authorPhotoURL" 
                  alt="Author" 
                  [routerLink]="['/user/profile', comment.authorId]" 
                  class="clickable-avatar"/>
              <mat-icon *ngIf="!comment.authorPhotoURL"
                        [routerLink]="['/user/profile', comment.authorId]"
                        class="clickable-avatar">account_circle</mat-icon>
            </div>
            <div class="author-details">
              <div class="author-name clickable-name" [routerLink]="['/user/profile', comment.authorId]">
                {{ comment.authorName }}
              </div>
              <div class="comment-date">{{ formatDate(comment.createdAt) }}</div>
            </div>
          </div>
          <!-- Status badge for admins -->
          <div *ngIf="isAdmin() && comment.status !== 'approved' && comment.status !== 'deleted'" class="status-badge">
            <span [class]="'badge badge-' + comment.status">{{ comment.status }}</span>
          </div>
          
          <!-- Comment actions menu for author or admin -->
          <button *ngIf="canModifyComment() && comment.status !== 'deleted'" 
                  mat-icon-button 
                  [matMenuTriggerFor]="commentMenu"
                  aria-label="Comment actions">
            <mat-icon>more_vert</mat-icon>
          </button>
          
          <mat-menu #commentMenu="matMenu">
            <button mat-menu-item *ngIf="canEditComment()" (click)="startEditing()">
              <mat-icon>edit</mat-icon>
              <span>Edit</span>
            </button>
            <button mat-menu-item (click)="deleteComment()">
              <mat-icon color="warn">delete</mat-icon>
              <span>Delete</span>
            </button>
          </mat-menu>
        </div>
        
        <mat-card-content>
          <!-- Comment content - shown when not editing -->
          <div *ngIf="!isEditing()" class="comment-content" [class.deleted]="comment.status === 'deleted'">
            {{ comment.content }}
          </div>
          
          <!-- Edit timestamp if edited -->
          <div *ngIf="!isEditing() && isEdited()" class="edit-timestamp">
            Edited {{ formatDate(comment.updatedAt) }}
          </div>
          
          <!-- Comment edit form - shown when editing -->
          <div *ngIf="isEditing()" class="comment-edit-form">
            <app-comment-form 
              [initialContent]="comment.content" 
              [isEditing]="true"
              [isReply]="false"
              [depth]="comment.depth"
              [postId]="postId"
              [commentId]="comment.id!"
              (commentUpdated)="onCommentUpdated($event)"
              (cancelEdit)="cancelEditing()">
            </app-comment-form>
          </div>
        </mat-card-content>
        
        <mat-card-actions>
          <button mat-button (click)="likeComment()" [disabled]="likeInProgress() || comment.status === 'deleted'">
            <mat-icon>{{ isLiked() ? 'favorite' : 'favorite_border' }}</mat-icon>
            {{ comment.likes || 0 }}
          </button>
          
          <button mat-button (click)="handleReplyClick($event)" [disabled]="comment.status === 'deleted' || comment.depth >= maxDepth">
            <mat-icon>reply</mat-icon>
            Reply
            <span *ngIf="comment.replyCount && comment.replyCount > 0">({{ comment.replyCount }})</span>
          </button>
          
          <button mat-button (click)="openFlagDialog()" [disabled]="comment.status === 'deleted'">
            <mat-icon>flag</mat-icon>
            Flag
          </button>
          
          <!-- Moderation actions for admin -->
          <ng-container *ngIf="isAdmin() && comment.status !== 'deleted'">
            <button *ngIf="comment.status !== 'approved'" mat-button color="primary" (click)="approveComment()">
              <mat-icon>check_circle</mat-icon>
              Approve
            </button>
            <button *ngIf="comment.status !== 'flagged'" mat-button color="warn" (click)="flagComment()">
              <mat-icon>flag</mat-icon>
              Flag
            </button>
          </ng-container>
        </mat-card-actions>
      </mat-card>
      
      <!-- Reply form -->
      <div *ngIf="showReplyForm()" class="reply-form">
        <app-comment-form 
          [postId]="postId" 
          [parentId]="comment.id!"
          [isReply]="true"
          [depth]="comment.depth"
          [autoFocus]="true"
          (commentAdded)="onReplyAdded($event)"
          (cancelEdit)="toggleReplyForm()">
        </app-comment-form>
      </div>
      
      <!-- Replies section -->
      <div *ngIf="hasReplies()" class="replies-section">
        <div *ngIf="repliesLoading()" class="replies-loading">
          <mat-spinner diameter="30"></mat-spinner>
        </div>
        
        <div *ngIf="!repliesLoading() && showReplies()" class="replies-container">
          <app-comment-item 
            *ngFor="let reply of replies()" 
            [comment]="reply"
            [postId]="postId"
            [maxDepth]="maxDepth"
            (commentDeleted)="onReplyDeleted($event)"
            (commentUpdated)="onReplyUpdated($event)"
            (replyAdded)="onNestedReplyAdded($event)">
          </app-comment-item>
          
          <div *ngIf="hasMoreReplies()" class="load-more">
            <button mat-button color="primary" (click)="loadMoreReplies()" [disabled]="loadingMoreReplies()">
              {{ loadingMoreReplies() ? 'Loading...' : 'Load More Replies' }}
            </button>
          </div>
        </div>

        <div *ngIf="!repliesLoading() && !showReplies() && hasReplies()" class="toggle-replies">
          <a href="#" (click)="toggleReplies(); $event.preventDefault()" class="reply-count-link">
            View {{ comment.replyCount }} {{ comment.replyCount === 1 ? 'reply' : 'replies' }}
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .comment-container {
      position: relative;
      margin-bottom: 0;
      padding-left: 32px;
      
      &::before {
        content: '';
        position: absolute;
        left: 22px;
        top: -6px;
        bottom: 24px;
        border-left: 2px solid rgba(0, 0, 0, 0.1);
        border-radius: 2px;
      }
    }
    
    .comment-card {
      margin-bottom: 8px;
      transition: background-color 0.3s ease;
    }
    
    .comment-card.deleted {
      background-color: rgba(0, 0, 0, 0.03);
    }
    
    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    
    .author-info {
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
    }

    
    
    .author-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--surface-color);
      position: relative;
      margin-right: 8px;
      margin-left: -12px;
      z-index: 1;
      border: 2px solid white;
      
      &::after {
        content: '';
        position: absolute;
        left: -26px;
        top: 14px;
        height: 2px;
        width: 24px;
        border-bottom: 2px solid rgba(0, 0, 0, 0.1);
        border-radius: 0 0 0 4px;
      }
    }
    
    .author-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .author-avatar mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--text-secondary);
    }
    
    .author-avatar.clickable-avatar {
      cursor: pointer;
      transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
      position: relative;
    }

    .author-avatar.clickable-avatar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 50%;
      box-shadow: 0 0 0 2px transparent;
      transition: box-shadow 0.2s ease;
    }

    .author-avatar.clickable-avatar:hover {
      transform: scale(1.05);
      opacity: 0.9;
    }

    .author-avatar.clickable-avatar:hover::after {
      box-shadow: 0 0 0 2px var(--primary-color);
    }

    .author-avatar.clickable-avatar img,
    .author-avatar.clickable-avatar mat-icon {
      cursor: pointer;
    }


    .author-details {
      display: flex;
      flex-direction: column;
    }
    
    .author-name {
      font-weight: 500;
    }

    .author-name.clickable-name {
      color: var(--primary-color);
      cursor: pointer;
      position: relative;
      display: inline-block;
      transition: color 0.2s ease;
    }

    .author-name.clickable-name::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 1px;
      bottom: -2px;
      left: 0;
      background-color: var(--primary-color);
      transform: scaleX(0);
      transform-origin: bottom left;
      transition: transform 0.2s ease;
    }

    .author-name.clickable-name:hover {
      color: var(--primary-darker);
    }

    .author-name.clickable-name:hover::after {
      transform: scaleX(1);
    }    
    
    .comment-date {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    
    .comment-content {
      white-space: pre-wrap;
      margin-bottom: 8px;
      word-break: break-word;
    }
    
    .comment-content.deleted {
      font-style: italic;
      color: var(--text-secondary);
    }
    
    .edit-timestamp {
      font-size: 0.8rem;
      color: var(--text-secondary);
      font-style: italic;
      margin-top: 4px;
    }
    
    .status-badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      margin-right: 8px;
    }
    
    .badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
    }
    
    .badge-pending {
      background-color: #FFC107;
      color: black;
    }
    
    .badge-flagged {
      background-color: #F44336;
      color: white;
    }
    
    .reply-form {
      padding-left: 16px;
      border-left: 2px solid var(--primary-lighter);
      margin-bottom: 16px;
    }
    
    .replies-section {
      margin-top: 8px;
    }
    
    .replies-loading {
      display: flex;
      justify-content: center;
      padding: 16px;
    }
    
    .replies-container {
      margin-top: 8px;
    }
    
    .toggle-replies {
      margin-top: 8px;
    }

    .reply-count-link {
      color: var(--primary-color);
      text-decoration: none;
      cursor: pointer;
      font-weight: 500;
      &:hover {
        text-decoration: underline;
      }
    }
    
    .load-more {
      margin-top: 8px;
      display: flex;
      justify-content: center;
    }

  `]
})
export class CommentItemComponent implements OnInit {
  private commentService = inject(CommentService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  
  @Input() comment!: Comment;
  @Input() postId!: string;
  @Input() maxDepth: number = 10;
  
  @Output() commentDeleted = new EventEmitter<string>();
  @Output() commentUpdated = new EventEmitter<Comment>();
  @Output() replyAdded = new EventEmitter<Comment>();
  
  isEditing = signal<boolean>(false);
  showReplyForm = signal<boolean>(false);
  isLiked = signal<boolean>(false);
  likeInProgress = signal<boolean>(false);
  
  // Replies management
  replies = signal<Comment[]>([]);
  repliesLoading = signal<boolean>(false);
  showReplies = signal<boolean>(false); // Start with replies collapsed
  hasMoreReplies = signal<boolean>(false);
  loadingMoreReplies = signal<boolean>(false);
  lastVisibleReply: any = null;
  
  ngOnInit() {
    // No initial load - replies will load when user clicks "View replies"
  }
  
  async loadReplies() {
    if (!this.comment.id) return;
    
    try {
      this.repliesLoading.set(true);
      const { replies, lastVisible } = await this.commentService.getRepliesByCommentId(this.comment.id);
      
      this.replies.set(replies);
      this.lastVisibleReply = lastVisible;
      this.hasMoreReplies.set(replies.length >= 10); // Assuming batch size is 10
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      this.repliesLoading.set(false);
    }
  }
  
  async loadMoreReplies() {
    if (!this.comment.id || !this.lastVisibleReply) return;
    
    try {
      this.loadingMoreReplies.set(true);
      const { replies, lastVisible } = await this.commentService.getRepliesByCommentId(
        this.comment.id, 
        this.lastVisibleReply
      );
      
      // Append new replies to existing ones
      this.replies.update(current => [...current, ...replies]);
      
      // Update pagination
      this.lastVisibleReply = lastVisible;
      this.hasMoreReplies.set(replies.length >= 10); // Assuming batch size is 10
    } catch (error) {
      console.error('Error loading more replies:', error);
    } finally {
      this.loadingMoreReplies.set(false);
    }
  }
  
  canModifyComment(): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;
    
    const isAuthor = currentUser.uid === this.comment.authorId;
    const isAdmin = this.authService.profile()?.role === 'admin';
    
    return isAuthor || isAdmin;
  }
  
  canEditComment(): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;
    
    // Only author can edit their own comment, admins cannot edit others' comments
    return currentUser.uid === this.comment.authorId;
  }
  
  isAdmin(): boolean {
    return this.authService.profile()?.role === 'admin';
  }
  
  hasReplies(): boolean {
    return (this.comment.replyCount && this.comment.replyCount > 0) || this.replies().length > 0;
  }
  
  isEdited(): boolean {
    // If createdAt and updatedAt are different by more than a minute, it was edited
    if (!this.comment.createdAt || !this.comment.updatedAt) return false;
    
    const createdAt = this.comment.createdAt.toDate ? 
      this.comment.createdAt.toDate() : new Date(this.comment.createdAt);
    const updatedAt = this.comment.updatedAt.toDate ? 
      this.comment.updatedAt.toDate() : new Date(this.comment.updatedAt);
    
    return Math.abs(updatedAt.getTime() - createdAt.getTime()) > 60000; // 1 minute
  }
  
  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    // If date is today, show only time
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    
    // If date is within the last 7 days, show day of week and time
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if (date > oneWeekAgo) {
      return date.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + 
        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  indentForDepth(depth: number): number {
    // Apply indentation on all devices
    const maxVisualDepth = 8; // Maximum visual indentation
    return Math.min(depth, maxVisualDepth) * 20; // 20px per level
  }
  
  startEditing() {
    this.isEditing.set(true);
  }
  
  cancelEditing() {
    this.isEditing.set(false);
  }
  
  toggleReplyForm(): void {
    console.log('Toggling reply form, current state:', this.showReplyForm());
    this.showReplyForm.update(value => !value);
    console.log('New reply form state:', this.showReplyForm());
  }
  
  // Then add this method to the component class:
  handleReplyClick(event: MouseEvent): void {
    // Prevent event bubbling
    event.stopPropagation();
    
    // Log for debugging
    console.log('Reply button clicked');
    
    // Toggle the reply form
    this.toggleReplyForm();
  }
  
  async toggleReplies() {
    // Only load replies if we haven't loaded any yet - subsequent toggles just show/hide cached replies
    if (this.replies().length === 0 && this.comment.replyCount && this.comment.replyCount > 0) {
      await this.loadReplies();
    }
    this.showReplies.update(value => !value); // Just toggles visibility of already loaded replies
  }
  
  async deleteComment() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Delete Comment',
        message: 'Are you sure you want to delete this comment? This action cannot be undone.',
        confirmButton: 'Delete',
        cancelButton: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.commentService.deleteComment(this.comment.id!);
          
          // If the comment has no replies, remove it completely
          if (!this.comment.replyCount || this.comment.replyCount === 0) {
            this.commentDeleted.emit(this.comment.id);
          } else {
            // Otherwise just update the UI to mark it as deleted
            this.comment = { 
              ...this.comment, 
              content: '[This comment has been deleted]', 
              status: 'deleted' 
            };
            this.commentUpdated.emit(this.comment);
          }
        } catch (error) {
          console.error('Error deleting comment:', error);
        }
      }
    });
  }
  
  async likeComment() {
    if (this.likeInProgress()) return;
    
    this.likeInProgress.set(true);
    
    try {
      await this.commentService.likeComment(this.comment.id!);
      
      // Update local state
      this.isLiked.update(value => !value);
      const newLikes = (this.comment.likes || 0) + (this.isLiked() ? 1 : -1);
      
      this.comment = { ...this.comment, likes: newLikes };
      this.commentUpdated.emit(this.comment);
    } catch (error) {
      console.error('Error liking comment:', error);
    } finally {
      this.likeInProgress.set(false);
    }
  }
  
  openFlagDialog() {
    const dialogRef = this.dialog.open(FlagCommentDialogComponent, {
      width: '400px',
      data: { commentId: this.comment.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Update UI to reflect the flagged status
        this.comment = { ...this.comment, status: 'flagged' };
        this.commentUpdated.emit(this.comment);
      }
    });
  }
  
  async approveComment() {
    try {
      await this.commentService.moderateComment(this.comment.id!, 'approved');
      
      this.comment = { ...this.comment, status: 'approved' };
      this.commentUpdated.emit(this.comment);
    } catch (error) {
      console.error('Error approving comment:', error);
    }
  }
  
  async flagComment() {
    try {
      await this.commentService.moderateComment(this.comment.id!, 'flagged');
      
      this.comment = { ...this.comment, status: 'flagged' };
      this.commentUpdated.emit(this.comment);
    } catch (error) {
      console.error('Error flagging comment:', error);
    }
  }
  
  onCommentUpdated(updatedComment: Comment) {
    this.comment = updatedComment;
    this.commentUpdated.emit(updatedComment);
    this.isEditing.set(false);
  }
  
  onReplyAdded(reply: Comment) {
    // Add new reply to the list of replies
    this.replies.update(replies => [reply, ...replies]);
    
    // Increment reply count on the parent comment
    this.comment = { 
      ...this.comment, 
      replyCount: (this.comment.replyCount || 0) + 1 
    };
    
    // Ensure replies are visible when adding a new reply
    this.showReplies.set(true);
    
    // Forward the event
    this.replyAdded.emit(reply);
    
    // Close the reply form
    this.showReplyForm.set(false);
  }
  
  onReplyDeleted(replyId: string) {
    // Remove the reply from the list
    this.replies.update(replies => replies.filter(r => r.id !== replyId));
    
    // Decrement reply count on the parent comment
    this.comment = { 
      ...this.comment, 
      replyCount: Math.max(0, (this.comment.replyCount || 0) - 1) 
    };
  }
  
  onReplyUpdated(updatedReply: Comment) {
    // Update the reply in the list
    this.replies.update(replies => 
      replies.map(r => r.id === updatedReply.id ? updatedReply : r)
    );
  }
  
  onNestedReplyAdded(reply: Comment) {
    // Just forward the event up
    this.replyAdded.emit(reply);
  }
}
