// src/app/features/blog/comments/comment-list.component.ts
import { Component, Input, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { CommentService, Comment } from '../../../core/services/comment.service';
import { CommentItemComponent } from './comment-item.component';
import { CommentFormComponent } from './comment-form.component';
import { AuthService } from '../../../core/auth/auth.service';
import { InfiniteScrollDirective } from '../../../shared/directives/infinite-scroll.directive';
import { Subscription } from 'rxjs';
import { DocumentSnapshot, DocumentData } from '@angular/fire/firestore';

@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    CommentItemComponent,
    CommentFormComponent,
    InfiniteScrollDirective
  ],
  template: `
    <div class="comments-container">
      <h2 class="comments-header">
        Comments <span *ngIf="totalComments() > 0">({{ totalComments() }})</span>
      </h2>
      
      <!-- Comment form for logged in users -->
      <div class="comment-form-wrapper" *ngIf="isLoggedIn()">
        <div *ngIf="showCommentForm()" class="comment-form-container">
          <app-comment-form 
            [postId]="postId" 
            [autoFocus]="true"
            (commentAdded)="onCommentAdded($event)"
            (cancelEdit)="hideCommentForm()">
          </app-comment-form>
        </div>
        <div *ngIf="!showCommentForm()" class="comment-trigger">
          <button mat-stroked-button color="primary" (click)="showCommentFormTrigger($event)">
            <mat-icon>comment</mat-icon>
            Leave a comment
          </button>
        </div>
      </div>
      
      <!-- Login prompt for users not logged in -->
      <div class="login-prompt" *ngIf="!isLoggedIn()">
        <p>Please <a routerLink="/auth/login">login</a> to leave a comment.</p>
      </div>
      
      <!-- Tabs for different comment views (for admins) -->
      <mat-tab-group *ngIf="isAdmin()" (selectedTabChange)="onTabChange($event)">
        <mat-tab label="All">
          <ng-container *ngTemplateOutlet="commentsList"></ng-container>
        </mat-tab>
        <mat-tab label="Pending">
          <div class="tab-content">
            <div *ngIf="pendingLoading()" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
            
            <div *ngIf="!pendingLoading() && pendingComments().length === 0" class="empty-message">
              <p>No pending comments.</p>
            </div>
            
            <div *ngIf="!pendingLoading() && pendingComments().length > 0" class="comments-list">
              <app-comment-item 
                *ngFor="let comment of pendingComments()" 
                [comment]="comment"
                [postId]="postId"
                [maxDepth]="maxDepth"
                (commentDeleted)="onCommentDeleted($event)"
                (commentUpdated)="onCommentUpdated($event)"
                (replyAdded)="onReplyAdded($event)">
              </app-comment-item>
              
              <div class="load-more" *ngIf="hasMorePending() && !loadingMore()">
                <button mat-button color="primary" (click)="loadMorePending()">
                  Load More
                </button>
              </div>
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Flagged">
          <div class="tab-content">
            <div *ngIf="flaggedLoading()" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
            
            <div *ngIf="!flaggedLoading() && flaggedComments().length === 0" class="empty-message">
              <p>No flagged comments.</p>
            </div>
            
            <div *ngIf="!flaggedLoading() && flaggedComments().length > 0" class="comments-list">
              <app-comment-item 
                *ngFor="let comment of flaggedComments()" 
                [comment]="comment"
                [postId]="postId"
                [maxDepth]="maxDepth"
                (commentDeleted)="onCommentDeleted($event)"
                (commentUpdated)="onCommentUpdated($event)"
                (replyAdded)="onReplyAdded($event)">
              </app-comment-item>
              
              <div class="load-more" *ngIf="hasMoreFlagged() && !loadingMore()">
                <button mat-button color="primary" (click)="loadMoreFlagged()">
                  Load More
                </button>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
      
      <!-- Regular comments list (non-admin view) -->
      <ng-container *ngIf="!isAdmin()">
        <ng-container *ngTemplateOutlet="commentsList"></ng-container>
      </ng-container>
      
      <!-- Comments list template -->
      <ng-template #commentsList>
        <div class="comments-list-container" appInfiniteScroll (scrolled)="onScroll()">
          <div *ngIf="loading()" class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          
          <div *ngIf="!loading() && comments().length === 0" class="empty-message">
            <p>No comments yet. Be the first to comment!</p>
          </div>
          
          <div *ngIf="!loading() && comments().length > 0" class="comments-list">
            <app-comment-item 
              *ngFor="let comment of comments()" 
              [comment]="comment"
              [postId]="postId"
              [maxDepth]="maxDepth"
              (commentDeleted)="onCommentDeleted($event)"
              (commentUpdated)="onCommentUpdated($event)"
              (replyAdded)="onReplyAdded($event)">
            </app-comment-item>
            
            <div class="load-more-indicator" *ngIf="loadingMore()">
              <mat-spinner diameter="30"></mat-spinner>
            </div>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .comments-container {
      margin-top: 32px;
    }
    
    .comments-header {
      font-size: 1.5rem;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 8px;
    }
    
    .comment-form-wrapper {
      margin-bottom: 24px;
    }
    
    .comment-trigger {
      display: flex;
      margin-bottom: 16px;
    }
    
    .comment-trigger button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
    }
    
    .login-prompt {
      padding: 16px;
      text-align: center;
      background-color: var(--surface-color);
      border-radius: 4px;
      margin-bottom: 24px;
    }
    
    .comments-list-container {
      position: relative;
      min-height: 100px;
    }
    
    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 32px;
    }
    
    .empty-message {
      text-align: center;
      padding: 32px;
      color: var(--text-secondary);
    }
    
    .load-more {
      display: flex;
      justify-content: center;
      margin-top: 16px;
    }
    
    .load-more-indicator {
      display: flex;
      justify-content: center;
      padding: 16px;
    }
    
    .tab-content {
      padding: 16px 0;
    }
  `]
})
export class CommentListComponent implements OnInit, OnDestroy, AfterViewInit {
  private commentService = inject(CommentService);
  private authService = inject(AuthService);
  
  @Input() postId!: string;
  @Input() maxDepth: number = 10;
  
  @ViewChild('commentsContainer') commentsContainer?: ElementRef;
  
  // Comment form visibility control
  private _showCommentForm = signal<boolean>(false);
  showCommentForm = this._showCommentForm.asReadonly();
  
  // Regular comments
  comments = signal<Comment[]>([]);
  loading = signal<boolean>(true);
  loadingMore = signal<boolean>(false);
  hasMore = signal<boolean>(false);
  totalComments = signal<number>(0);
  lastVisible: DocumentSnapshot<DocumentData> | null = null;
  
  // Moderation tabs (admin only)
  pendingComments = signal<Comment[]>([]);
  flaggedComments = signal<Comment[]>([]);
  pendingLoading = signal<boolean>(false);
  flaggedLoading = signal<boolean>(false);
  hasMorePending = signal<boolean>(false);
  hasMoreFlagged = signal<boolean>(false);
  pendingLastVisible: DocumentSnapshot<DocumentData> | null = null;
  flaggedLastVisible: DocumentSnapshot<DocumentData> | null = null;
  
  // Current active tab
  activeTab = 0;
  
  // Subscription for real-time updates
  private commentsSubscription?: Subscription;
  
  ngOnInit() {
    // Load initial comments
    this.loadComments();
    
    // For admins, also load pending comments
    if (this.isAdmin()) {
      this.loadPendingComments();
    }
  }
  
  ngAfterViewInit() {
    // If we have a container reference, set up intersection observer for infinite scrolling
  }
  
  ngOnDestroy() {
    // Clear the comment service cache
    this.commentService.clearCache();
    
    // Unsubscribe from real-time updates
    if (this.commentsSubscription) {
      this.commentsSubscription.unsubscribe();
    }
  }
  
  isLoggedIn(): boolean {
    return !!this.authService.currentUser();
  }
  
  isAdmin(): boolean {
    return this.authService.profile()?.role === 'admin';
  }
  
  async loadComments() {
    try {
      this.loading.set(true);
      
      // Initial load uses real-time updates
      const comments = await this.commentService.loadCommentsForPost(this.postId);
      
      // Filter for top-level comments only (no parent)
      const topLevelComments = comments.filter(comment => !comment.parentId);
      
      this.comments.set(topLevelComments);
      this.totalComments.set(comments.length);
      
      // Set up subscription for real-time updates
      this.commentsSubscription = this.commentService.comments$.subscribe(updatedComments => {
        // Filter for top-level comments only
        const updatedTopLevel = updatedComments.filter(comment => !comment.parentId);
        this.comments.set(updatedTopLevel);
        this.totalComments.set(updatedComments.length);
      });
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      this.loading.set(false);
    }
  }
  
  async loadMoreComments() {
    if (!this.hasMore() || this.loadingMore() || !this.lastVisible) return;
    
    try {
      this.loadingMore.set(true);
      
      const { comments: newComments, lastVisible } = 
        await this.commentService.getTopLevelComments(this.postId, this.lastVisible);
      
      // Append new comments to existing ones
      this.comments.update(current => [...current, ...newComments]);
      
      // Update pagination
      this.lastVisible = lastVisible;
      this.hasMore.set(newComments.length >= 10); // Assuming batch size is 10
      
      // Update total comments count
      this.totalComments.update(count => count + newComments.length);
    } catch (error) {
      console.error('Error loading more comments:', error);
    } finally {
      this.loadingMore.set(false);
    }
  }
  
  async loadPendingComments() {
    if (!this.isAdmin()) return;
    
    try {
      this.pendingLoading.set(true);
      
      // Filter pending comments client-side for this post
      const result = await this.commentService.getPendingComments();
      const filteredComments = result.comments.filter(comment => comment.postId === this.postId);
      
      this.pendingComments.set(filteredComments);
      this.pendingLastVisible = result.lastVisible;
      this.hasMorePending.set(result.comments.length >= 10); // Assuming batch size is 10
    } catch (error) {
      console.error('Error loading pending comments:', error);
    } finally {
      this.pendingLoading.set(false);
    }
  }
  
  async loadMorePending() {
    if (!this.isAdmin() || !this.pendingLastVisible || this.loadingMore()) return;
    
    try {
      this.loadingMore.set(true);
      
      const result = await this.commentService.getPendingComments(this.pendingLastVisible);
      const filteredComments = result.comments.filter(comment => comment.postId === this.postId);
      
      // Append new comments to existing ones
      this.pendingComments.update(current => [...current, ...filteredComments]);
      
      // Update pagination
      this.pendingLastVisible = result.lastVisible;
      this.hasMorePending.set(result.comments.length >= 10); // Assuming batch size is 10
    } catch (error) {
      console.error('Error loading more pending comments:', error);
    } finally {
      this.loadingMore.set(false);
    }
  }
  
  async loadFlaggedComments() {
    if (!this.isAdmin()) return;
    
    try {
      this.flaggedLoading.set(true);
      
      // Filter flagged comments client-side for this post
      const result = await this.commentService.getFlaggedComments();
      const filteredComments = result.comments.filter(comment => comment.postId === this.postId);
      
      this.flaggedComments.set(filteredComments);
      this.flaggedLastVisible = result.lastVisible;
      this.hasMoreFlagged.set(result.comments.length >= 10); // Assuming batch size is 10
    } catch (error) {
      console.error('Error loading flagged comments:', error);
    } finally {
      this.flaggedLoading.set(false);
    }
  }
  
  async loadMoreFlagged() {
    if (!this.isAdmin() || !this.flaggedLastVisible || this.loadingMore()) return;
    
    try {
      this.loadingMore.set(true);
      
      const result = await this.commentService.getFlaggedComments(this.flaggedLastVisible);
      const filteredComments = result.comments.filter(comment => comment.postId === this.postId);
      
      // Append new comments to existing ones
      this.flaggedComments.update(current => [...current, ...filteredComments]);
      
      // Update pagination
      this.flaggedLastVisible = result.lastVisible;
      this.hasMoreFlagged.set(result.comments.length >= 10); // Assuming batch size is 10
    } catch (error) {
      console.error('Error loading more flagged comments:', error);
    } finally {
      this.loadingMore.set(false);
    }
  }
  
  showCommentFormTrigger(event: MouseEvent) {
    // Stop event propagation to prevent document click handler from firing
    event.stopPropagation();
    console.log('Showing comment form - stopped propagation');
    this._showCommentForm.set(true);
  }
  
  hideCommentForm() {
    console.log('Hiding comment form');
    this._showCommentForm.set(false);
  }
  
  onCommentAdded(comment: Comment) {
    // For top-level comments, add to the list
    if (!comment.parentId) {
      this.comments.update(comments => [comment, ...comments]);
      this.totalComments.update(count => count + 1);
      
      // Hide the comment form after successful submission
      this.hideCommentForm();
    }
  }
  
  onCommentDeleted(commentId: string) {
    // Remove from comments list
    this.comments.update(comments => comments.filter(c => c.id !== commentId));
    this.totalComments.update(count => Math.max(0, count - 1));
    
    // If admin, also remove from moderation lists
    if (this.isAdmin()) {
      this.pendingComments.update(comments => comments.filter(c => c.id !== commentId));
      this.flaggedComments.update(comments => comments.filter(c => c.id !== commentId));
    }
  }
  
  onCommentUpdated(updatedComment: Comment) {
    // Update in comments list if it's a top-level comment
    if (!updatedComment.parentId) {
      this.comments.update(comments => 
        comments.map(c => c.id === updatedComment.id ? updatedComment : c)
      );
    }
    
    // If admin, handle moderation lists
    if (this.isAdmin()) {
      // Update or remove comment based on its status
      if (updatedComment.status === 'approved') {
        // Remove from pending and flagged lists
        this.pendingComments.update(comments => comments.filter(c => c.id !== updatedComment.id));
        this.flaggedComments.update(comments => comments.filter(c => c.id !== updatedComment.id));
      } else if (updatedComment.status === 'flagged') {
        // Remove from pending list
        this.pendingComments.update(comments => comments.filter(c => c.id !== updatedComment.id));
        
        // Add or update in flagged list
        this.flaggedComments.update(comments => {
          const existingIndex = comments.findIndex(c => c.id === updatedComment.id);
          if (existingIndex >= 0) {
            // Update existing comment
            return [
              ...comments.slice(0, existingIndex),
              updatedComment,
              ...comments.slice(existingIndex + 1)
            ];
          } else {
            // Add new comment
            return [updatedComment, ...comments];
          }
        });
      } else if (updatedComment.status === 'pending') {
        // Remove from flagged list
        this.flaggedComments.update(comments => comments.filter(c => c.id !== updatedComment.id));
        
        // Add or update in pending list
        this.pendingComments.update(comments => {
          const existingIndex = comments.findIndex(c => c.id === updatedComment.id);
          if (existingIndex >= 0) {
            // Update existing comment
            return [
              ...comments.slice(0, existingIndex),
              updatedComment,
              ...comments.slice(existingIndex + 1)
            ];
          } else {
            // Add new comment
            return [updatedComment, ...comments];
          }
        });
      }
    }
  }
  
  onReplyAdded(reply: Comment) {
    // Increment total count
    this.totalComments.update(count => count + 1);
  }
  
  onTabChange(event: any) {
    this.activeTab = event.index;
    
    // Load data for the selected tab if it's not loaded yet
    if (this.activeTab === 1 && this.pendingComments().length === 0 && !this.pendingLoading()) {
      this.loadPendingComments();
    } else if (this.activeTab === 2 && this.flaggedComments().length === 0 && !this.flaggedLoading()) {
      this.loadFlaggedComments();
    }
  }
  
  onScroll() {
    // Load more comments based on active tab
    if (this.activeTab === 0) {
      this.loadMoreComments();
    } else if (this.activeTab === 1) {
      this.loadMorePending();
    } else if (this.activeTab === 2) {
      this.loadMoreFlagged();
    }
  }
}