import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SearchService, SearchResult } from '../../../core/services/search.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent implements OnInit {
  private searchService = inject(SearchService);
  private router = inject(Router);
  
  searchTerm: string = '';
  searchResults: SearchResult[] = [];
  isSearching: boolean = false;
  popularSearchTerms: string[] = [];
  
  ngOnInit() {
    this.popularSearchTerms = this.searchService.getPopularSearchTerms();
    
    this.searchService.searchResults$.subscribe(results => {
      this.searchResults = results;
      this.isSearching = false;
    });
  }
  
  onSearchChange(term: string) {
    if (term && term.length >= 2) {
      this.isSearching = true;
    }
    this.searchService.updateSearchTerm(term);
  }
  
  clearSearch() {
    this.searchTerm = '';
    this.searchResults = [];
  }
  
  onOptionSelected(event: any) {
    // If selecting a popular search term, search with it
    if (this.popularSearchTerms.includes(event.option.value)) {
      this.searchTerm = event.option.value;
      this.searchService.updateSearchTerm(this.searchTerm);
    }
  }
  
  getIconForType(type: string): string {
    switch (type) {
      case 'post': return 'article';
      case 'tag': return 'tag';
      case 'category': return 'category';
      case 'author': return 'person';
      default: return 'search';
    }
  }
  
  getRouterLink(result: SearchResult): string[] {
    switch (result.type) {
      case 'post': return ['/blog', result.id];
      case 'tag': return ['/blog/tag', result.id];
      case 'category': return ['/blog/category', result.id];
      case 'author': return ['/author', result.id];
      default: return ['/'];
    }
  }
}
