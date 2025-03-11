# User Administration System Specification

## Table of Contents

1. [Overview](#overview)
2. [Current State](#current-state)
3. [Requirements](#requirements)
4. [Implementation Specifications](#implementation-specifications)
   - [Data Models](#1-data-models)
   - [Backend Services](#2-backend-services)
   - [Frontend Components](#3-frontend-components)
   - [Dialog Components](#4-dialog-components)
   - [Security Considerations](#5-security-considerations)
   - [Error Handling](#6-error-handling)
5. [Integration with Existing System](#integration-with-existing-system)
6. [Implementation Steps](#implementation-steps)
7. [Testing Plan](#testing-plan)

## Overview

This document outlines the specifications for implementing a user administration interface in the blog application, focusing on the ability to immediately change user roles. The system will allow administrators to view all users and modify their roles (user, author, admin) with immediate effect across the application.

## Current State

Based on the codebase:
- The application has a Firebase backend with Firestore database
- Authentication is managed through Firebase Authentication
- There is a partial implementation of user management UI in `AdminUsersManagerComponent`
- Three roles exist: 'user', 'author', and 'admin'
- Some UI elements are in place but backend implementation is incomplete

## Requirements

1. Display all users in a paginated, sortable, and filterable table
2. Allow admins to change a user's role immediately via a dropdown
3. Update role changes in both Firestore and Firebase Auth (custom claims)
4. Provide feedback on success or failure of role changes
5. Implement proper security rules to ensure only admins can modify roles
6. Handle error states and edge cases

## Implementation Specifications

### 1. Data Models

#### User Profile Interface

```typescript
// src/app/core/models/user-profile.model.ts
import { Timestamp }

### 4. Dialog Components

#### User Detail Dialog Component

```typescript
// src/app/features/admin/dialogs/user-detail-dialog.component.ts
import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../../core/services/user.service';
import { UserProfile } from '../../../core/models/user-profile.model';
import { MatIconModule } from '@angular/material/icon';
import { Observable, switchMap } from 'rxjs';

@Component({
  selector: 'app-user-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>User Details</h2>
    <mat-dialog-content>
      <div *ngIf="user$ | async as user; else loading" class="user-details">
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
        
        <div class="detail-section">
          <h4>Account Information</h4>
          <div class="detail-row">
            <span class="label">Status:</span>
            <span class="value">
              <span class="status-badge" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                {{ user.isActive ? 'Active' : 'Inactive' }}
              </span>
            </span>
          </div>
          <div class="detail-row">
            <span class="label">Joined:</span>
            <span class="value">{{ user.createdAt.toDate() | date:'medium' }}</span>
          </div>
          <div class="detail-row" *ngIf="user.lastLogin">
            <span class="label">Last Login:</span>
            <span class="value">{{ user.lastLogin.toDate() | date:'medium' }}</span>
          </div>
        </div>
        
        <div class="detail-section" *ngIf="user.bio">
          <h4>Bio</h4>
          <p>{{ user.bio }}</p>
        </div>
        
        <div class="detail-section" *ngIf="user.socialLinks">
          <h4>Social Links</h4>
          <div class="detail-row" *ngIf="user.socialLinks.twitter">
            <span class="label">Twitter:</span>
            <span class="value">{{ user.socialLinks.twitter }}</span>
          </div>
          <div class="detail-row" *ngIf="user.socialLinks.github">
            <span class="label">GitHub:</span>
            <span class="value">{{ user.socialLinks.github }}</span>
          </div>
          <div class="detail-row" *ngIf="user.socialLinks.linkedin">
            <span class="label">LinkedIn:</span>
            <span class="value">{{ user.socialLinks.linkedin }}</span>
          </div>
          <div class="detail-row" *ngIf="user.socialLinks.website">
            <span class="label">Website:</span>
            <span class="value">{{ user.socialLinks.website }}</span>
          </div>
        </div>
      </div>
      
      <ng-template #loading>
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading user details...</p>
        </div>
      </ng-template>
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
      margin-right: 24px;
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
      margin-bottom: 24px;
    }
    
    .detail-section h4 {
      margin-top: 0;
      margin-bottom: 12px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 8px;
    }
    
    .detail-row {
      display: flex;
      margin-bottom: 8px;
    }
    
    .label {
      flex: 0 0 120px;
      font-weight: 500;
    }
    
    .value {
      flex: 1;
    }
    
    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .status-badge.active {
      background-color: #e6f4ea;
      color: #137333;
    }
    
    .status-badge.inactive {
      background-color: #fce8e6;
      color: #c5221f;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
    }
    
    .loading-container p {
      margin-top: 16px;
    }
  `]
})
export class UserDetailDialogComponent implements OnInit {
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef<UserDetailDialogComponent>);
  
  user$!: Observable<UserProfile | null>;
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: { userId: string }) {}
  
  ngOnInit(): void {
    if (this.data && this.data.userId) {
      this.user$ = this.userService.getUserById(this.data.userId);
    }
  }
}
```

#### Invite User Dialog Component

```typescript
// src/app/features/admin/dialogs/invite-user-dialog.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { EMPTY, catchError, finalize, from, tap } from 'rxjs';

@Component({
  selector: 'app-invite-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Invite User</h2>
    <form [formGroup]="inviteForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <p>Send an invitation email to a new user.</p>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" placeholder="user@example.com" required>
          <mat-error *ngIf="inviteForm.get('email')?.hasError('email')">
            Please enter a valid email address
          </mat-error>
          <mat-error *ngIf="inviteForm.get('email')?.hasError('required')">
            Email is required
          </mat-error>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Display Name</mat-label>
          <input matInput formControlName="displayName" placeholder="John Doe" required>
          <mat-error *ngIf="inviteForm.get('displayName')?.hasError('required')">
            Display name is required
          </mat-error>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Initial Role</mat-label>
          <mat-select formControlName="role" required>
            <mat-option value="user">User</mat-option>
            <mat-option value="author">Author</mat-option>
            <mat-option value="admin">Admin</mat-option>
          </mat-select>
          <mat-error *ngIf="inviteForm.get('role')?.hasError('required')">
            Role is required
          </mat-error>
        </mat-form-field>
        
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close [disabled]="isSubmitting">Cancel</button>
        <button 
          mat-raised-button 
          color="primary" 
          type="submit" 
          [disabled]="inviteForm.invalid || isSubmitting">
          <mat-spinner diameter="20" *ngIf="isSubmitting"></mat-spinner>
          <span *ngIf="!isSubmitting">Send Invitation</span>
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    
    mat-dialog-content {
      min-width: 350px;
    }
    
    button mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class InviteUserDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<InviteUserDialogComponent>);
  private functions = inject(Functions);
  private snackBar = inject(MatSnackBar);
  
  inviteForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    displayName: ['', Validators.required],
    role: ['user', Validators.required]
  });
  
  isSubmitting = false;
  
  onSubmit() {
    if (this.inviteForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    
    const { email, displayName, role } = this.inviteForm.value;
    
    const inviteUser = httpsCallable(this.functions, 'inviteUser');
    
    from(inviteUser({ email, displayName, role })).pipe(
      tap(() => {
        this.snackBar.open(`Invitation sent to ${email}`, 'Close', {
          duration: 3000
        });
        this.dialogRef.close(true);
      }),
      catchError(error => {
        console.error('Error inviting user:', error);
        this.snackBar.open(`Error: ${error.message}`, 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
        return EMPTY;
      }),
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe();
  }
}
```

#### Confirmation Dialog Component

```typescript
// src/app/shared/components/confirm-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmButton: string;
  cancelButton: string;
  color?: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ data.cancelButton }}</button>
      <button 
        mat-raised-button 
        [color]="data.color || 'primary'" 
        [mat-dialog-close]="true">
        {{ data.confirmButton }}
      </button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
```

### 5. Security Considerations

1. **Firebase Authentication and Authorization**:
   - Use Firebase Authentication for user management
   - Implement role-based access control using custom claims
   - Ensure Firestore security rules enforce proper access control

2. **Firestore Security Rules**:
   ```
   // Additional security rule for activity logs
   match /activityLogs/{logId} {
     // Only admins can read activity logs
     allow read: if isAdmin();
     // No users should be able to directly write to activity logs
     allow write: if false;
   }
   
   // Role change audit collection
   match /roleChangeAudit/{docId} {
     // Only admins can read audit logs
     allow read: if isAdmin();
     // Only admins can create audit records
     allow create: if isAdmin();
     // No modification of audit records
     allow update, delete: if false;
   }
   ```

3. **Cloud Functions Protection**:
   - Validate administrator role before executing sensitive operations
   - Rate limit sensitive operations
   - Log all admin actions for audit purposes

4. **Input Validation**:
   - Validate all user inputs on both client and server side
   - Sanitize data before displaying to prevent XSS attacks
   - Implement proper error handling to avoid information leakage

5. **Sensitive Data Handling**:
   - Avoid storing or transmitting passwords
   - Use Firebase Auth for password reset flows
   - Follow principle of least privilege for all operations

### 6. Error Handling

1. **User-friendly Error Messages**:
   - Show specific, actionable error messages
   - Log detailed errors for troubleshooting
   - Use snackbar notifications for feedback

2. **Service Error Handling**:
   ```typescript
   // Example of proper error handling in services
   updateUserRole(uid: string, role: UserRole): Observable<void> {
     return this.authService.profile$.pipe(
       switchMap(profile => {
         if (!profile || profile.role !== 'admin') {
           return throwError(() => new Error('Permission denied: Only admins can change user roles'));
         }
         
         // Rest of the implementation...
         return from(Promise.all([updatePromise, claimsPromise, auditPromise]))
           .pipe(
             map(() => undefined),
             catchError(error => {
               // Log the error for debugging
               console.error('Error updating user role:', error);
               
               // Return a user-friendly error message
               return throwError(() => new Error('Failed to update user role. Please try again.'));
             })
           );
       })
     );
   }
   ```

3. **Component Error Handling**:
   ```typescript
   // Example of component-level error handling
   performRoleUpdate(uid: string, newRole: UserRole) {
     this.userService.updateUserRole(uid, newRole).pipe(
       tap(() => {
         this.snackBar.open(`User role updated successfully to ${newRole}`, 'Close', {
           duration: 3000
         });
       }),
       catchError((error) => {
         console.error('Error updating role:', error);
         this.snackBar.open(`Error: ${error.message}`, 'Close', {
           duration: 5000,
           panelClass: 'error-snackbar'
         });
         
         // Reset UI state on error
         const userIndex = this.dataSource.data.findIndex(u => u.uid === uid);
         const originalRole = this.dataSource.data[userIndex]?.role;
         if (userIndex >= 0 && originalRole) {
           this.dataSource.data[userIndex].role = originalRole;
           this.dataSource._updateChangeSubscription();
         }
         
         return EMPTY;
       }),
       finalize(() => {
         // Clean up loading state
         this.updateInProgress = {...this.updateInProgress, [uid]: false};
       })
     ).subscribe();
   }
   ```

## Integration with Existing System

### Update Routes Configuration

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Other routes...
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes')
      .then(m => m.ADMIN_ROUTES),
    canActivate: [adminGuard]
  }
];
```

### Update Admin Routes

```typescript
// src/app/features/admin/admin.routes.ts
import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-dashboard.component')
      .then(m => m.AdminDashboardComponent)
  },
  {
    path: 'posts',
    loadComponent: () => import('./admin-posts.component')
      .then(m => m.AdminPostsComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./admin-users-manager.component')
      .then(m => m.AdminUsersManagerComponent)
  },
  {
    path: 'moderation',
    loadComponent: () => import('./admin-moderation.component')
      .then(m => m.AdminModerationComponent)
  },
  {
    path: 'comments',
    loadComponent: () => import('./admin-comments.component')
      .then(m => m.AdminCommentsComponent)
  }
];
```

### Update Navigation Menu

```typescript
// src/app/core/components/sidebar.component.ts
// Add User Management link to admin section of sidebar

const adminLinks = [
  { path: '/admin', icon: 'dashboard', label: 'Dashboard' },
  { path: '/admin/posts', icon: 'article', label: 'Posts' },
  { path: '/admin/users', icon: 'people', label: 'Users' },
  { path: '/admin/comments', icon: 'comment', label: 'Comments' },
  { path: '/admin/moderation', icon: 'admin_panel_settings', label: 'Moderation' }
];
```

## Implementation Steps

1. **Setup and Configuration**:
   - Create necessary Firebase Cloud Functions for user management
   - Configure Firestore security rules for proper access control
   - Set up custom claims for role-based authentication

2. **Backend Implementation**:
   - Implement the UserService with required methods
   - Create Cloud Functions for user invitation and role management
   - Set up activity logging for audit purposes

3. **Frontend Implementation**:
   - Complete AdminUsersManagerComponent implementation
   - Create dialog components for user interactions
   - Implement error handling and feedback mechanisms

4. **Integration and Testing**:
   - Update routing configuration
   - Add user management to navigation menu
   - Test with different user roles and permissions
   - Verify security rules are working as expected

## Testing Plan

### Unit Tests

1. **UserService Tests**:
   - Test role update functionality
   - Test user activation/deactivation
   - Test security checks and permissions
   - Test error handling

```typescript
// src/app/core/services/user.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { Firestore } from '@angular/fire/firestore';
import { Functions } from '@angular/fire/functions';
import { of, throwError } from 'rxjs';

describe('UserService', () => {
  let service: UserService;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let firestoreSpy: jasmine.SpyObj<Firestore>;
  let functionsSpy: jasmine.SpyObj<Functions>;
  
  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['currentUser'], {
      profile$: of({ uid: 'admin-uid', role: 'admin' })
    });
    
    const firestore = jasmine.createSpyObj('Firestore', ['collection', 'doc']);
    const functions = jasmine.createSpyObj('Functions', ['httpsCallable']);
    
    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: AuthService, useValue: authSpy },
        { provide: Firestore, useValue: firestore },
        { provide: Functions, useValue: functions }
      ]
    });
    
    service = TestBed.inject(UserService);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    firestoreSpy = TestBed.inject(Firestore) as jasmine.SpyObj<Firestore>;
    functionsSpy = TestBed.inject(Functions) as jasmine.SpyObj<Functions>;
  });
  
  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  
  describe('updateUserRole', () => {
    it('should reject role updates if user is not admin', () => {
      // Override the default admin role
      authServiceSpy.profile$ = of({ uid: 'regular-user', role: 'user' });
      
      service.updateUserRole('user-123', 'author').subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.message).toContain('Permission denied');
        }
      });
    });
    
    // More tests for updateUserRole...
  });
  
  // Additional tests for other methods...
});
```

2. **Component Tests**:
   - Test AdminUsersManagerComponent
   - Test dialog components
   - Test UI feedback mechanisms

```typescript
// src/app/features/admin/admin-users-manager.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUsersManagerComponent } from './admin-users-manager.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/auth/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('AdminUsersManagerComponent', () => {
  let component: AdminUsersManagerComponent;
  let fixture: ComponentFixture<AdminUsersManagerComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  
  beforeEach(async () => {
    const userService = jasmine.createSpyObj('UserService', [
      'getUsers', 'updateUserRole', 'deactivateUser', 'activateUser'
    ]);
    const authService = jasmine.createSpyObj('AuthService', ['currentUser']);
    const dialog = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    
    userService.getUsers.and.returnValue(of([]));
    authService.currentUser.and.returnValue({ uid: 'current-user' });
    
    await TestBed.configureTestingModule({
      imports: [
        AdminUsersManagerComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: AuthService, useValue: authService },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(AdminUsersManagerComponent);
    component = fixture.componentInstance;
    userServiceSpy = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    
    fixture.detectChanges();
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should load users on init', () => {
    expect(userServiceSpy.getUsers).toHaveBeenCalled();
  });
  
  // More tests for component functionality...
});
```

### Integration Tests

1. **End-to-End Tests**:
   - Test authentication flow
   - Test role-based access restrictions
   - Test user management workflow
   - Test error scenarios and edge cases

```typescript
// cypress/e2e/admin/user-management.cy.ts
describe('User Management', () => {
  beforeEach(() => {
    // Log in as admin
    cy.login('admin@example.com', 'password');
    cy.visit('/admin/users');
  });
  
  it('should display user list', () => {
    cy.get('table').should('be.visible');
    cy.contains('th', 'Name').should('be.visible');
    cy.contains('th', 'Email').should('be.visible');
    cy.contains('th', 'Role').should('be.visible');
  });
  
  it('should be able to change user role', () => {
    // Find a test user and change their role
    cy.contains('td', 'test@example.com')
      .parent()
      .within(() => {
        cy.get('mat-select').click();
      });
    
    cy.get('mat-option').contains('Author').click();
    
    // Verify success message
    cy.contains('User role updated successfully').should('be.visible');
  });
  
  // More e2e tests...
});
```

2. **Security Tests**:
   - Test Firestore security rules
   - Test authorization checks
   - Test role-based permissions

```typescript
// firestore.rules.test.js
const { assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const firebase = require('@firebase/rules-unit-testing');

describe('Firestore Security Rules', () => {
  let adminDb;
  let userDb;
  
  before(async () => {
    // Set up test environment
    adminDb = firebase.initializeTestApp({
      projectId: 'test-project',
      auth: { uid: 'admin', email: 'admin@example.com', token: { admin: true } }
    }).firestore();
    
    userDb = firebase.initializeTestApp({
      projectId: 'test-project',
      auth: { uid: 'user', email: 'user@example.com' }
    }).firestore();
  });
  
  after(() => {
    firebase.clearFirestoreData({ projectId: 'test-project' });
  });
  
  describe('User Collection Rules', () => {
    it('should allow admins to read any user', async () => {
      const userRef = adminDb.collection('users').doc('user123');
      await assertSucceeds(userRef.get());
    });
    
    it('should allow users to read their own profile', async () => {
      const userRef = userDb.collection('users').doc('user');
      await assertSucceeds(userRef.get());
    });
    
    it('should not allow users to read other user profiles', async () => {
      const otherUserRef = userDb.collection('users').doc('otherUser');
      await assertFails(otherUserRef.get());
    });
    
    it('should allow admins to update user roles', async () => {
      const userRef = adminDb.collection('users').doc('user123');
      await assertSucceeds(userRef.update({ role: 'author' }));
    });
    
    it('should not allow users to update their own role', async () => {
      const userRef = userDb.collection('users').doc('user');
      await assertFails(userRef.update({ role: 'admin' }));
    });
    
    // More security rule tests...
  });
});
```

## Conclusion

This specification details a comprehensive user administration system for the blog application. The implementation follows best practices for security, performance, and user experience, while leveraging the existing architecture and technologies.

Key features of the system include:
1. Role-based access control with three user roles (user, author, admin)
2. Immediate role changes with proper security checks
3. User activation/deactivation functionality
4. Audit logging for security and compliance
5. Comprehensive error handling and user feedback

The implementation is designed to be secure, maintainable, and extensible for future requirements. from '@angular/fire/firestore';

export type UserRole = 'user' | 'author' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  lastLogin?: Timestamp;
  isActive: boolean;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
}
```

#### Role Change Event Interface

```typescript
// src/app/features/admin/models/role-change.model.ts
import { UserRole } from '../../core/models/user-profile.model';

export interface RoleChangeEvent {
  uid: string;
  previousRole: UserRole;
  newRole: UserRole;
  changedBy: string; // UID of admin who made the change
  timestamp: Date;
}
```

### 2. Backend Services

#### User Service Implementation

```typescript
// src/app/core/services/user.service.ts
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  doc, 
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  serverTimestamp,
  Timestamp,
  collectionData,
  docData
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable, from, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserProfile, UserRole } from '../models/user-profile.model';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore = inject(Firestore);
  private functions = inject(Functions);
  private authService = inject(AuthService);
  
  /**
   * Get a paginated list of users
   * @param pageSize Number of users per page
   * @param lastUser Last user from previous page (for pagination)
   * @param roleFilter Optional role to filter by
   * @returns Observable of UserProfile array
   */
  getUsers(pageSize: number = 10, lastUser?: UserProfile, roleFilter?: UserRole): Observable<UserProfile[]> {
    const usersCollection = collection(this.firestore, 'users');
    
    let userQuery = query(
      usersCollection,
      orderBy('displayName'),
      limit(pageSize)
    );
    
    // Apply role filter if provided
    if (roleFilter) {
      userQuery = query(
        userQuery,
        where('role', '==', roleFilter)
      );
    }
    
    // Apply pagination if last user provided
    if (lastUser) {
      userQuery = query(
        userQuery,
        startAfter(lastUser.displayName)
      );
    }
    
    return collectionData(userQuery) as Observable<UserProfile[]>;
  }
  
  /**
   * Get a user by ID
   * @param uid User ID
   * @returns Observable of UserProfile
   */
  getUserById(uid: string): Observable<UserProfile | null> {
    const userDoc = doc(this.firestore, 'users', uid);
    return docData(userDoc).pipe(
      map(data => data as UserProfile),
      catchError(error => {
        console.error('Error fetching user:', error);
        return of(null);
      })
    );
  }
  
  /**
   * Search users by name or email
   * @param searchTerm Term to search for
   * @param limit Maximum number of results
   * @returns Observable of UserProfile array
   */
  searchUsers(searchTerm: string, limit: number = 10): Observable<UserProfile[]> {
    // Note: Firestore doesn't support direct text search
    // For production, consider using Algolia or similar
    // This is a simplified implementation
    const usersCollection = collection(this.firestore, 'users');
    const nameQuery = query(
      usersCollection,
      where('displayName', '>=', searchTerm),
      where('displayName', '<=', searchTerm + '\uf8ff'),
      limit(limit)
    );
    
    const emailQuery = query(
      usersCollection,
      where('email', '>=', searchTerm),
      where('email', '<=', searchTerm + '\uf8ff'),
      limit(limit)
    );
    
    // Combine results from both queries
    return from(Promise.all([getDocs(nameQuery), getDocs(emailQuery)])).pipe(
      map(([nameSnapshot, emailSnapshot]) => {
        const nameResults = nameSnapshot.docs.map(doc => doc.data() as UserProfile);
        const emailResults = emailSnapshot.docs.map(doc => doc.data() as UserProfile);
        
        // Combine and deduplicate results
        const combined = [...nameResults, ...emailResults];
        const uniqueIds = new Set();
        return combined.filter(user => {
          if (uniqueIds.has(user.uid)) {
            return false;
          }
          uniqueIds.add(user.uid);
          return true;
        });
      })
    );
  }
  
  /**
   * Update a user's role
   * @param uid The user's unique ID
   * @param role The new role to assign
   * @returns Observable that completes when the update is done
   */
  updateUserRole(uid: string, role: UserRole): Observable<void> {
    // First check if current user is admin
    return this.authService.profile$.pipe(
      switchMap(profile => {
        if (!profile || profile.role !== 'admin') {
          return throwError(() => new Error('Permission denied: Only admins can change user roles'));
        }
        
        // Update role in Firestore
        const userRef = doc(this.firestore, 'users', uid);
        const updatePromise = updateDoc(userRef, {
          role: role,
          updatedAt: serverTimestamp()
        });
        
        // Update custom claims via Cloud Function
        const setCustomClaims = httpsCallable(this.functions, 'setCustomUserClaims');
        const claimsPromise = setCustomClaims({ 
          uid, 
          claims: { 
            admin: role === 'admin',
            author: role === 'author' || role === 'admin'
          } 
        });
        
        // Log role change in audit log
        const currentUserUid = this.authService.currentUser()?.uid;
        const auditLogRef = doc(collection(this.firestore, 'roleChangeAudit'));
        const auditPromise = currentUserUid ? 
          setDoc(auditLogRef, {
            uid,
            newRole: role,
            changedBy: currentUserUid,
            timestamp: serverTimestamp()
          }) : Promise.resolve();
        
        // Return combined promise
        return from(Promise.all([updatePromise, claimsPromise, auditPromise]))
          .pipe(
            map(() => undefined),
            catchError(error => {
              console.error('Error updating user role:', error);
              return throwError(() => new Error('Failed to update user role. Please try again.'));
            })
          );
      })
    );
  }
  
  /**
   * Deactivate a user account
   * @param uid User ID to deactivate
   * @returns Observable that completes when the action is done
   */
  deactivateUser(uid: string): Observable<void> {
    return this.authService.profile$.pipe(
      switchMap(profile => {
        if (!profile || profile.role !== 'admin') {
          return throwError(() => new Error('Permission denied: Only admins can deactivate users'));
        }
        
        // Don't allow deactivating your own account
        if (this.authService.currentUser()?.uid === uid) {
          return throwError(() => new Error('You cannot deactivate your own account'));
        }
        
        const userRef = doc(this.firestore, 'users', uid);
        return from(updateDoc(userRef, {
          isActive: false,
          updatedAt: serverTimestamp()
        })).pipe(
          map(() => undefined),
          catchError(error => {
            console.error('Error deactivating user:', error);
            return throwError(() => new Error('Failed to deactivate user account'));
          })
        );
      })
    );
  }
  
  /**
   * Activate a user account
   * @param uid User ID to activate
   * @returns Observable that completes when the action is done
   */
  activateUser(uid: string): Observable<void> {
    return this.authService.profile$.pipe(
      switchMap(profile => {
        if (!profile || profile.role !== 'admin') {
          return throwError(() => new Error('Permission denied: Only admins can activate users'));
        }
        
        const userRef = doc(this.firestore, 'users', uid);
        return from(updateDoc(userRef, {
          isActive: true,
          updatedAt: serverTimestamp()
        })).pipe(
          map(() => undefined),
          catchError(error => {
            console.error('Error activating user:', error);
            return throwError(() => new Error('Failed to activate user account'));
          })
        );
      })
    );
  }
}
```

#### Cloud Functions for Role Management

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Cloud Function to set custom claims for a user
 * Used for role-based access control
 */
export const setCustomUserClaims = functions.https.onCall(async (data, context) => {
  // Check if request is made by an admin
  if (!(context.auth && context.auth.token.admin === true)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can set custom claims'
    );
  }
  
  const { uid, claims } = data;
  
  if (!uid || typeof uid !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with a valid uid (string).'
    );
  }
  
  try {
    // Set custom user claims
    await admin.auth().setCustomUserClaims(uid, claims);
    
    // Update the user's profile in Firestore to reflect the changes
    // This is useful for querying users by role directly in Firestore
    await admin.firestore().collection('users').doc(uid).update({
      role: claims.admin ? 'admin' : (claims.author ? 'author' : 'user'),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw new functions.https.HttpsError(
      'internal',
      'There was an error while setting custom claims.'
    );
  }
});

/**
 * Firestore trigger to log role changes
 */
export const logRoleChange = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    // Check if role changed
    if (beforeData.role !== afterData.role) {
      const { userId } = context.params;
      
      await admin.firestore().collection('activityLogs').add({
        type: 'ROLE_CHANGE',
        userId,
        oldRole: beforeData.role,
        newRole: afterData.role,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
```

#### Firestore Security Rules

```
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && request.auth.token.admin == true;
    }
    
    function isCurrentUser(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection rules
    match /users/{userId} {
      // Anyone can read their own profile
      // Admins can read any profile
      allow read: if isCurrentUser(userId) || isAdmin();
      
      // Anyone can create their own basic profile
      allow create: if isCurrentUser(userId);
      
      // Users can update their own profile except for role field
      // Only admins can update role field
      allow update: if isCurrentUser(userId) && 
                      !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'isActive'])
                   || isAdmin();
                   
      // Only admins can delete users
      allow delete: if isAdmin();
    }
    
    // Role change audit logs
    match /roleChangeAudit/{docId} {
      // Only admins can read and write audit logs
      allow read, write: if isAdmin();
    }
    
    // Activity logs
    match /activityLogs/{logId} {
      // Only admins can read logs
      allow read: if isAdmin();
      // System-only writes
      allow write: if false;
    }
  }
}
```

### 3. Frontend Components

#### Update AdminUsersManagerComponent Implementation

```typescript
// src/app/features/admin/admin-users-manager.component.ts
import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/auth/auth.service';
import { UserProfile, UserRole } from '../../core/models/user-profile.model';
import { EMPTY, Observable, catchError, finalize, first, tap } from 'rxjs';
import { UserDetailDialogComponent } from './dialogs/user-detail-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { InviteUserDialogComponent } from './dialogs/invite-user-dialog.component';

@Component({
  selector: 'app-admin-users-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="users-manager-container">
      <div class="page-header">
        <h1>User Management</h1>
        
        <div class="header-actions">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search users</mat-label>
            <input matInput (keyup)="applyFilter($event)" placeholder="Search by name or email">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          
          <button mat-raised-button color="primary" (click)="inviteUser()">
            <mat-icon>person_add</mat-icon>
            Invite User
          </button>
        </div>
      </div>
      
      <div class="users-table-container mat-elevation-z2">
        <table mat-table [dataSource]="dataSource" matSort>
          <!-- Avatar Column -->
          <ng-container matColumnDef="avatar">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let user">
              <div class="user-avatar">
                <img *ngIf="user.photoURL" [src]="user.photoURL" [alt]="user.displayName">
                <mat-icon *ngIf="!user.photoURL">account_circle</mat-icon>
              </div>
            </td>
          </ng-container>
          
          <!-- Display Name Column -->
          <ng-container matColumnDef="displayName">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
            <td mat-cell *matCellDef="let user">
              {{ user.displayName }}
            </td>
          </ng-container>
          
          <!-- Email Column -->
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
            <td mat-cell *matCellDef="let user">{{ user.email }}</td>
          </ng-container>
          
          <!-- Role Column -->
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Role</th>
            <td mat-cell *matCellDef="let user">
              <mat-form-field appearance="outline" class="role-select">
                <mat-select 
                  [(value)]="user.role" 
                  (selectionChange)="updateUserRole(user.uid, $event.value)"
                  [disabled]="user.uid === currentUserUid() || updateInProgress[user.uid]">
                  <mat-option value="user">User</mat-option>
                  <mat-option value="author">Author</mat-option>
                  <mat-option value="admin">Admin</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-spinner *ngIf="updateInProgress[user.uid]" diameter="20"></mat-spinner>
            </td>
          </ng-container>
          
          <!-- Created Date Column -->
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Joined</th>
            <td mat-cell *matCellDef="let user">
              {{ user.createdAt ? (user.createdAt.toDate() | date:'mediumDate') : 'N/A' }}
            </td>
          </ng-container>
          
          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
            <td mat-cell *matCellDef="let user">
              <span class="status-badge" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                {{ user.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
          </ng-container>
          
          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let user">
              <button mat-icon-button [matMenuTriggerFor]="userMenu">
                <mat-icon>more_vert</mat-icon>
              </button>
              
              <mat-menu #userMenu="matMenu">
                <button mat-menu-item (click)="viewUserDetails(user)">
                  <mat-icon>visibility</mat-icon>
                  <span>View Details</span>
                </button>
                <button mat-menu-item (click)="viewUserPosts(user)">
                  <mat-icon>description</mat-icon>
                  <span>View Posts</span>
                </button>
                <button mat-menu-item (click)="resetUserPassword(user)">
                  <mat-icon>lock_reset</mat-icon>
                  <span>Reset Password</span>
                </button>
                <button mat-menu-item (click)="deactivateUser(user)" 
                        *ngIf="user.uid !== currentUserUid() && user.isActive">
                  <mat-icon color="warn">block</mat-icon>
                  <span>Deactivate Account</span>
                </button>
                <button mat-menu-item (click)="activateUser(user)" 
                        *ngIf="user.uid !== currentUserUid() && !user.isActive">
                  <mat-icon color="primary">check_circle</mat-icon>
                  <span>Activate Account</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>
          
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          
          <!-- Row shown when no matching data -->
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell" colspan="7">No users found matching the filter.</td>
          </tr>
        </table>
        
        <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]" showFirstLastButtons></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .users-manager-container {
      padding: 24px;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    
    .header-actions {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .search-field {
      width: 300px;
    }
    
    .users-table-container {
      position: relative;
      min-height: 400px;
      overflow: auto;
    }
    
    table {
      width: 100%;
    }
    
    .user-avatar {
      width: 40px;
      height: 40px;
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
    
    .role-select {
      width: 100px;
    }
    
    .mat-column-avatar {
      width: 60px;
      text-align: center;
    }
    
    .mat-column-actions {
      width: 60px;
      text-align: right;
    }
    
    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .status-badge.active {
      background-color: #e6f4ea;
      color: #137333;
    }
    
    .status-badge.inactive {
      background-color: #fce8e6;
      color: #c5221f;
    }
  `]
})
export class AdminUsersManagerComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  dataSource = new MatTableDataSource<UserProfile>([]);
  displayedColumns: string[] = ['avatar', 'displayName', 'email', 'role', 'status', 'createdAt', 'actions'];
  
  currentUserUid = signal<string>('');
  
  // Track role update operations in progress
  updateInProgress: Record<string, boolean> = {};
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  ngOnInit() {
    // Get current user for comparison (can't deactivate yourself)
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.currentUserUid.set(currentUser.uid);
    }
    
    // Load users
    this.loadUsers();
  }
  
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  loadUsers() {
    this.userService.getUsers(100).pipe(
      first()
    ).subscribe({
      next: (users) => {
        this.dataSource.data = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.snackBar.open('Error loading users. Please try again.', 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }
    });
  }
  
  updateUserRole(uid: string, newRole: UserRole) {
    // Don't allow changing your own role
    if (uid === this.currentUserUid()) {
      this.snackBar.open('You cannot change your own role.', 'Close', {
        duration: 5000,
        panelClass: 'error-snackbar'
      });
      return;
    }
    
    // Set loading state
    this.updateInProgress = {...this.updateInProgress, [uid]: true};
    
    // Confirm before promoting to admin
    const user = this.dataSource.data.find(u => u.uid === uid);
    if (newRole === 'admin' && user?.role !== 'admin') {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Promote to Admin',
          message: `Are you sure you want to promote ${user?.displayName} to an admin? This will grant them full access to the system.`,
          confirmButton: 'Promote',
          cancelButton: 'Cancel'
        }
      });
      
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.performRoleUpdate(uid, newRole);
        } else {
          // Reset the role in the UI if canceled
          const userIndex = this.dataSource.data.findIndex(u => u.uid === uid);
          if (userIndex >= 0) {
            this.dataSource.data[userIndex].role = user?.role || 'user';
            this.dataSource._updateChangeSubscription();
          }
          this.updateInProgress = {...this.updateInProgress, [uid]: false};
        }
      });
    } else {
      this.performRoleUpdate(uid, newRole);
    }
  }
  
  performRoleUpdate(uid: string, newRole: UserRole) {
    this.userService.updateUserRole(uid, newRole).pipe(
      tap(() => {
        this.snackBar.open(`User role updated successfully to ${newRole}`, 'Close', {
          duration: 3000
        });
      }),
      catchError((error) => {
        console.error('Error updating role:', error);
        this.snackBar.open(`Error: ${error.message}`, 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
        
        // Reset the role in the UI
        const userIndex = this.dataSource.data.findIndex(u => u.uid === uid);
        const originalRole = this.dataSource.data[userIndex]?.role;
        if (userIndex >= 0 && originalRole) {
          this.dataSource.data[userIndex].role = originalRole;
          this.dataSource._updateChangeSubscription();
        }
        
        return EMPTY;
      }),
      finalize(() => {
        this.updateInProgress = {...this.updateInProgress, [uid]: false};
      })
    ).subscribe();
  }
  
  inviteUser() {
    const dialogRef = this.dialog.open(InviteUserDialogComponent, {
      width: '500px'
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers(); // Reload the user list
      }
    });
  }
  
  viewUserDetails(user: UserProfile) {
    this.dialog.open(UserDetailDialogComponent, {
      width: '600px',
      data: { userId: user.uid }
    });
  }
  
  viewUserPosts(user: UserProfile) {
    // Navigate to user posts page or open in dialog
    console.log('View posts for user:', user.uid);
  }
  
  resetUserPassword(user: UserProfile) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Reset Password',
        message: `Send a password reset email to ${user.email}?`,
        confirmButton: 'Send Reset Email',
        cancelButton: 'Cancel'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Implement password reset logic
        this.snackBar.open(`Password reset email sent to ${user.email}`, 'Close', {
          duration: 3000
        });
      }
    });
  }
  
  deactivateUser(user: UserProfile) {
    if (user.uid === this.currentUserUid()) {
      this.snackBar.open('You cannot deactivate your own account.', 'Close', {
        duration: 5000,
        panelClass: 'error-snackbar'
      });
      return;
    }
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Deactivate User',
        message: `Are you sure you want to deactivate ${user.displayName}'s account? They will no longer be able to login.`,
        confirmButton: 'Deactivate',
        cancelButton: 'Cancel'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.deactivateUser(user.uid).pipe(
          tap(() => {
            // Update the user in the data source
            const userIndex = this.dataSource.data.findIndex(u => u.uid === user.uid);
            if (userIndex >= 0) {
              this.dataSource.data[userIndex].isActive = false;
              this.dataSource._updateChangeSubscription();
            }
            
            this.snackBar.open(`User account deactivated successfully`, 'Close', {
              duration: 3000
            });
          }),
          catchError((error) => {
            console.error('Error deactivating user:', error);
            this.snackBar.open(`Error: ${error.message}`, 'Close', {
              duration: 5000,
              panelClass: 'error-snackbar'
            });
            return EMPTY;
          })
        ).subscribe();
      }
    });
  }
  
  activateUser(user: UserProfile) {
    this.userService.activateUser(user.uid).pipe(
      tap(() => {
        // Update the user in the data source
        const userIndex = this.dataSource.data.findIndex(u => u.uid === user.uid);
        if (userIndex >= 0) {
          this.dataSource.data[userIndex].isActive = true;
          this.dataSource._updateChangeSubscription();
        }
        
        this.snackBar.open(`User account activated successfully`, 'Close', {
          duration: 3000
        });
      }),
      catchError((error) => {
        console.error('Error activating user:', error);
        this.snackBar.open(`Error: ${error.message}`, 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
        return EMPTY;
      })
    ).subscribe();
  }
}