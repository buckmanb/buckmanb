import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserProfile } from '../../../core/models/user-profile.model';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { UserService } from '../../../core/services/user.service'

@Component({
  selector: 'app-user-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    TitleCasePipe
  ],
  template: `
    <h2 mat-dialog-title>User Details</h2>
    <mat-dialog-content>
      <div *ngIf="user" class="user-details">
        <div class="user-header">
          <div class="user-avatar">
            <img *ngIf="user.photoURL" [src]="user.photoURL" [alt]="user.displayName">
            <mat-icon *ngIf="!user.photoURL" class="large-icon">account_circle</mat-icon>
          </div>
          <div class="user-name">
            <h3>{{ user.displayName }}</h3>
            <p class="user-email">{{ user.email }}</p>
            <p class="user-role">{{ user.role | titlecase }}</p>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="detail-section">
          <h4>Account Information</h4>
          <mat-list>
            <mat-list-item>
              <span matListItemTitle>Status</span>
              <span matListItemLine>
                <mat-chip [class.active]="user.isActive" [class.inactive]="!user.isActive">
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </mat-chip>
              </span>
            </mat-list-item>
            <mat-list-item>
              <span matListItemTitle>Joined</span>
              <span matListItemLine>{{ user.createdAt | date:'medium' }}</span>
            </mat-list-item>
            <mat-list-item *ngIf="user.lastLogin">
              <span matListItemTitle>Last Login</span>
              <span matListItemLine>{{ formatDate(user.lastLogin) }}</span>
            </mat-list-item>
          </mat-list>
        </div>

        <mat-divider></mat-divider>

        <div class="detail-section" *ngIf="user.socialLinks">
          <h4>Social Links</h4>
          <mat-list>
            <mat-list-item *ngIf="user.socialLinks.twitter">
              <span matListItemTitle>Twitter</span>
              <a [href]="user.socialLinks.twitter" target="_blank" rel="noopener">
                {{ user.socialLinks.twitter }}
              </a>
            </mat-list-item>
            <mat-list-item *ngIf="user.socialLinks.github">
              <span matListItemTitle>GitHub</span>
              <a [href]="user.socialLinks.github" target="_blank" rel="noopener">
                {{ user.socialLinks.github }}
              </a>
            </mat-list-item>
            <mat-list-item *ngIf="user.socialLinks.linkedin">
              <span matListItemTitle>LinkedIn</span>
              <a [href]="user.socialLinks.linkedin" target="_blank" rel="noopener">
                {{ user.socialLinks.linkedin }}
              </a>
            </mat-list-item>
            <mat-list-item *ngIf="user.socialLinks.website">
              <span matListItemTitle>Website</span>
              <a [href]="user.socialLinks.website" target="_blank" rel="noopener">
                {{ user.socialLinks.website }}
              </a>
            </mat-list-item>
          </mat-list>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .user-details {
      padding: 16px 0;
    }
    
    .user-header {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 24px;
    }
    
    .user-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #e0e0e0;
    }
    
    .user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .large-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
    }
    
    .user-name h3 {
      margin: 0 0 8px 0;
      font-size: 24px;
    }
    
    .user-email {
      margin: 0 0 4px 0;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .user-role {
      margin: 0;
      font-weight: 500;
    }
    
    .detail-section {
      margin: 24px 0;
    }
    
    .active {
      background-color: #e6f4ea;
      color: #137333;
    }
    
    .inactive {
      background-color: #fce8e6;
      color: #c5221f;
    }
    
    mat-divider {
      margin: 16px 0;
    }
  `]
})
export class UserDetailDialogComponent {
  user: UserProfile | null = null;
  private userService = inject(UserService);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { userId: string }
  ) {

    this.userService.getUserById(data.userId).subscribe(data => {
      this.user = data as UserProfile;
    });    
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

}
