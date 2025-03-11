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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/auth/auth.service';
import { UserProfile } from '../../core/models/user-profile.model';
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
    MatSnackBarModule,
    MatProgressSpinnerModule
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
              {{ formatDate(user.createdAt) }}
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
                <button mat-menu-item (click)="toggleUserStatus(user)" 
                        *ngIf="user.uid !== currentUserUid()">
                  <mat-icon color="warn">block</mat-icon>
                  <span>{{ user.isActive ? 'Deactivate' : 'Activate' }}</span>
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
  updateInProgress: Record<string, boolean> = {};
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.currentUserUid.set(currentUser.uid);
    }
    
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
    this.userService.getUsers().pipe(
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

  formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';
    
    try {
      // First, check if it's a Firestore Timestamp object with toDate method
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString();
      }
      // If it's already a Date object
      else if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
      // If it's a string or number that can be parsed into a date
      else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        return new Date(timestamp).toLocaleDateString();
      }
      // Fallback for any other case
      return 'N/A';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  }

  async updateUserRole(uid: string, newRole: string) {
    if (uid === this.currentUserUid()) {
      this.snackBar.open('You cannot change your own role.', 'Close', { duration: 3000 });
      return;
    }

    this.updateInProgress = {...this.updateInProgress, [uid]: true};
    
    try {
      await this.userService.updateUserRole(uid, newRole as any).toPromise();
      this.snackBar.open('Role updated successfully', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Role update failed:', error);
      this.snackBar.open('Failed to update role', 'Close', { duration: 3000 });
    } finally {
      this.updateInProgress = {...this.updateInProgress, [uid]: false};
    }
  }

  viewUserDetails(user: UserProfile) {
    this.dialog.open(UserDetailDialogComponent, {
      width: '600px',
      data: { userId: user.uid }
    });
  }

  viewUserPosts(user: UserProfile) {
    // TODO: Implement navigation to user posts
  }

  async toggleUserStatus(user: UserProfile) {
    if (user.uid === this.currentUserUid()) {
      this.snackBar.open('You cannot modify your own status.', 'Close', { duration: 3000 });
      return;
    }

    try {
      if (user.isActive) {
        await this.userService.deactivateUser(user.uid).toPromise();
      } else {
        await this.userService.activateUser(user.uid).toPromise();
      }
      this.loadUsers();
    } catch (error) {
      console.error('Status toggle failed:', error);
      this.snackBar.open('Failed to update status', 'Close', { duration: 3000 });
    }
  }

  inviteUser() {
    const dialogRef = this.dialog.open(InviteUserDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  resetUserPassword(user: UserProfile) {
    // TODO: Implement password reset logic
  }
}