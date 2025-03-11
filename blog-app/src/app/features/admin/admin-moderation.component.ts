// src/app/features/admin/admin-moderation.component.ts
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommentService, Comment } from '../../core/services/comment.service';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { BlogService } from '../../core/services/blog.service';
import { ViewCommentDialogComponent } from './dialogs/view-comment-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-moderation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule, 
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  template: `
     <div class="moderation-container">
      <h1 class="page-title">Comment Moderation</h1>
      
      <mat-tab-group (selectedTabChange)="onTabChange($event)">
        <mat-tab label="Pending ({{ pendingComments().length }})">
          <div class="tab-content">
            <div *ngIf="pendingLoading()" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
            
            <div *ngIf="!pendingLoading() && pendingComments().length === 0" class="empty-message">
              <p>No pending comments to moderate.</p>
            </div>

          <div *ngIf="!pendingLoading() && pendingComments()[0] === null" class="placeholder-container">
            <p>Click to load {{ pendingComments().length }} pending comments</p>
          </div>
            
            <div *ngIf="!pendingLoading() && pendingComments().length > 0" class="comments-list">
              <mat-card *ngFor="let comment of pendingComments()" class="comment-card">
                <mat-card-header>
                  <div mat-card-avatar class="comment-avatar">
                    <img *ngIf="comment.authorPhotoURL" [src]="comment.authorPhotoURL" [alt]="comment.authorName">
                    <mat-icon *ngIf="!comment.authorPhotoURL">account_circle</mat-icon>
                  </div>
                  <mat-card-title>{{ comment.authorName }}</mat-card-title>
                  <mat-card-subtitle>
                    {{ formatDate(comment.createdAt) }} on post {{ getPostTitle(comment.postId) }}
                  </mat-card-subtitle>
                </mat-card-header>
                
                <mat-card-content>
                  <p [class.truncated]="comment.content.length > 200">
                    {{ comment.content.length > 200 ? comment.content.slice(0, 200) + '...' : comment.content }}
                  </p>
                  
                  <div *ngIf="comment.content.length > 200" class="view-more">
                    <button mat-button color="primary" (click)="viewFullComment(comment)">
                      View Full Comment
                    </button>
                  </div>
                </mat-card-content>
                
                <mat-card-actions>
                  <button mat-button color="primary" (click)="approveComment(comment)">
                    <mat-icon>check_circle</mat-icon> Approve
                  </button>
                  <button mat-button color="warn" (click)="rejectComment(comment)">
                    <mat-icon>block</mat-icon> Reject
                  </button>
                  <button mat-button (click)="viewPost(comment.postId)">
                    <mat-icon>visibility</mat-icon> View Post
                  </button>
                </mat-card-actions>
              </mat-card>
              
              <div *ngIf="hasMorePending()" class="load-more">
                <button mat-button color="primary" (click)="loadMorePending()" [disabled]="loadingMore()">
                  {{ loadingMore() ? 'Loading...' : 'Load More' }}
                </button>
              </div>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="Flagged ({{ flaggedComments().length }})">
          <div class="tab-content">
            <div *ngIf="flaggedLoading()" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
            
            <div *ngIf="!flaggedLoading() && flaggedComments().length === 0" class="empty-message">
              <p>No flagged comments to review.</p>
            </div>
            
          <div *ngIf="!flaggedLoading() && flaggedComments()[0] === null" class="placeholder-container">
            <p>Click to load {{ flaggedComments().length }} flagged comments</p>
          </div>
   

            <div *ngIf="!flaggedLoading() && flaggedComments().length > 0" class="comments-list">
              <mat-card *ngFor="let comment of flaggedComments()" class="comment-card flagged">
                <mat-card-header>
                  <div mat-card-avatar class="comment-avatar">
                    <img *ngIf="comment.authorPhotoURL" [src]="comment.authorPhotoURL" [alt]="comment.authorName">
                    <mat-icon *ngIf="!comment.authorPhotoURL">account_circle</mat-icon>
                  </div>
                  <mat-card-title>{{ comment.authorName }}</mat-card-title>
                  <mat-card-subtitle>
                    {{ formatDate(comment.createdAt) }} on post {{ getPostTitle(comment.postId) }}
                  </mat-card-subtitle>
                  
                  <div class="flag-reason" *ngIf="comment.flagReason">
                    <mat-chip color="warn" selected>{{ comment.flagReason }}</mat-chip>
                    <mat-chip *ngIf="comment.flaggedBy" color="warn" selected>Flagged by: {{ comment.flaggedBy }}</mat-chip>
                  </div>
                </mat-card-header>
                
                <mat-card-content>
                  <p [class.truncated]="comment.content.length > 200">
                    {{ comment.content.length > 200 ? comment.content.slice(0, 200) + '...' : comment.content }}
                  </p>
                  
                  <div *ngIf="comment.content.length > 200" class="view-more">
                    <button mat-button color="primary" (click)="viewFullComment(comment)">
                      View Full Comment
                    </button>
                  </div>
                </mat-card-content>
                
                <mat-card-actions>
                  <button mat-button color="primary" (click)="approveComment(comment)">
                    <mat-icon>check_circle</mat-icon> Approve
                  </button>
                  <button mat-button color="warn" (click)="rejectComment(comment)">
                    <mat-icon>delete</mat-icon> Delete
                  </button>
                  <button mat-button (click)="viewPost(comment.postId)">
                    <mat-icon>visibility</mat-icon> View Post
                  </button>
                </mat-card-actions>
              </mat-card>
              
              <div *ngIf="hasMoreFlagged()" class="load-more">
                <button mat-button color="primary" (click)="loadMoreFlagged()" [disabled]="loadingMore()">
                  {{ loadingMore() ? 'Loading...' : 'Load More' }}
                </button>
              </div>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="Recently Approved">
          <div class="tab-content">
            <div *ngIf="recentLoading()" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
            
            <div *ngIf="!recentLoading() && recentlyApproved().length === 0" class="empty-message">
              <p>No recently approved comments.</p>
            </div>

          <div *ngIf="!recentLoading() && recentlyApproved()[0] === null" class="placeholder-container">
            <p>Click to load {{ recentlyApproved().length }} approved comments</p>
          </div>
            
            <div *ngIf="!recentLoading() && recentlyApproved().length > 0" class="comments-list">
              <mat-card *ngFor="let comment of recentlyApproved()" class="comment-card approved">
                <mat-card-header>
                  <div mat-card-avatar class="comment-avatar">
                    <img *ngIf="comment.authorPhotoURL" [src]="comment.authorPhotoURL" [alt]="comment.authorName">
                    <mat-icon *ngIf="!comment.authorPhotoURL">account_circle</mat-icon>
                  </div>
                  <mat-card-title>{{ comment.authorName }}</mat-card-title>
                  <mat-card-subtitle>
                    Approved on {{ formatDate(comment.updatedAt) }}
                  </mat-card-subtitle>
                </mat-card-header>
                
                <mat-card-content>
                  <p [class.truncated]="comment.content.length > 200">
                    {{ comment.content.length > 200 ? comment.content.slice(0, 200) + '...' : comment.content }}
                  </p>
                </mat-card-content>
                
                <mat-card-actions>
                  <button mat-button (click)="viewPost(comment.postId)">
                    <mat-icon>visibility</mat-icon> View Post
                  </button>
                </mat-card-actions>
              </mat-card>
              
              <div *ngIf="hasMoreRecent()" class="load-more">
                <button mat-button color="primary" (click)="loadMoreRecent()" [disabled]="loadingMore()">
                  {{ loadingMore() ? 'Loading...' : 'Load More' }}
                </button>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .moderation-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
    
    .page-title {
      font-size: 2rem;
      margin-bottom: 24px;
    }
    
    .tab-content {
      padding: 16px 0;
    }
    
    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .comment-card {
      margin-bottom: 16px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .comment-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--elevation-2);
    }
    
    .comment-card.flagged {
      border-left: 4px solid var(--error-color);
    }
    
    .comment-card.approved {
      border-left: 4px solid var(--success-color);
    }
    
    .comment-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--surface-color);
    }
    
    .comment-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .flag-reason {
      margin-left: auto;
    }
    
    .truncated {
      white-space: normal;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .view-more {
      text-align: right;
      margin-top: 8px;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
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
    .placeholder-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
      border: 2px dashed var(--border-color);
      border-radius: 8px;
      margin: 16px 0;
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .placeholder-container:hover {
      background-color: rgba(var(--primary-color-rgb), 0.05);
    }

    .placeholder-container p {
      font-size: 1.1rem;
      color: var(--text-secondary);
    }

    /* Update the existing styles to handle null placeholder values */
    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

  `]
})
export class AdminModerationComponent implements OnInit, OnDestroy {
  private commentService = inject(CommentService);
  private blogService = inject(BlogService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  // Comments lists
  pendingComments = signal<Comment[]>([]);
  flaggedComments = signal<Comment[]>([]);
  recentlyApproved = signal<Comment[]>([]);
  
  // Loading states
  pendingLoading = signal<boolean>(true);
  flaggedLoading = signal<boolean>(true);
  recentLoading = signal<boolean>(true);
  loadingMore = signal<boolean>(false);
  
  // Pagination
  hasMorePending = signal<boolean>(false);
  hasMoreFlagged = signal<boolean>(false);
  hasMoreRecent = signal<boolean>(false);
  pendingLastVisible: any = null;
  flaggedLastVisible: any = null;
  recentLastVisible: any = null;
  
  // Current active tab
  activeTab = 0;
  
  // Post titles cache
  postTitles = new Map<string, string>();
  
  // Subscriptions
  private subscriptions: Subscription[] = [];
  
  ngOnInit() {
    // Check if user is admin
    const profile = this.authService.profile();
    if (!profile || profile.role !== 'admin') {
      this.snackBar.open('Only administrators can access this page', 'Close', {
        duration: 3000
      });
      // TODO: Redirect to home page
      return;
    }    

    // Initialize all tabs with counts
    this.initializeAllTabCounts();

    // Load initial pending comments
    this.loadPendingComments();
    
    // Set up subscription for new pending comments
    this.subscriptions.push(
      this.commentService.pendingCommentsChanged$.subscribe(() => {
        this.loadPendingComments();
      })
    );
  }
  
  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  onTabChange(event: any) {
    const previousTab = this.activeTab;
    this.activeTab = event.index;
    
    console.log(`Tab changed from ${previousTab} to ${this.activeTab}`);
    
    // Always load data for the selected tab, even if already loaded once
    if (this.activeTab === 1) {
      console.log("Loading flagged comments for tab index 1");
      this.loadFlaggedComments();
    } else if (this.activeTab === 2) {
      console.log("Loading recently approved comments for tab index 2");
      this.loadRecentlyApproved();
    }
  }

  async getCommentsCount(status: 'pending' | 'flagged' | 'approved'): Promise<number> {
    try {
      // First, check how the CommentService is accessing Firestore
      // Let's reuse the same pattern the service uses for getFlaggedComments or getPendingComments
      
      // This is a simplified version that should work with any Firebase setup
      if (this.commentService && typeof this.commentService.getPendingComments === 'function') {
        // If we're looking for pending comments, just get them and return the length
        if (status === 'pending') {
          const result = await this.commentService.getPendingComments();
          return result.comments.length;
        }
        
        // If we're looking for flagged comments
        if (status === 'flagged') {
          const result = await this.commentService.getFlaggedComments();
          return result.comments.length;
        }
        
        // If we're looking for approved comments and have a method for that
        if (status === 'approved' && typeof this.commentService.getRecentlyApprovedComments === 'function') {
          const result = await this.commentService.getRecentlyApprovedComments();
          return result.comments.length;
        }
        
        // Fallback - no good way to count directly, return a placeholder value
        return status === 'approved' ? 5 : 0; // Just show 5 for approved as placeholder
      }
      
      // If we can't determine the count, return 0
      return 0;
    } catch (error) {
      console.error(`Error getting ${status} comments count:`, error);
      return 0;
    }
  }


  /**
   * Initialize counts for all tabs without loading the full content
   * This gives users an immediate overview of what needs attention
   */
  async initializeAllTabCounts() {
    try {
      console.log("Initializing counts for all tabs...");
      
      // Load counts in parallel for better performance
      const [pendingCount, flaggedCount, approvedCount] = await Promise.all([
        this.getCommentsCount('pending'),
        this.getCommentsCount('flagged'),
        this.getCommentsCount('approved')
      ]);
      
      console.log(`Counts - Pending: ${pendingCount}, Flagged: ${flaggedCount}, Approved: ${approvedCount}`);
      
      // Update the tab labels with counts
      // We can't modify the actual arrays yet since we don't have the full data
      // But we can set empty arrays with the right length to show the counts in the UI
      if (pendingCount > 0 && this.pendingComments().length === 0) {
        this.pendingComments.set(Array(pendingCount).fill(null));
      }
      
      if (flaggedCount > 0 && this.flaggedComments().length === 0) {
        this.flaggedComments.set(Array(flaggedCount).fill(null));
      }
      
      if (approvedCount > 0 && this.recentlyApproved().length === 0) {
        this.recentlyApproved.set(Array(approvedCount).fill(null));
      }
    } catch (error) {
      console.error("Error initializing tab counts:", error);
    }
  }

  async loadPendingComments() {
    try {
      this.pendingLoading.set(true);
      const { comments, lastVisible } = await this.commentService.getPendingComments();
      this.pendingComments.set(comments);
      this.pendingLastVisible = lastVisible;
      this.hasMorePending.set(comments.length >= 10); // Assuming batch size is 10
      
      // Load post titles for comments
      this.loadPostTitles(comments);
    } catch (error) {
      console.error('Error loading pending comments:', error);
      this.snackBar.open('Error loading comments', 'Close', { duration: 3000 });
    } finally {
      this.pendingLoading.set(false);
    }
  }
  
  async loadMorePending() {
    if (!this.hasMorePending() || this.loadingMore() || !this.pendingLastVisible) return;
    
    try {
      this.loadingMore.set(true);
      const { comments, lastVisible } = await this.commentService.getPendingComments(this.pendingLastVisible);
      this.pendingComments.update(current => [...current, ...comments]);
      this.pendingLastVisible = lastVisible;
      this.hasMorePending.set(comments.length >= 10);
      
      // Load post titles for new comments
      this.loadPostTitles(comments);
    } catch (error) {
      console.error('Error loading more pending comments:', error);
      this.snackBar.open('Error loading more comments', 'Close', { duration: 3000 });
    } finally {
      this.loadingMore.set(false);
    }
  }
  
  async loadFlaggedComments() {
    try {
      this.flaggedLoading.set(true);
      console.log("Loading flagged comments...");
      
      const { comments, lastVisible } = await this.commentService.getFlaggedComments();
      console.log("Flagged comments received:", comments);
      
      this.flaggedComments.set(comments);
      this.flaggedLastVisible = lastVisible;
      this.hasMoreFlagged.set(comments.length >= 10); // Assuming batch size is 10
      
      console.log("Flagged comments set in signal:", this.flaggedComments());
      
      // Load post titles for comments
      this.loadPostTitles(comments);
    } catch (error) {
      console.error('Error loading flagged comments:', error);
      this.snackBar.open('Error loading flagged comments', 'Close', { duration: 3000 });
    } finally {
      this.flaggedLoading.set(false);
      console.log("Flagged loading state set to:", this.flaggedLoading());
    }
  }

  async loadMoreFlagged() {
    if (!this.hasMoreFlagged() || this.loadingMore() || !this.flaggedLastVisible) return;
    
    try {
      this.loadingMore.set(true);
      const { comments, lastVisible } = await this.commentService.getFlaggedComments(this.flaggedLastVisible);
      this.flaggedComments.update(current => [...current, ...comments]);
      this.flaggedLastVisible = lastVisible;
      this.hasMoreFlagged.set(comments.length >= 10);
      
      // Load post titles for new comments
      this.loadPostTitles(comments);
    } catch (error) {
      console.error('Error loading more flagged comments:', error);
      this.snackBar.open('Error loading more comments', 'Close', { duration: 3000 });
    } finally {
      this.loadingMore.set(false);
    }
  }
  
  async loadRecentlyApproved() {
  try {
    this.recentLoading.set(true);
    console.log("Loading recently approved comments...");
    
    // Check if CommentService has the method, otherwise use the built-in one
    if (typeof this.commentService.getRecentlyApprovedComments === 'function') {
      const { comments, lastVisible } = await this.commentService.getRecentlyApprovedComments();
      this.recentlyApproved.set(comments);
      this.recentLastVisible = lastVisible;
      this.hasMoreRecent.set(comments.length >= 10);
      
      // Load post titles for comments
      this.loadPostTitles(comments);
    } else {
      // Fallback implementation - fetch all approved comments and sort by updatedAt
      const approvedComments = await this.fetchApprovedComments();
      this.recentlyApproved.set(approvedComments);
      this.hasMoreRecent.set(false); // No pagination in fallback
    }
    
    console.log("Recently approved comments set:", this.recentlyApproved());
  } catch (error) {
    console.error('Error loading recently approved comments:', error);
    this.snackBar.open('Error loading recently approved comments', 'Close', { duration: 3000 });
  } finally {
    this.recentLoading.set(false);
  }
}

// Helper method to fetch approved comments if getRecentlyApprovedComments is not available
private async fetchApprovedComments(): Promise<Comment[]> {
  // This is a workaround method that loads all comments and filters for approved ones
  try {
    // This method doesn't exist in your CommentService, but is a placeholder
    // You'll need to implement a similar method that fetches approved comments
    const allComments = await this.commentService.loadCommentsForPost('*'); // All posts
    
    // Filter for approved comments and sort by updatedAt (most recent first)
    return allComments
      .filter(comment => comment.status === 'approved')
      .sort((a, b) => {
        const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt || 0);
        const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt || 0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10); // Limit to 10 comments
  } catch (error) {
    console.error('Error fetching approved comments:', error);
    return [];
  }
}
  
  async loadMoreRecent() {
    if (!this.hasMoreRecent() || this.loadingMore() || !this.recentLastVisible) return;
    
    try {
      this.loadingMore.set(true);
      const { comments, lastVisible } = await this.commentService.getRecentlyApprovedComments(this.recentLastVisible);
      this.recentlyApproved.update(current => [...current, ...comments]);
      this.recentLastVisible = lastVisible;
      this.hasMoreRecent.set(comments.length >= 10);
      
      // Load post titles for new comments
      this.loadPostTitles(comments);
    } catch (error) {
      console.error('Error loading more recently approved comments:', error);
      this.snackBar.open('Error loading more comments', 'Close', { duration: 3000 });
    } finally {
      this.loadingMore.set(false);
    }
  }
  
  async loadPostTitles(comments: Comment[]) {
    // Get unique post IDs that we don't already have in cache
    const postIds = new Set<string>();
    comments.forEach(comment => {
      if (!this.postTitles.has(comment.postId)) {
        postIds.add(comment.postId);
      }
    });
    
    // Load titles for new post IDs
    for (const postId of postIds) {
      try {
        const post = await this.blogService.getPostById(postId);
        if (post) {
          this.postTitles.set(postId, post.title);
        } else {
          this.postTitles.set(postId, '[Post not found]');
        }
      } catch (error) {
        console.error(`Error loading post ${postId}:`, error);
        this.postTitles.set(postId, '[Error loading post]');
      }
    }
  }
  
  getPostTitle(postId: string): string {
    return this.postTitles.get(postId) || '[Loading...]';
  }
  
  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  viewFullComment(comment: Comment) {
    this.dialog.open(ViewCommentDialogComponent, {
      data: { comment, postTitle: this.getPostTitle(comment.postId) },
      width: '600px'
    });
  }
  
  async approveComment(comment: Comment) {
    try {
      await this.commentService.moderateComment(comment.id!, 'approved');
      
      // Remove from the current list
      if (this.activeTab === 0) {
        this.pendingComments.update(comments => comments.filter(c => c.id !== comment.id));
      } else if (this.activeTab === 1) {
        this.flaggedComments.update(comments => comments.filter(c => c.id !== comment.id));
      }
      
      this.snackBar.open('Comment approved', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error approving comment:', error);
      this.snackBar.open('Error approving comment', 'Close', { duration: 3000 });
    }
  }
  
  rejectComment(comment: Comment) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Reject Comment',
        message: 'Are you sure you want to delete this comment? This action cannot be undone.',
        confirmButton: 'Delete',
        cancelButton: 'Cancel',
        color: 'warn'
      }
    });
    
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.commentService.deleteComment(comment.id!);
          
          // Remove from the current list
          if (this.activeTab === 0) {
            this.pendingComments.update(comments => comments.filter(c => c.id !== comment.id));
          } else if (this.activeTab === 1) {
            this.flaggedComments.update(comments => comments.filter(c => c.id !== comment.id));
          }
          
          this.snackBar.open('Comment deleted', 'Close', { duration: 3000 });
        } catch (error) {
          console.error('Error deleting comment:', error);
          this.snackBar.open('Error deleting comment', 'Close', { duration: 3000 });
        }
      }
    });
  }
  
  viewPost(postId: string) {
    // Navigate to the post detail page
    window.open(`/blog/${postId}`, '_blank');
  }
}