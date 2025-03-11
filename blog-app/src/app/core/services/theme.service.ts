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
      this.document.body.classList.remove('light-theme', 'dark-theme');
      this.document.body.classList.add(this.currentTheme());
      localStorage.setItem(this.THEME_KEY, this.currentTheme());
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
    if (savedTheme) {
      return savedTheme;
    }

    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark-theme'
      : 'light-theme';
  }

  private watchSystemTheme() {
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        // Only update if user hasn't manually set a theme
        if (!localStorage.getItem(this.THEME_KEY)) {
          this.currentTheme.set(e.matches ? 'dark-theme' : 'light-theme');
        }
      });
  }
}