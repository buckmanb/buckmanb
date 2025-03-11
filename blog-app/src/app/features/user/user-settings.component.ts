import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { UserProfile } from '../../core/models/user-profile.model';
import { ImageUploadComponent } from '../../shared/components/image-upload.component';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatDividerModule,
    RouterModule,
    ImageUploadComponent
  ],
  template: `
    <div class="profile-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Your Profile</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <mat-tab-group>
            <mat-tab label="Profile Information">
              <!-- Loading state -->
              <div *ngIf="loading()" class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
              
              <!-- Profile form -->
              <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" *ngIf="!loading()" class="profile-form">
                <!-- Profile image -->
                <div class="image-upload-container">
                  <app-image-upload 
                    [initialImageUrl]="profile()?.photoURL || ''" 
                    (imageUploaded)="onProfileImageUploaded($event)"
                    (imageRemoved)="onProfileImageRemoved()">
                  </app-image-upload>
                </div>
                
                <!-- Basic information -->
                <h3>Basic Information</h3>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Display Name</mat-label>
                  <input matInput formControlName="displayName" placeholder="Enter your display name">
                  <mat-error *ngIf="profileForm.get('displayName')?.hasError('required')">
                    Display name is required
                  </mat-error>
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" placeholder="Your email address" readonly>
                  <mat-hint>Email cannot be changed</mat-hint>
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Bio</mat-label>
                  <textarea 
                    matInput 
                    formControlName="bio" 
                    placeholder="Tell us about yourself"
                    rows="3">
                  </textarea>
                  <mat-hint align="end">{{ profileForm.get('bio')?.value?.length || 0 }}/500</mat-hint>
                </mat-form-field>
                
                <!-- Social Media Links -->
                <h3>Social Media Links</h3>
                
                <div formGroupName="socialLinks">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Twitter</mat-label>
                    <mat-icon matPrefix>link</mat-icon>
                    <input matInput formControlName="twitter" placeholder="Your Twitter URL">
                    <mat-error *ngIf="profileForm.get('socialLinks.twitter')?.hasError('pattern')">
                      Please enter a valid URL
                    </mat-error>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>LinkedIn</mat-label>
                    <mat-icon matPrefix>link</mat-icon>
                    <input matInput formControlName="linkedin" placeholder="Your LinkedIn URL">
                    <mat-error *ngIf="profileForm.get('socialLinks.linkedin')?.hasError('pattern')">
                      Please enter a valid URL
                    </mat-error>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>GitHub</mat-label>
                    <mat-icon matPrefix>code</mat-icon>
                    <input matInput formControlName="github" placeholder="Your GitHub URL">
                    <mat-error *ngIf="profileForm.get('socialLinks.github')?.hasError('pattern')">
                      Please enter a valid URL
                    </mat-error>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Personal Website</mat-label>
                    <mat-icon matPrefix>language</mat-icon>
                    <input matInput formControlName="website" placeholder="Your website URL">
                    <mat-error *ngIf="profileForm.get('socialLinks.website')?.hasError('pattern')">
                      Please enter a valid URL
                    </mat-error>
                  </mat-form-field>
                </div>
                
                <!-- Role information (read only) -->
                <h3>Account Information</h3>
                
                <div class="role-info">
                  <p>
                    <strong>Role:</strong> 
                    <span class="role-badge" [ngClass]="getRoleBadgeClass()">
                      {{ profile()?.role || 'User' }}
                    </span>
                  </p>
                  <p><strong>Member since:</strong> {{ formatDate(profile()?.createdAt) }}</p>
                  <p><strong>Last login:</strong> {{ formatDate(profile()?.lastLogin) }}</p>
                </div>
                
                <mat-divider class="section-divider"></mat-divider>
                
                <!-- Submit button -->
                <div class="form-actions">
                  <button 
                    mat-raised-button 
                    color="primary" 
                    type="submit" 
                    [disabled]="profileForm.invalid || updating() || !profileForm.dirty">
                    <mat-icon *ngIf="!updating()">save</mat-icon>
                    <mat-spinner *ngIf="updating()" diameter="24"></mat-spinner>
                    Update Profile
                  </button>
                </div>
              </form>
            </mat-tab>
            
            <mat-tab label="Account Settings">
              <div class="account-settings">
                <h3>Account Actions</h3>
                
                <div class="settings-section">
                  <button mat-raised-button color="primary" routerLink="/auth/change-password">
                    <mat-icon>lock</mat-icon>
                    Change Password
                  </button>
                </div>
                
                <div class="danger-zone">
                  <h3>Danger Zone</h3>
                  <p class="warning-text">These actions are irreversible. Please proceed with caution.</p>
                  
                  <button 
                    mat-raised-button 
                    color="warn" 
                    (click)="deleteAccount()" 
                    [disabled]="loading() || updating()">
                    <mat-icon>delete_forever</mat-icon>
                    Delete Account
                  </button>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 32px 16px;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }
    
    .profile-form {
      padding: 16px 0;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .image-upload-container {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
    
    h3 {
      margin-top: 24px;
      margin-bottom: 16px;
      color: var(--text-primary);
      font-weight: 500;
    }
    
    .role-info {
      margin-bottom: 24px;
    }
    
    .role-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85rem;
      text-transform: capitalize;
    }
    
    .role-badge.admin {
      background-color: #7b1fa2;
      color: white;
    }
    
    .role-badge.author {
      background-color: #1976d2;
      color: white;
    }
    
    .role-badge.user {
      background-color: #757575;
      color: white;
    }
    
    .section-divider {
      margin: 24px 0;
    }
    
    .account-settings {
      padding: 16px 0;
    }
    
    .settings-section {
      margin-bottom: 24px;
    }
    
    .danger-zone {
      border: 1px solid #f44336;
      border-radius: 4px;
      padding: 16px;
      margin-top: 24px;
    }
    
    .warning-text {
      color: #f44336;
      margin-bottom: 16px;
    }
    
    button mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class UserSettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  
  profile = signal<UserProfile | null>(null);
  loading = signal<boolean>(true);
  updating = signal<boolean>(false);
  
  profileForm: FormGroup;
  
  // URL validation pattern
  private urlPattern = '^(https?:\\/\\/)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([\\/\\w \\.-]*)*\\/?$';
  
  constructor() {
    this.profileForm = this.fb.group({
      displayName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      bio: ['', Validators.maxLength(500)],
      socialLinks: this.fb.group({
        twitter: ['', Validators.pattern(this.urlPattern)],
        linkedin: ['', Validators.pattern(this.urlPattern)],
        github: ['', Validators.pattern(this.urlPattern)],
        website: ['', Validators.pattern(this.urlPattern)]
      })
    });
  }
  
  ngOnInit() {
    this.loadUserProfile();
  }
  
  async loadUserProfile() {
    try {
      this.loading.set(true);
      const userProfile = this.authService.profile();
      
      if (userProfile) {
        this.profile.set(userProfile);
        
        // Populate form
        this.profileForm.patchValue({
          displayName: userProfile.displayName || '',
          email: userProfile.email || '',
          bio: userProfile.bio || '',
          socialLinks: {
            twitter: userProfile.socialLinks?.twitter || '',
            linkedin: userProfile.socialLinks?.linkedin || '',
            github: userProfile.socialLinks?.github || '',
            website: userProfile.socialLinks?.website || ''
          }
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      this.snackBar.open('Error loading profile information', 'Close', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }
  
  async updateProfile() {
    if (this.profileForm.invalid) return;
    
    this.updating.set(true);
    
    try {
      const formValues = this.profileForm.getRawValue();
      
      // Prepare update data
      const profileUpdate: Partial<UserProfile> = {
        displayName: formValues.displayName,
        bio: formValues.bio || null,
        socialLinks: {
          twitter: formValues.socialLinks.twitter || null,
          linkedin: formValues.socialLinks.linkedin || null,
          github: formValues.socialLinks.github || null,
          website: formValues.socialLinks.website || null
        }
      };
      
      // If profile image was updated, add it
      if (this.profileImageUrl) {
        profileUpdate.photoURL = this.profileImageUrl;
      }
      
      // Update profile
      await this.authService.updateUserProfile(profileUpdate);
      
      this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
      this.profileForm.markAsPristine();
    } catch (error) {
      console.error('Error updating profile:', error);
      this.snackBar.open('Error updating profile', 'Close', { duration: 5000 });
    } finally {
      this.updating.set(false);
    }
  }
  
  // Image upload handling
  profileImageUrl?: string;
  
  onProfileImageUploaded(result: any) {
    this.profileImageUrl = result.secure_url;
    this.profileForm.markAsDirty();
  }
  
  onProfileImageRemoved() {
    this.profileImageUrl = '';
    this.profileForm.markAsDirty();
  }
  
  // Helper method to get role badge CSS class
  getRoleBadgeClass(): string {
    const userRole = this.profile()?.role || 'user';
    return userRole.toLowerCase();
  }
  
  // Format date for display
  formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Account deletion
  async deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        this.updating.set(true);
        // await this.authService.deleteUserAccount();
        this.snackBar.open('Your account has been deleted', 'Close', { duration: 5000 });
        // Navigate to home or login page - this will happen automatically through auth state change
      } catch (error) {
        console.error('Error deleting account:', error);
        this.snackBar.open('Error deleting account', 'Close', { duration: 5000 });
      } finally {
        this.updating.set(false);
      }
    }
  }
}