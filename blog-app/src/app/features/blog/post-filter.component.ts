// src/app/features/blog/post-filter.component.ts
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { BlogService } from '../../core/services/blog.service';

export interface PostFilterOptions {
  search?: string;
  tag?: string;
  sort?: 'latest' | 'oldest' | 'popular';
}

@Component({
  selector: 'app-post-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="filter-container">
      <!-- Search input -->
      <div class="search-box">
        <mat-form-field appearance="outline">
          <mat-label>Search posts</mat-label>
          <input matInput [formControl]="searchControl" placeholder="Search by title or content">
          <button 
            *ngIf="searchControl.value" 
            matSuffix 
            mat-icon-button 
            aria-label="Clear" 
            (click)="clearSearch()">
            <mat-icon>close</mat-icon>
          </button>
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>
      </div>
      
      <!-- Sorting options -->
      <div class="sort-box">
        <mat-form-field appearance="outline">
          <mat-label>Sort by</mat-label>
          <mat-select [formControl]="sortControl">
            <mat-option value="latest">Latest</mat-option>
            <mat-option value="oldest">Oldest</mat-option>
            <mat-option value="popular">Most Popular</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      
      <!-- Tag filter -->
      <div class="tag-filter" *ngIf="availableTags().length > 0">
        <div class="tag-label">Filter by tag:</div>
        
        <div class="tag-chips">
          <mat-chip-set>
            <mat-chip 
              (click)="selectTag('')"
              [selected]="selectedTag() === ''"
              color="primary">
              All
            </mat-chip>
            
            <mat-chip 
              *ngFor="let tag of availableTags()" 
              (click)="selectTag(tag)"
              [selected]="selectedTag() === tag">
              {{ tag }}
            </mat-chip>
          </mat-chip-set>
        </div>
      </div>
      
      <!-- Active filters display -->
      <div class="active-filters" *ngIf="hasActiveFilters()">
        <span class="filters-label">Active filters:</span>
        
        <div class="filter-chips">
          <mat-chip-set>
            <mat-chip *ngIf="searchControl.value" (removed)="clearSearch()">
              Search: {{ searchControl.value }}
              <button matChipRemove>
                <mat-icon>cancel</mat-icon>
              </button>
            </mat-chip>
            
            <mat-chip *ngIf="selectedTag()" (removed)="selectTag('')">
              Tag: {{ selectedTag() }}
              <button matChipRemove>
                <mat-icon>cancel</mat-icon>
              </button>
            </mat-chip>
            
            <mat-chip *ngIf="sortControl.value !== 'latest'" (removed)="resetSort()">
              Sort: {{ getSortDisplayName(sortControl.value) }}
              <button matChipRemove>
                <mat-icon>cancel</mat-icon>
              </button>
            </mat-chip>
          </mat-chip-set>
          
          <button mat-button color="warn" (click)="resetAllFilters()">
            Clear All
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-container {
      margin-bottom: 24px;
    }
    
    .search-box {
      width: 100%;
      max-width: 500px;
      margin-bottom: 16px;
    }
    
    .search-box mat-form-field {
      width: 100%;
    }
    
    .sort-box {
      width: 200px;
      margin-bottom: 16px;
    }
    
    .tag-filter {
      margin-bottom: 16px;
    }
    
    .tag-label {
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .tag-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .active-filters {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 16px;
      padding: 16px;
      background-color: var(--surface-color);
      border-radius: 8px;
    }
    
    .filters-label {
      font-weight: 500;
    }
    
    .filter-chips {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
  `]
})
export class PostFilterComponent {
  private fb = inject(FormBuilder);
  private blogService = inject(BlogService);
  
  @Input() initialFilters: PostFilterOptions = {};
  @Output() filtersChanged = new EventEmitter<PostFilterOptions>();
  
  searchControl = this.fb.control('');
  sortControl = this.fb.control('latest');
  
  selectedTag = signal<string>('');
  availableTags = signal<string[]>([]);
  
  ngOnInit() {
    // Apply initial filters if provided
    if (this.initialFilters) {
      if (this.initialFilters.search) {
        this.searchControl.setValue(this.initialFilters.search);
      }
      
      if (this.initialFilters.sort) {
        this.sortControl.setValue(this.initialFilters.sort);
      }
      
      if (this.initialFilters.tag) {
        this.selectedTag.set(this.initialFilters.tag);
      }
    }
    
    // Load available tags
    this.loadTags();
    
    // Watch for changes in filters
    this.searchControl.valueChanges.subscribe(() => {
      this.emitFilterChanges();
    });
    
    this.sortControl.valueChanges.subscribe(() => {
      this.emitFilterChanges();
    });
  }
  
  async loadTags() {
    try {
      // TODO: Implement loading tags from BlogService
      // const tags = await this.blogService.getAvailableTags();
      const tags = ['Angular', 'TypeScript', 'JavaScript', 'Firebase', 'Material Design'];
      this.availableTags.set(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  }
  
  selectTag(tag: string) {
    this.selectedTag.set(tag);
    this.emitFilterChanges();
  }
  
  clearSearch() {
    this.searchControl.setValue('');
  }
  
  resetSort() {
    this.sortControl.setValue('latest');
  }
  
  resetAllFilters() {
    this.clearSearch();
    this.resetSort();
    this.selectTag('');
  }
  
  hasActiveFilters(): boolean {
    return !!this.searchControl.value || 
           this.selectedTag() !== '' || 
           this.sortControl.value !== 'latest';
  }
  
  getSortDisplayName(sortValue: any): string {
    switch (sortValue) {
      case 'latest': return 'Latest';
      case 'oldest': return 'Oldest';
      case 'popular': return 'Most Popular';
      default: return 'Latest';
    }
  }
  
  private emitFilterChanges() {
    const filters: PostFilterOptions = {
      search: this.searchControl.value || undefined,
      tag: this.selectedTag() || undefined,
      sort: this.sortControl.value as 'latest' | 'oldest' | 'popular'
    };
    
    this.filtersChanged.emit(filters);
  }
}