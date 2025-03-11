// src/app/features/admin/admin-users.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="container">
      <h1>User Management</h1>
      <p>This component will provide functionality to manage users.</p>
      <mat-card>
        <mat-card-content>
          <p>Coming soon: User management interface</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
  `]
})
export class AdminUsersComponent {}