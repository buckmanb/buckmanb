import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { ThemeService } from '../core/services/theme.service';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <mat-toolbar color="primary" class="navbar">
      <!-- Logo/Brand -->
      <a routerLink="/" class="brand">
        <span class="site-name">Beau's Blog</span>
      </a>
      
      <!-- Spacer -->
      <span class="spacer"></span>
      
      <!-- Navigation Links - Desktop -->
      <div class="nav-links" [class.hidden]="isMobile()">
        <a mat-button routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
          Home
        </a>
        
        <a mat-button routerLink="/blog" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
          Blog
        </a>
        
        @if (isLoggedIn()) {
          <a mat-button routerLink="/blog/create" routerLinkActive="active">
            Create Post
          </a>
          
          <!-- Only show for admins -->
          @if (isAdminUser()) {
            <a mat-button routerLink="/admin" routerLinkActive="active">
              Admin
            </a>
          }
        }
      </div>
      
      <!-- Right side actions -->
      <div class="actions">
        <!-- Theme toggle -->
        <button mat-icon-button (click)="themeService.toggleTheme()" class="theme-toggle" aria-label="Toggle theme">
          <mat-icon>{{ themeService.currentTheme() === 'dark-theme' ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>
        
        <!-- User actions -->
        @if (isLoggedIn()) {
          <button mat-icon-button [matMenuTriggerFor]="userMenu" aria-label="User menu" class="user-menu-trigger">
            @if (userPhoto()) {
              <img [src]="userPhoto()" alt="Profile" class="user-avatar" (error)="handleImageError($event)">
            } @else {
              <mat-icon>account_circle</mat-icon>
            }
          </button>
          
          <mat-menu #userMenu="matMenu" xPosition="before">
            <div class="user-menu-header">
              <div class="user-info">
                <p class="user-name">{{ user()?.displayName || 'User' }}</p>
                <p class="user-email">{{ user()?.email }}</p>
              </div>
            </div>
            
            <mat-divider></mat-divider>
            
            <a mat-menu-item routerLink="/user/settings">
              <mat-icon>person</mat-icon>
              <span>Profile</span>
            </a>
            
            <a mat-menu-item routerLink="/user/posts">
              <mat-icon>description</mat-icon>
              <span>My Posts</span>
            </a>
            
            <mat-divider></mat-divider>
            
            <button mat-menu-item (click)="onSignOut()">
              <mat-icon>exit_to_app</mat-icon>
              <span>Sign Out</span>
            </button>
          </mat-menu>
        } @else {
          <a mat-button routerLink="/auth/login">Sign In</a>
        }
        
        <!-- Mobile menu button -->
        <button mat-icon-button class="mobile-menu-button" (click)="toggleMobileMenu()" [class.hidden]="!isMobile()">
          <mat-icon>menu</mat-icon>
        </button>
      </div>
    </mat-toolbar>
    
    <!-- Mobile Navigation Menu -->
    <div class="mobile-menu" [class.open]="mobileMenuOpen() && isMobile()">
      <nav>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMobileMenu()">
          Home
        </a>
        
        <a routerLink="/blog" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMobileMenu()">
          Blog
        </a>
        
        @if (isLoggedIn()) {
          <a routerLink="/blog/create" routerLinkActive="active" (click)="closeMobileMenu()">
            Create Post
          </a>
          
          <a routerLink="/user/settings" routerLinkActive="active" (click)="closeMobileMenu()">
            Profile
          </a>
          
          <a routerLink="/user/posts" routerLinkActive="active" (click)="closeMobileMenu()">
            My Posts
          </a>
          
          @if (isAdminUser()) {
            <a routerLink="/admin" routerLinkActive="active" (click)="closeMobileMenu()">
              Admin
            </a>
          }
          
          <button class="sign-out-button" (click)="onSignOut()">
            Sign Out
          </button>
        } @else {
          <a routerLink="/auth/login" routerLinkActive="active" (click)="closeMobileMenu()">
            Sign In
          </a>
          
          <a routerLink="/auth/signup" routerLinkActive="active" (click)="closeMobileMenu()">
            Sign Up
          </a>
        }
      </nav>
    </div>
  `,
  styles: [`
    /* Navbar styles */
    .navbar {
      display: flex;
      align-items: center;
      padding: 0 16px;
      box-shadow: var(--elevation-1);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      height: 64px;
    }
    
    .brand {
      text-decoration: none;
      color: inherit;
      display: flex;
      align-items: center;
    }
    
    .site-name {
      font-size: 1.5rem;
      font-weight: 500;
      letter-spacing: 0.02em;
      margin-left: 8px;
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    .nav-links {
      display: flex;
      gap: 8px;
    }
    
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    /* User avatar */
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }
    
    /* User menu styles */
    .user-menu-header {
      padding: 16px;
      min-width: 200px;
    }
    
    .user-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .user-name {
      margin: 0;
      font-weight: 500;
    }
    
    .user-email {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    /* Mobile menu styles */
    .mobile-menu-button {
      display: none;
    }
    
    .mobile-menu {
      position: fixed;
      top: 64px;
      left: 0;
      right: 0;
      background-color: var(--background-color);
      height: 0;
      overflow: hidden;
      transition: height 0.3s ease;
      z-index: 999;
      box-shadow: var(--elevation-2);
    }
    
    .mobile-menu.open {
      height: calc(100vh - 64px);
      overflow-y: auto;
    }
    
    .mobile-menu nav {
      display: flex;
      flex-direction: column;
      padding: 16px;
    }
    
    .mobile-menu a {
      padding: 16px;
      text-decoration: none;
      color: var(--text-primary);
      font-size: 1.1rem;
      border-bottom: 1px solid var(--border-color);
    }
    
    .mobile-menu a.active {
      color: var(--primary-color);
      font-weight: 500;
    }
    
    .sign-out-button {
      margin-top: 16px;
      padding: 16px;
      background: none;
      border: none;
      text-align: left;
      font-size: 1.1rem;
      color: var(--error-color);
      cursor: pointer;
    }
    
    /* Active link styling */
    .active {
      font-weight: 500;
    }
    
    /* Helper classes */
    .hidden {
      display: none !important;
    }
    
    /* Responsive styles */
    @media (max-width: 768px) {
      .nav-links {
        display: none;
      }
      
      .mobile-menu-button {
        display: block;
      }
    }
  `]
})
export class NavbarComponent implements OnInit {
  public themeService = inject(ThemeService);
  private authService = inject(AuthService);

  // Reactive signals for user state
  isLoggedIn = signal(false);
  isAdminUser = signal(false);

  // Memoized user photo to prevent multiple fetches
  userPhoto = computed(() => {
    const user = this.authService.currentUser();
    return user?.photoURL?.trim() || null; // Ensure valid URL string
  });

  // Mobile menu state
  isMobile = signal(false);
  mobileMenuOpen = signal(false);

  // User data
  user = this.authService.currentUser;

  constructor() {
    // Add reactive effect to update user state
    effect(() => {
      const currentUser = this.authService.currentUser();
      const profile = this.authService.profile();

      console.group('🔍 Navbar Reactivity Update');
      console.log('Current User:', currentUser);
      console.log('User Profile:', profile);
      console.log('User Photo:', this.userPhoto());

      this.isLoggedIn.set(!!currentUser);
      this.isAdminUser.set(profile?.role === 'admin');

      console.log('Is Logged In:', this.isLoggedIn());
      console.log('Is Admin:', this.isAdminUser());
      console.groupEnd();
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  onSignOut() {
    this.authService.signOut();
    this.closeMobileMenu();
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(open => !open);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  private checkScreenSize() {
    this.isMobile.set(window.innerWidth < 768);
    if (!this.isMobile()) {
      this.closeMobileMenu();
    }
  }

  handleImageError(event: ErrorEvent) {
    console.warn('Image load failed', event);
    const img = event.target as HTMLImageElement;
    
    // Prevent infinite error loop
    img.onerror = null; 
    
    // Clear invalid src to prevent retries
    img.src = '';
    
    // Hide the image element
    img.style.display = 'none';
  }
}
