// src/app/features/blog/featured-posts.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BlogService, BlogPost } from '../../core/services/blog.service';

@Component({
  selector: 'app-featured-posts',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
      <div class="featured-posts-section" *ngIf="featuredPosts().length > 0">
        <h2 class="section-title">Featured Posts</h2>
        
        <div class="featured-posts-container">
          <mat-card *ngFor="let post of featuredPosts()" class="featured-post-card" [routerLink]="['/blog', post.id]">
            <div class="featured-post-layout">
              <div class="featured-post-image-container" *ngIf="post.imageUrl">
                <img [src]="post.imageUrl" [alt]="post.title" class="featured-post-image">
              </div>
              <div class="featured-post-content">
                <h3 class="featured-post-title">{{ post.title }}</h3>
                <p class="featured-post-excerpt">{{ generateExcerpt(post) }}</p>
                
                <div class="featured-post-meta">
                  <div class="post-author" *ngIf="post.authorName">
                    <img *ngIf="post.authorPhotoURL" [src]="post.authorPhotoURL" alt="Author" class="author-image">
                    <mat-icon *ngIf="!post.authorPhotoURL">account_circle</mat-icon>
                    <span>{{ post.authorName }}</span>
                  </div>
                  <span class="post-date">{{ formatDate(post.publishedAt) }}</span>
                </div>
                
                <div class="post-tags" *ngIf="post.tags?.length">
                  <mat-chip *ngFor="let tag of post.tags.slice(0, 3)">{{ tag }}</mat-chip>
                </div>
                
                <button mat-button color="primary" class="read-more-btn">Read More</button>
              </div>
            </div>
          </mat-card>
        </div>
      </div>
  `,
  styles: [`
    .featured-posts-container {
      margin-bottom: 48px;
    }
    
    .section-title {
      font-size: 1.8rem;
      margin-bottom: 24px;
      color: var(--primary-color);
      border-bottom: 2px solid var(--primary-lighter);
      padding-bottom: 8px;
    }
    
    .loading-container, .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }
    
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
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
      object-fit: cover;
      cursor: pointer;
    }
    
    .author-avatar {
      overflow: hidden;
      cursor: pointer;
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
    }
    
    .author-link {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
    }
    
    .author-link:hover {
      text-decoration: underline;
    }
    
    mat-card-title {
      cursor: pointer;
    }
    
    mat-card-title:hover {
      color: var(--primary-color);
    }
    
    .post-excerpt {
      margin-bottom: 16px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      cursor: pointer;
    }
    
    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }
    
    .post-tags mat-chip {
      cursor: pointer;
    }
    
    .more-tags {
      font-size: 0.8rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
    }
    
    mat-card-actions {
      margin-top: auto;
      display: flex;
      align-items: center;
    }
    
    .likes-count {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin-left: -8px;
    }
  `]
})
export class FeaturedPostsComponent implements OnInit {
  private blogService = inject(BlogService);
  
  featuredPosts = signal<BlogPost[]>([]);
  loading = signal<boolean>(true);
  
  ngOnInit() {
    this.loadFeaturedPosts();
  }
  
  async loadFeaturedPosts() {
    try {
      this.loading.set(true);
      const posts = await this.blogService.getFeaturedPosts();
      this.featuredPosts.set(posts);
    } catch (error) {
      console.error('Error loading featured posts:', error);
    } finally {
      this.loading.set(false);
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
}