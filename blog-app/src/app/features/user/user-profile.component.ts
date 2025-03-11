import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserProfile } from '../../core/models/user-profile.model';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/auth/auth.service';
import { BlogService, BlogPost } from '../../core/services/blog.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="profile-container">
      <!-- Loading spinner -->
      <div *ngIf="loading()" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      
      <!-- User not found message -->
      <div *ngIf="!loading() && !userProfile()" class="not-found">
        <mat-card>
          <mat-card-content>
            <h2>User not found</h2>
            <p>The user profile you're looking for doesn't exist or you don't have permission to view it.</p>
            <button mat-button color="primary" routerLink="/">Back to Home</button>
          </mat-card-content>
        </mat-card>
      </div>
      
      <!-- User Profile Content -->
      <div *ngIf="!loading() && userProfile()" class="profile-content">
        <!-- Profile Header Card -->
        <mat-card class="profile-header-card">
          <div class="profile-header">
            <div class="profile-avatar">
              <img *ngIf="userProfile()?.photoURL" [src]="userProfile()?.photoURL" alt="Profile Picture">
              <mat-icon *ngIf="!userProfile()?.photoURL" class="default-avatar">account_circle</mat-icon>
            </div>
            
            <div class="profile-info">
              <h1 class="profile-name">{{ userProfile()?.displayName }}</h1>
              
              <div class="profile-role">
                <mat-chip [color]="getRoleColor(userProfile()?.role || 'user')">
                  {{ formatRole(userProfile()?.role || 'user') }}
                </mat-chip>
                
                <span *ngIf="userProfile()?.lastLogin" class="last-seen">
                  Last seen: {{ formatDate(userProfile()?.lastLogin) }}
                </span>
              </div>
              
              <div class="profile-meta">
                <span *ngIf="userProfile()?.createdAt" class="joined-date">
                  <mat-icon>event</mat-icon> Joined {{ formatDate(userProfile()?.createdAt) }}
                </span>
              </div>
              
              <div class="profile-bio" *ngIf="userProfile()?.bio">
                <p>{{ userProfile()?.bio }}</p>
              </div>
              
              <div class="social-links" *ngIf="hasSocialLinks()">
                <a *ngIf="userProfile()?.socialLinks?.website" 
                   [href]="userProfile()?.socialLinks?.website" 
                   target="_blank" 
                   class="social-link">
                  <mat-icon>language</mat-icon>
                </a>
                
                <a *ngIf="userProfile()?.socialLinks?.twitter" 
                   [href]="'https://twitter.com/' + userProfile()?.socialLinks?.twitter" 
                   target="_blank" 
                   class="social-link">
                  <mat-icon>twitter</mat-icon>
                </a>
                
                <a *ngIf="userProfile()?.socialLinks?.github" 
                   [href]="'https://github.com/' + userProfile()?.socialLinks?.github" 
                   target="_blank" 
                   class="social-link">
                  <mat-icon>code</mat-icon>
                </a>
                
                <a *ngIf="userProfile()?.socialLinks?.linkedin" 
                   [href]="'https://linkedin.com/in/' + userProfile()?.socialLinks?.linkedin" 
                   target="_blank" 
                   class="social-link">
                  <mat-icon>work</mat-icon>
                </a>
              </div>
            </div>
          </div>
        </mat-card>
        
        <!-- Tabs for Posts and Message -->
        <mat-tab-group class="profile-tabs" animationDuration="0ms">
          <mat-tab label="Posts">
            <div class="tab-content">
              <div *ngIf="loadingPosts()" class="loading-container">
                <mat-spinner diameter="30"></mat-spinner>
              </div>
              
              <div *ngIf="!loadingPosts() && userPosts().length === 0" class="empty-content">
                <p>{{ isCurrentUser() ? "You haven't published any posts yet." : "This user hasn't published any posts yet." }}</p>
                
                <button *ngIf="isCurrentUser() || isAdmin()" 
                        mat-raised-button 
                        color="primary" 
                        routerLink="/blog/create">
                  <mat-icon>add</mat-icon> Create a Post
                </button>
              </div>
              
              <div *ngIf="!loadingPosts() && userPosts().length > 0" class="posts-grid">
                <mat-card *ngFor="let post of userPosts()" class="post-card" [routerLink]="['/blog', post.id]">
                  <img *ngIf="post.imageUrl" [src]="post.imageUrl" [alt]="post.title" class="post-image">
                  
                  <mat-card-content>
                    <h2 class="post-title">{{ post.title }}</h2>
                    <p class="post-date">{{ formatDate(post.publishedAt) }}</p>
                    <p class="post-excerpt">{{ generateExcerpt(post) }}</p>
                    
                    <div class="post-tags" *ngIf="post.tags && post.tags.length > 0">
                      <mat-chip *ngFor="let tag of post.tags.slice(0, 3)">{{ tag }}</mat-chip>
                      <span *ngIf="post.tags.length > 3" class="more-tags">+{{ post.tags.length - 3 }} more</span>
                    </div>
                  </mat-card-content>
                  
                  <mat-card-actions>
                    <button mat-button color="primary">
                      Read More
                      <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </mat-card-actions>
                </mat-card>
              </div>
            </div>
          </mat-tab>
          
          <mat-tab label="Send Message">
            <div class="tab-content">
              <mat-card class="message-card">
                <mat-card-content>
                  <h2 class="message-title">Send a message to {{ userProfile()?.displayName }}</h2>
                  
                  <form [formGroup]="messageForm" (ngSubmit)="sendMessage()" class="message-form">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Subject</mat-label>
                      <input matInput formControlName="subject" placeholder="Message subject">
                      <mat-error *ngIf="messageForm.get('subject')?.hasError('required')">
                        Subject is required
                      </mat-error>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Message</mat-label>
                      <textarea 
                        matInput 
                        formControlName="message" 
                        placeholder="Your message..."
                        rows="6">
                      </textarea>
                      <mat-error *ngIf="messageForm.get('message')?.hasError('required')">
                        Message content is required
                      </mat-error>
                    </mat-form-field>
                    
                    <div class="form-actions">
                      <button 
                        type="submit" 
                        mat-raised-button 
                        color="primary"
                        [disabled]="!messageForm.valid || messageSending()">
                        <mat-icon>send</mat-icon>
                        {{ messageSending() ? 'Sending...' : 'Send Message' }}
                      </button>
                    </div>
                  </form>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }
    
    .loading-container, .not-found, .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      gap: 16px;
    }
    
    .profile-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .profile-header-card {
      padding: 24px;
    }
    
    .profile-header {
      display: flex;
      gap: 24px;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    
    .profile-avatar {
      width: 120px;
      height: 120px;
      overflow: hidden;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background-color: var(--surface-color);
      border: 2px solid var(--primary-color);
    }
    
    .profile-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .default-avatar {
      font-size: 96px;
      width: 96px;
      height: 96px;
      color: var(--primary-color);
    }
    
    .profile-info {
      flex: 1;
      min-width: 280px;
    }
    
    .profile-name {
      margin: 0 0 8px 0;
      font-size: 2rem;
    }
    
    .profile-role {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .last-seen {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    
    .profile-meta {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    
    .joined-date {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .joined-date mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    .profile-bio {
      margin-bottom: 16px;
      line-height: 1.5;
    }
    
    .social-links {
      display: flex;
      gap: 12px;
    }
    
    .social-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--surface-color);
      color: var(--primary-color);
      transition: all 0.2s ease;
    }
    
    .social-link:hover {
      background-color: var(--primary-color);
      color: white;
      transform: translateY(-3px);
    }
    
    .profile-tabs {
      margin-top: 16px;
    }
    
    .tab-content {
      padding: 24px 0;
    }
    
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }
    
    .post-card {
      cursor: pointer;
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
      height: 160px;
      object-fit: cover;
    }
    
    .post-title {
      margin: 8px 0;
      font-size: 1.25rem;
      color: var(--text-primary);
    }
    
    .post-date {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-bottom: 8px;
    }
    
    .post-excerpt {
      color: var(--text-secondary);
      line-height: 1.4;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      margin-bottom: 16px;
    }
    
    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .more-tags {
      font-size: 0.8rem;
      color: var(--text-secondary);
      align-self: center;
    }
    
    .message-card {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .message-title {
      margin-bottom: 24px;
    }
    
    .message-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
    
    @media (max-width: 600px) {
      .profile-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      
      .profile-role, .profile-meta, .social-links {
        justify-content: center;
      }
      
      .posts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UserProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private blogService = inject(BlogService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  
  loading = signal<boolean>(true);
  userProfile = signal<UserProfile | null>(null);
  
  loadingPosts = signal<boolean>(false);
  userPosts = signal<BlogPost[]>([]);
  
  messageSending = signal<boolean>(false);
  
  messageForm: FormGroup = this.fb.group({
    subject: ['', Validators.required],
    message: ['', Validators.required]
  });
  
  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const userId = params.get('id');
      if (userId) {
        this.loadUserProfile(userId);
      } else {
        // If no ID provided, try to load current user's profile
        const currentUser = this.authService.currentUser();
        if (currentUser) {
          this.loadUserProfile(currentUser.uid);
        } else {
          this.loading.set(false);
        }
      }
    });
  }
  
  async loadUserProfile(userId: string) {
    try {
      this.loading.set(true);
      
      // Get the user profile
      const profile = await this.userService.getUserById(userId).toPromise();
      this.userProfile.set(profile || null);
      
      if (profile) {
        // Load user's posts
        this.loadUserPosts(userId);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.snackBar.open('Error loading user profile', 'Close', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }
  
  async loadUserPosts(userId: string) {
    try {
      this.loadingPosts.set(true);
      const posts = await this.blogService.getPostsByAuthor(userId);
      this.userPosts.set(posts);
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      this.loadingPosts.set(false);
    }
  }
  
  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    
    try {
      // Firestore Timestamp with toDate method
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      // Regular Date object
      else if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      // String or number timestamp
      else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        return new Date(timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      return '';
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }
  
  formatRole(role: string): string {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'author': return 'Author';
      case 'user': return 'Member';
      default: return role.charAt(0).toUpperCase() + role.slice(1);
    }
  }
  
  getRoleColor(role: string): string {
    switch (role) {
      case 'admin': return 'warn';
      case 'author': return 'primary';
      default: return 'accent';
    }
  }
  
  generateExcerpt(post: BlogPost): string {
    if (post.excerpt) {
      return post.excerpt;
    }
    
    // Strip HTML tags and get first 150 characters
    const plainText = post.content.replace(/<[^>]*>/g, '');
    return plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
  }
  
  hasSocialLinks(): boolean {
    const links = this.userProfile()?.socialLinks;
    return !!links && Object.values(links).some(link => !!link);
  }
  
  isCurrentUser(): boolean {
    const currentUser = this.authService.currentUser();
    return !!currentUser && currentUser.uid === this.userProfile()?.uid;
  }
  
  isAdmin(): boolean {
    return this.authService.profile()?.role === 'admin';
  }
  
  async sendMessage() {
    if (!this.messageForm.valid) return;
    
    this.messageSending.set(true);
    
    try {
      // Get form values
      const subject = this.messageForm.get('subject')?.value;
      const message = this.messageForm.get('message')?.value;
      
      // Here you would typically call a service to send the message
      // For now, we'll simulate a successful message send
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success feedback
      this.snackBar.open('Message sent successfully!', 'Close', { duration: 3000 });
      
      // Reset form
      this.messageForm.reset();
    } catch (error) {
      console.error('Error sending message:', error);
      this.snackBar.open('Failed to send message. Please try again.', 'Close', { duration: 3000 });
    } finally {
      this.messageSending.set(false);
    }
  }
}