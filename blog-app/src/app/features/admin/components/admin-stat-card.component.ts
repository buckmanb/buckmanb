// src/app/features/admin/components/admin-stat-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-stat-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <mat-card class="stat-card">
      <mat-card-content>
        <div class="stat-content">
          <div class="stat-value">{{ value | number }}</div>
          <div class="stat-label">{{ label }}</div>
          <div *ngIf="changePercent !== undefined" class="stat-change" 
               [class.positive]="changePercent > 0" 
               [class.negative]="changePercent < 0">
            <mat-icon>{{ changePercent > 0 ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
            {{ changePercent | number:'1.1-1' }}%
          </div>
        </div>
        <mat-icon class="stat-icon" [style.color]="iconColor">{{ icon }}</mat-icon>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .stat-card {
      height: 100%;
    }
    
    .stat-card .mat-card-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
    }
    
    .stat-content {
      display: flex;
      flex-direction: column;
    }
    
    .stat-value {
      font-size: 2.5rem;
      font-weight: 500;
      line-height: 1;
      margin-bottom: 8px;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    .stat-change {
      display: flex;
      align-items: center;
      font-size: 0.875rem;
      margin-top: 8px;
    }
    
    .stat-change mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 4px;
    }
    
    .positive {
      color: var(--success-color);
    }
    
    .negative {
      color: var(--error-color);
    }
    
    .stat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.7;
    }
  `]
})
export class AdminStatCardComponent {
  @Input() label: string = '';
  @Input() value: number = 0;
  @Input() icon: string = 'analytics';
  @Input() iconColor: string = 'var(--primary-color)';
  @Input() changePercent?: number; // Percentage change from previous period
}