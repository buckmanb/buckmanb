import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { BlogService, BlogPost } from '../../core/services/blog.service';
import { FeaturedPostsComponent  } from '../blog/featured-posts.component'; 

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    RouterLink, 
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    FeaturedPostsComponent
  ],
  template: `
    <div class="home-container">
      <!-- Welcome Banner that matches the site header style -->
      <div class="welcome-banner">
        <h1 class="welcome-title">Welcome to My Social Media Site</h1>
        <p class="welcome-text">
          Creating meaningful connections through content that matters. Visit 
          <a href="https://beaubuckman.com" class="website-link">beaubuckman.com</a> 
          to contact me.
        </p>
        <!-- Only show create button for logged in users with author/admin role -->
        <button *ngIf="isAuthorOrAdmin()" 
                mat-raised-button 
                routerLink="/blog/create" 
                class="create-post-btn">
          <mat-icon>add</mat-icon>
          <span>CREATE POST</span>
        </button>
      </div>

      <!-- Featured posts section with row layout -->
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

      <!-- Recent posts section -->
      <div class="recent-posts-section">
        <h2 class="section-title">Recent Posts</h2>
        
        <div *ngIf="loading()" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div *ngIf="!loading() && posts().length === 0" class="no-posts-message">
          <p>No posts found. Check back later for new content!</p>
        </div>
        
        <div class="posts-grid" *ngIf="!loading() && posts().length > 0">
          <mat-card *ngFor="let post of posts()" class="post-card" [routerLink]="['/blog', post.id]">
            <img *ngIf="post.imageUrl" [src]="post.imageUrl" [alt]="post.title" class="post-image">
            <mat-card-content>
              <h3 class="post-title">{{ post.title }}</h3>
              <p class="post-excerpt">{{ generateExcerpt(post) }}</p>
              
              <div class="post-meta">
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
            </mat-card-content>
            
            <mat-card-actions>
              <button mat-button color="primary">Read More</button>
            </mat-card-actions>
          </mat-card>
        </div>
        
        <div class="view-all-button" *ngIf="posts().length > 0">
          <button mat-button color="primary" routerLink="/blog">
            View All Posts
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;
    }

    /* Welcome Banner styled to match site header */
    .welcome-banner {
      background: #006699;
      color: white;
      padding: 2.5rem;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 2.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .welcome-title {
      font-size: 2.2rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .welcome-text {
      font-size: 1.1rem;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    .website-link {
      color: white;
      font-weight: 600;
      text-decoration: underline;
    }

    .website-link:hover {
      text-decoration: none;
      opacity: 0.9;
    }

    .create-post-btn {
      background-color: white;
      color: #4F5BD5; /* Matches the navigation bar blue */
      font-weight: 600;
      padding: 0.5rem 1.5rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .create-post-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    /* Section title styling - matches your site */
    .section-title {
      font-size: 1.75rem;
      color: #4F5BD5; /* Matches the navigation bar blue */
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #4F5BD5;
    }

    /* Featured posts - single row layout */
    .featured-posts-section {
      margin-bottom: 3rem;
    }

    .featured-posts-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .featured-post-card {
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      padding: 0;
    }

    .featured-post-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    .featured-post-layout {
      display: flex;
      flex-direction: row;
      height: 100%;
    }

    .featured-post-image-container {
      flex: 0 0 35%;
      max-width: 35%;
    }

    .featured-post-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 4px 0 0 4px;
    }

    .featured-post-content {
      flex: 1;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
    }

    .featured-post-title {
      font-size: 1.5rem;
      margin-top: 0;
      margin-bottom: 0.75rem;
      color: #333;
    }

    .featured-post-excerpt {
      color: #666;
      margin-bottom: 1rem;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex-grow: 1;
    }

    .featured-post-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      font-size: 0.9rem;
      color: #666;
    }

    .read-more-btn {
      align-self: flex-start;
      margin-top: 1rem;
    }

    /* Author information styling */
    .post-author {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .author-image {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      object-fit: cover;
    }

    .post-author mat-icon {
      font-size: 28px;
      height: 28px;
      width: 28px;
    }

    /* Tags styling */
    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    /* Recent posts grid */
    .recent-posts-section {
      margin-bottom: 3rem;
    }

    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .post-card {
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .post-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
    }

    .post-image {
      width: 100%;
      height: 180px;
      object-fit: cover;
    }

    .post-title {
      font-size: 1.25rem;
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .post-excerpt {
      color: #666;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }

    .post-date {
      color: #777;
    }

    /* Loading and empty states */
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }

    .no-posts-message {
      text-align: center;
      padding: 2rem;
      color: #666;
      background-color: #f8f8f8;
      border-radius: 4px;
    }

    .view-all-button {
      display: flex;
      justify-content: center;
      margin-top: 1.5rem;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .featured-post-layout {
        flex-direction: column;
      }
      
      .featured-post-image-container {
        flex: 0 0 100%;
        max-width: 100%;
        height: 200px;
      }
      
      .featured-post-image {
        border-radius: 4px 4px 0 0;
      }
      
      .posts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  authService = inject(AuthService);
  private blogService = inject(BlogService);
  
  loading = signal<boolean>(true);
  posts = signal<BlogPost[]>([]);
  featuredPosts = signal<BlogPost[]>([]);
  
  // Helper method to check if user is logged in with author or admin role
  isAuthorOrAdmin(): boolean {
    const profile = this.authService.profile();
    return !!profile && (profile.role === 'author' || profile.role === 'admin');
  }
  
  ngOnInit() {
    this.loadPosts();
    this.loadFeaturedPosts();
  }
  
  async loadPosts() {
    try {
      this.loading.set(true);
      const posts = await this.blogService.getPublishedPosts(6); // Limit to 6 posts for homepage
      this.posts.set(posts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      this.loading.set(false);
    }
  }
  
  async loadFeaturedPosts() {
    try {
      const featured = await this.blogService.getFeaturedPosts(3); // Limit to 3 featured posts
      this.featuredPosts.set(featured);
    } catch (error) {
      console.error('Error loading featured posts:', error);
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