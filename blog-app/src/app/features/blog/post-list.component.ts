// src/app/features/blog/post-list.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BlogService, BlogPost } from '../../core/services/blog.service';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <h1 class="page-title">Blog Posts</h1>
      
      <!-- Filters and sorting (to be implemented) -->
      <div class="filters">
        <!-- Placeholders for filters -->
      </div>
      
      <!-- Posts grid -->
      <div class="posts-grid">
        @if (loading()) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else if (posts().length === 0) {
          <div class="empty-state">
            <h2>No posts found</h2>
            <p>Check back later for new content.</p>
          </div>
        } @else {
          @for (post of posts(); track post.id) {
            <mat-card class="post-card">
              @if (post.imageUrl) {
                <img [src]="post.imageUrl" alt="{{ post.title }}" class="post-image">
              }
              <mat-card-content>
                <h2 class="post-title">{{ post.title }}</h2>
                
                <div class="post-meta">
                  <span class="post-date">{{ formatDate(post.publishedAt) }}</span>
                  <span class="post-author">by {{ post.authorName }}</span>
                </div>
                
                <p class="post-excerpt">{{ generateExcerpt(post) }}</p>
                
                <div class="post-tags">
                  @for (tag of post.tags; track tag) {
                    <mat-chip>{{ tag }}</mat-chip>
                  }
                </div>
                
                <div class="post-stats">
                  <span class="likes">
                    <mat-icon>favorite</mat-icon> {{ post.likes }}
                  </span>
                </div>
              </mat-card-content>
              
              <mat-card-actions>
                <a mat-button [routerLink]="['/blog', post.id]" color="primary">Read More</a>
              </mat-card-actions>
            </mat-card>
          }
        }
      </div>
      
      <!-- Load more (for infinite scroll - to be implemented) -->
      <div class="load-more" *ngIf="posts().length > 0 && !loading()">
        <button mat-button color="primary" (click)="loadMore()">
          Load More
        </button>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;
    }
    
    .page-title {
      margin-bottom: 24px;
      font-size: 2rem;
    }
    
    .filters {
      margin-bottom: 24px;
    }
    
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    
    .post-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .post-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--elevation-3);
    }
    
     .post-image {
      height: 200px;
      width: 100%;
      object-fit: cover;
      aspect-ratio: 16 / 9;
      max-height: 250px;
    }
    
    .post-title {
      margin-top: 0;
      margin-bottom: 8px;
      font-size: 1.5rem;
    }
    
    .post-meta {
      display: flex;
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 12px;
      gap: 8px;
    }
    
    .post-excerpt {
      margin-bottom: 16px;
      line-height: 1.5;
    }
    
    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .post-stats {
      display: flex;
      gap: 16px;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    .likes {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .likes mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 32px;
      grid-column: 1 / -1;
    }
    
    .empty-state {
      text-align: center;
      padding: 32px;
      grid-column: 1 / -1;
    }
    
    .load-more {
      display: flex;
      justify-content: center;
      margin: 24px 0 32px;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .posts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PostListComponent implements OnInit {
  private blogService = inject(BlogService);
  
  posts = signal<BlogPost[]>([]);
  loading = signal<boolean>(false);
  
  ngOnInit() {
    this.loadPosts();
  }
  
  async loadPosts() {
    try {
      this.loading.set(true);
      const posts = await this.blogService.getPublishedPosts();
      this.posts.set(posts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      this.loading.set(false);
    }
  }
  
  loadMore() {
    // Implement loading more posts
    console.log('Load more posts');
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
}