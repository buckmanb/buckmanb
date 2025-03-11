// src/app/shared/editor/editor-auto-save.ts
import { Injectable, OnDestroy } from '@angular/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Injectable()
export class EditorAutoSave implements OnDestroy {
  private content = new Subject<string>();
  private destroy$ = new Subject<void>();
  private localStorageKey = 'blog-post-editor-draft';
  
  constructor() {
    // Set up auto-save with debounce
    this.content.pipe(
      debounceTime(1000), // Save after 1 second of inactivity
      takeUntil(this.destroy$)
    ).subscribe(content => {
      localStorage.setItem(this.localStorageKey, content);
    });
  }
  
  updateContent(content: string): void {
    this.content.next(content);
  }
  
  getDraft(): string | null {
    return localStorage.getItem(this.localStorageKey);
  }
  
  clearDraft(): void {
    localStorage.removeItem(this.localStorageKey);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}