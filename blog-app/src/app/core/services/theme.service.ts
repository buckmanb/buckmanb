// src/app/core/services/theme.service.ts
import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Theme = 'light-theme' | 'dark-theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private document = inject(DOCUMENT);
  private readonly THEME_KEY = 'preferred-theme';

  currentTheme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Set up theme change effect
    effect(() => {
      const theme = this.currentTheme();
      
      // Remove both themes first
      this.document.body.classList.remove('light-theme', 'dark-theme');
      
      // Add the current theme
      this.document.body.classList.add(theme);
      
      // Store in local storage
      localStorage.setItem(this.THEME_KEY, theme);
      
      // Update meta theme-color for mobile browsers
      this.updateMetaThemeColor(theme);
    });

    // Watch for system theme changes
    this.watchSystemTheme();
  }

  toggleTheme() {
    this.currentTheme.set(
      this.currentTheme() === 'light-theme' ? 'dark-theme' : 'light-theme'
    );
  }

  private getInitialTheme(): Theme {
    // Check local storage first
    const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
    if (savedTheme && (savedTheme === 'light-theme' || savedTheme === 'dark-theme')) {
      return savedTheme;
    }

    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark-theme'
      : 'light-theme';
  }

  private watchSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      // Only update if user hasn't manually set a theme
      if (!localStorage.getItem(this.THEME_KEY)) {
        this.currentTheme.set(e.matches ? 'dark-theme' : 'light-theme');
      }
    });
  }
  
  private updateMetaThemeColor(theme: Theme) {
    // Get or create meta theme-color tag
    let metaThemeColor = this.document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
      metaThemeColor = this.document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      this.document.head.appendChild(metaThemeColor);
    }
    
    // Set appropriate color based on theme
    metaThemeColor.setAttribute(
      'content', 
      theme === 'dark-theme' ? '#212121' : '#3f51b5'
    );
  }
  
  // Helper method to check if current theme is dark
  isDarkTheme(): boolean {
    return this.currentTheme() === 'dark-theme';
  }
}