// src/app/shared/components/theme-toggle.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <button mat-icon-button
            [matTooltip]="themeService.currentTheme() === 'dark-theme' ? 'Switch to light mode' : 'Switch to dark mode'"
            (click)="themeService.toggleTheme()"
            class="theme-toggle">
      <mat-icon class="theme-icon">
        {{ themeService.currentTheme() === 'dark-theme' ? 'light_mode' : 'dark_mode' }}
      </mat-icon>
    </button>
  `,
  styles: [`
    .theme-toggle {
      transition: transform 0.3s ease;
      
      &:hover {
        transform: rotate(15deg);
      }
    }
    
    .theme-icon {
      transition: all 0.3s ease;
    }
  `]
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);
}