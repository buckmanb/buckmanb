import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  template: `
    <button mat-icon-button
            (click)="themeService.toggleTheme()"
            [matTooltip]="themeService.currentTheme() === 'dark-theme' ? 'Switch to light theme' : 'Switch to dark theme'"
            aria-label="Toggle theme">
      <mat-icon>{{ themeService.currentTheme() === 'dark-theme' ? 'light_mode' : 'dark_mode' }}</mat-icon>
    </button>
  `,
  styles: [`
    button {
      transition: transform 0.3s ease;
    }
    
    button:hover {
      transform: rotate(30deg);
    }
  `]
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);
}