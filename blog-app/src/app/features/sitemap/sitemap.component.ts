// src/app/features/sitemap/sitemap.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { BlogService } from '../../core/services/blog.service';

interface SitemapItem {
  path: string;
  title: string;
  children?: SitemapItem[];
  icon?: string;
  description?: string;
}

@Component({
  selector: 'app-sitemap',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatIconModule
  ],
  template: `
    <div class="container">
      <h1 class="page-title">Sitemap</h1>
      <p class="page-description">
        A comprehensive list of all pages available on our site to help you navigate and find the content you're looking for.
      </p>
      
      <mat-card class="sitemap-card">
        <mat-card-content>
          <div class="sitemap-section">
            <h2><mat-icon>home</mat-icon> Main Pages</h2>
            <div class="sitemap-links">
              <div *ngFor="let item of mainPages" class="sitemap-item">
                <a [routerLink]="item.path" class="sitemap-link">
                  <mat-icon *ngIf="item.icon">{{item.icon}}</mat-icon>
                  <span>{{item.title}}</span>
                </a>
                <p *ngIf="item.description" class="sitemap-description">{{item.description}}</p>
              </div>
            </div>
          </div>
          
          <mat-divider></mat-divider>
          
          <div class="sitemap-section">
            <h2><mat-icon>article</mat-icon> Blog Posts</h2>
            <div *ngIf="blogPosts.length === 0" class="loading-posts">
              <p>Loading blog posts...</p>
            </div>
            <div *ngIf="blogPosts.length > 0" class="sitemap-links blog-links">
              <div *ngFor="let post of blogPosts" class="sitemap-item">
                <a [routerLink]="'/blog/' + post.id" class="sitemap-link">
                  <span>{{post.title}}</span>
                </a>
                <p *ngIf="post.excerpt" class="sitemap-description">{{post.excerpt}}</p>
              </div>
            </div>
          </div>
          
          <mat-divider></mat-divider>
          
          <div class="sitemap-section">
            <h2><mat-icon>gavel</mat-icon> Legal Pages</h2>
            <div class="sitemap-links">
              <div *ngFor="let item of legalPages" class="sitemap-item">
                <a [routerLink]="item.path" class="sitemap-link">
                  <mat-icon *ngIf="item.icon">{{item.icon}}</mat-icon>
                  <span>{{item.title}}</span>
                </a>
                <p *ngIf="item.description" class="sitemap-description">{{item.description}}</p>
              </div>
            </div>
          </div>
          
          <mat-divider></mat-divider>
          
          <div class="sitemap-section">
            <h2><mat-icon>account_circle</mat-icon> User Pages</h2>
            <div class="sitemap-links">
              <div *ngFor="let item of userPages" class="sitemap-item">
                <a [routerLink]="item.path" class="sitemap-link">
                  <mat-icon *ngIf="item.icon">{{item.icon}}</mat-icon>
                  <span>{{item.title}}</span>
                </a>
                <p *ngIf="item.description" class="sitemap-description">{{item.description}}</p>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 16px;
    }
    
    .page-title {
      font-size: 2rem;
      margin-bottom: 16px;
    }
    
    .page-description {
      color: var(--text-secondary);
      margin-bottom: 32px;
      font-size: 1.1rem;
      line-height: 1.5;
    }
    
    .sitemap-card {
      margin-bottom: 32px;
    }
    
    .sitemap-section {
      margin: 24px 0;
    }
    
    .sitemap-section h2 {
      font-size: 1.5rem;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      color: var(--primary-color);
    }
    
    .sitemap-section h2 mat-icon {
      margin-right: 8px;
    }
    
    .sitemap-links {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
    }
    
    .blog-links {
      grid-template-columns: 1fr;
    }
    
    .sitemap-item {
      margin-bottom: 12px;
    }
    
    .sitemap-link {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: var(--primary-color);
      font-weight: 500;
      transition: color 0.2s ease;
    }
    
    .sitemap-link:hover {
      color: var(--primary-darker);
      text-decoration: underline;
    }
    
    .sitemap-link mat-icon {
      margin-right: 8px;
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
    
    .sitemap-description {
      margin-top: 4px;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    
    .loading-posts {
      padding: 16px;
      color: var(--text-secondary);
      font-style: italic;
    }
    
    mat-divider {
      margin: 24px 0;
    }
    
    @media (max-width: 600px) {
      .sitemap-links {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SitemapComponent implements OnInit {
  private blogService = inject(BlogService);
  
  // Main static pages
  mainPages: SitemapItem[] = [
    { path: '/', title: 'Home', icon: 'home', description: 'Welcome to our blog, featuring latest posts and featured content.' },
    { path: '/blog', title: 'Blog', icon: 'article', description: 'Browse all our blog posts.' },
  ];
  
  // User account pages
  userPages: SitemapItem[] = [
    { path: '/auth/login', title: 'Login', icon: 'login', description: 'Sign in to your account.' },
    { path: '/auth/signup', title: 'Sign Up', icon: 'person_add', description: 'Create a new account to join our community.' },
    { path: '/user/settings', title: 'User Settings', icon: 'settings', description: 'Manage your account settings and profile.' },
    { path: '/user/posts', title: 'My Posts', icon: 'library_books', description: 'View and manage your own blog posts.' },
  ];
  
  // Legal pages
  legalPages: SitemapItem[] = [
    { path: '/legal/privacy-policy', title: 'Privacy Policy', icon: 'policy', description: 'Learn how we handle your data and protect your privacy.' },
    { path: '/sitemap', title: 'Sitemap', icon: 'map', description: 'View all pages on our website.' },
  ];
  
  // Blog posts - populated dynamically
  blogPosts: any[] = [];
  
  ngOnInit() {
    this.loadBlogPosts();
  }
  
  async loadBlogPosts() {
    try {
      const posts = await this.blogService.getPublishedPosts();
      this.blogPosts = posts;
    } catch (error) {
      console.error('Error loading blog posts for sitemap:', error);
    }
  }
}