// src/app/features/user/user-posts.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BlogService, BlogPost } from '../../core/services/blog.service';

@Component({
  selector: 'app-user-posts',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatBadgeModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <div class="page-header">
        <h1>My Posts</h1>
        <a mat-raised-button color="primary" routerLink="/blog/create">
          <mat-icon>add</mat-icon>
          Create New Post
        </a>
      </div>
      
      <!-- Tabs for different post status -->
      <mat-tab-group>
        <mat-tab label="All Posts ({{ allPosts().length }})">
          <div class="posts-container">
            @if (loading()) {
              <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else if (allPosts().length === 0) {
              <div class="empty-state">
                <h2>No posts yet</h2>
                <p>Create your first post to get started!</p>
                <a mat-raised-button color="primary" routerLink="/blog/create">Create Post</a>
              </div>
            } @else {
              <div class="post-list">
                @for (post of allPosts(); track post.id) {
                  <div class="post-item">
                    <mat-card>
                      <mat-card-header>
                        <mat-card-title>{{ post.title }}</mat-card-title>
                        <mat-card-subtitle>
                          <div class="post-status-badge">
                            <mat-chip [color]="getStatusColor(post.status)" selected>{{ post.status }}</mat-chip>
                          </div>
                          <span class="post-date">{{ formatDate(post.updatedAt) }}</span>
                        </mat-card-subtitle>
                      </mat-card-header>
                      
                      <mat-card-content>
                        <p class="post-excerpt">{{ generateExcerpt(post) }}</p>
                      </mat-card-content>
                      
                      <mat-card-actions>
                        <a mat-button [routerLink]="['/blog', post.id]" color="primary">
                          <mat-icon>visibility</mat-icon> View
                        </a>
                        
                        <a mat-button [routerLink]="['/blog', post.id, 'edit']" color="accent">
                          <mat-icon>edit</mat-icon> Edit
                        </a>
                        
                        <button mat-icon-button [matMenuTriggerFor]="postMenu" aria-label="Post actions">
                          <mat-icon>more_vert</mat-icon>
                        </button>
                        
                        <mat-menu #postMenu="matMenu">
                          @if (post.status === 'draft') {
                            <button mat-menu-item (click)="publishPost(post)">
                              <mat-icon>publish</mat-icon>
                              <span>Publish</span>
                            </button>
                          } @else {
                            <button mat-menu-item (click)="unpublishPost(post)">
                              <mat-icon>unpublished</mat-icon>
                              <span>Unpublish</span>
                            </button>
                          }
                          
                          <button mat-menu-item (click)="deletePost(post)">
                            <mat-icon color="warn">delete</mat-icon>
                            <span>Delete</span>
                          </button>
                        </mat-menu>
                      </mat-card-actions>
                      
                      <mat-card-footer>
                        <div class="post-stats">
                          <div class="stat">
                            <mat-icon>visibility</mat-icon>
                            <span>{{ post.views || 0 }} views</span>
                          </div>
                          
                          <div class="stat">
                            <mat-icon>favorite</mat-icon>
                            <span>{{ post.likes || 0 }} likes</span>
                          </div>
                        </div>
                      </mat-card-footer>
                    </mat-card>
                  </div>
                }
              </div>
            }
          </div>
        </mat-tab>
        
        <mat-tab label="Published ({{ publishedPosts().length }})">
          <!-- Same structure as above, but filtered for published posts -->
          <div class="posts-container">
            @if (loading()) {
              <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else if (publishedPosts().length === 0) {
              <div class="empty-state">
                <h2>No published posts</h2>
                <p>Publish a draft to see it here.</p>
              </div>
            } @else {
              <div class="post-list">
                @for (post of publishedPosts(); track post.id) {
                  <!-- Post card (same as above) -->
                  <div class="post-item">
                    <mat-card>
                      <!-- Same card content as above -->
                    </mat-card>
                  </div>
                }
              </div>
            }
          </div>
        </mat-tab>
        
        <mat-tab label="Drafts ({{ draftPosts().length }})">
          <!-- Same structure as above, but filtered for draft posts -->
          <div class="posts-container">
            @if (loading()) {
              <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else if (draftPosts().length === 0) {
              <div class="empty-state">
                <h2>No draft posts</h2>
                <p>Save a post as draft to see it here.</p>
              </div>
            } @else {
              <div class="post-list">
                @for (post of draftPosts(); track post.id) {
                  <!-- Post card (same as above) -->
                  <div class="post-item">
                    <mat-card>
                      <!-- Same card content as above -->
                    </mat-card>
                  </div>
                }
              </div>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 16px;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .posts-container {
      padding: 16px 0;
    }
    
    .loading-container, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      gap: 16px;
      text-align: center;
      padding: 32px;
    }
    
    .post-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .post-status-badge {
      display: inline-block;
      margin-right: 8px;
    }
    
    .post-date {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
    
    .post-excerpt {
      color: var(--text-secondary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 0;
    }
    
    .post-stats {
      display: flex;
      gap: 16px;
      padding: 8px 16px;
      font-size: 0.875rem;
      color: var(--text-secondary);
      border-top: 1px solid var(--border-color);
    }
    
    .stat {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .stat mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
    }
  `]
})
export class UserPostsComponent implements OnInit {
  private blogService = inject(BlogService);
  private snackBar = inject(MatSnackBar);
  
  loading = signal<boolean>(false);
  allPosts = signal<BlogPost[]>([]);
  
  // Computed properties for filtered posts
  publishedPosts() {
    return this.allPosts().filter(post => post.status === 'published');
  }
  
  draftPosts() {
    return this.allPosts().filter(post => post.status === 'draft');
  }
  
  ngOnInit() {
    this.loadUserPosts();
  }
  
  async loadUserPosts() {
    try {
      this.loading.set(true);
      const posts = await this.blogService.getUserPosts();
      this.allPosts.set(posts);
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      this.loading.set(false);
    }
  }
  
  getStatusColor(status: string): string {
    switch (status) {
      case 'published': return 'primary';
      case 'draft': return '';
      default: return '';
    }
  }
  
  formatDate(timestamp: any): string {
    if (!timestamp) {
      return '';
    }
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric', 
      year: 'numeric'
    });
  }
  
  generateExcerpt(post: BlogPost): string {
    if (post.excerpt) {
      return post.excerpt;
    }
    
    // Strip HTML tags and get first 150 characters
    const plainText = post.content.replace(/<[^>]*>/g, '');
    return plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
  }
  
  async publishPost(post: BlogPost) {
    try {
      await this.blogService.updatePost(post.id!, { status: 'published' });
      this.snackBar.open('Post published successfully', 'Close', { duration: 3000 });
      this.loadUserPosts(); // Reload posts
    } catch (error) {
      console.error('Error publishing post:', error);
      this.snackBar.open('Failed to publish post', 'Close', { duration: 3000 });
    }
  }
  
  async unpublishPost(post: BlogPost) {
    try {
      await this.blogService.updatePost(post.id!, { status: 'draft' });
      this.snackBar.open('Post unpublished', 'Close', { duration: 3000 });
      this.loadUserPosts(); // Reload posts
    } catch (error) {
      console.error('Error unpublishing post:', error);
      this.snackBar.open('Failed to unpublish post', 'Close', { duration: 3000 });
    }
  }
  
  async deletePost(post: BlogPost) {
    // This would typically show a confirmation dialog first
    try {
      // This would be implemented in the BlogService
      // await this.blogService.deletePost(post.id!);
      
      // For now, just update the local state
      this.allPosts.update(posts => posts.filter(p => p.id !== post.id));
      this.snackBar.open('Post deleted', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error deleting post:', error);
      this.snackBar.open('Failed to delete post', 'Close', { duration: 3000 });
    }
  }
}