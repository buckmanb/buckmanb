// src/app/features/admin/admin-posts.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { AdminStatCardComponent }  from './components/admin-stat-card.component';
import { AdminViewCountSyncComponent } from './components/admin-view-count-sync.component';

@Component({
  selector: 'app-admin-posts',
  standalone: true,
  imports: [CommonModule, MatCardModule, AdminViewCountSyncComponent, AdminStatCardComponent],
  template: `
    <div class="container">
      <h1>Admin Posts Management</h1>
      <app-admin-stat-card/>
      <app-admin-view-count-sync/>      
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
export class AdminPostsComponent {}