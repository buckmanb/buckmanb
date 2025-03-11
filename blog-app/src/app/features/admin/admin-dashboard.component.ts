import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CommentService } from '../../core/services/comment.service';
import { BlogService } from '../../core/services/blog.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="dashboard-container">
      <h1>Admin Dashboard</h1>
      
      <div class="dashboard-grid">
        <mat-card class="dashboard-card">
          <mat-card-content>
            <h2><mat-icon>people</mat-icon> Users</h2>
            <div class="stats">
              <p>Total Users: {{ totalUsers() }}</p>
              <button mat-raised-button 
                      color="primary"
                      routerLink="/admin/users">
                Manage Users
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card">
          <mat-card-content>
            <h2><mat-icon>article</mat-icon> Posts</h2>
            <div class="stats">
              <p>Total Posts: {{ totalPosts() }}</p>
              <button mat-raised-button 
                      color="primary"
                      routerLink="/admin/posts">
                Manage Posts
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card">
          <mat-card-content>
            <h2><mat-icon>comment</mat-icon> Comments</h2>
            <div class="stats">
              <p>Pending: {{ pendingComments() }}</p>
              <p>Flagged: {{ flaggedComments() }}</p>
              <button mat-raised-button 
                      color="primary"
                      routerLink="/admin/moderation">
                Moderate Comments
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
    }
    
    .dashboard-grid {
      display: grid;
      gap: 24px;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
    
    .dashboard-card {
      padding: 16px;
      height: 100%;
      
      h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px 0;
      }
      
      .stats {
        display: flex;
        flex-direction: column;
        gap: 8px;
        
        p {
          margin: 0;
        }
        
        button {
          margin-top: 16px;
        }
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private commentService = inject(CommentService);
  private blogService = inject(BlogService);
  private authService = inject(AuthService);
  
  totalPosts = signal<number>(0);
  totalUsers = signal<number>(0);
  pendingComments = signal<number>(0);
  flaggedComments = signal<number>(0);

  ngOnInit() {
    this.loadDashboardStats();
  }

  async loadDashboardStats() {
    this.loadCommentStats();
    try {
      const postCount = await this.blogService.getPostsCount();
      this.totalPosts.set(postCount);
      
      const userCount = await this.authService.getAllUsers().then(users => users.length);
      this.totalUsers.set(userCount);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  }

  async loadCommentStats() {
    try {
      const pendingResult = await this.commentService.getPendingCommentsWithCount();
      this.pendingComments.set(pendingResult.count);
      
      const flaggedResult = await this.commentService.getFlaggedCommentsWithCount();
      this.flaggedComments.set(flaggedResult.count);
    } catch (error) {
      console.error('Error loading comment stats:', error);
    }
  }
}
