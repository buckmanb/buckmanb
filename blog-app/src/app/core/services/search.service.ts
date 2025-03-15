import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, orderBy, limit, getDocs } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { debounceTime, switchMap, map } from 'rxjs/operators';
import { BlogService } from './blog.service';

export interface SearchResult {
  id: string;
  title: string;
  type: 'post' | 'tag' | 'category' | 'author';
  subtitle?: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private firestore = inject(Firestore);
  private blogService = inject(BlogService);
  
  private searchTerms = new BehaviorSubject<string>('');
  searchResults$ = this.searchTerms.pipe(
    debounceTime(300),
    switchMap(term => this.search(term))
  );
  
  updateSearchTerm(term: string): void {
    this.searchTerms.next(term);
  }
  
  async search(term: string): Promise<SearchResult[]> {
    if (!term || term.length < 2) {
      return [];
    }
    
    try {
      // Search blog posts
      const postsRef = collection(this.firestore, 'posts');
      const q = query(
        postsRef,
        where('status', '==', 'published'),
        orderBy('title'),
        limit(5)
      );
      
      const snapshot = await getDocs(q);
      const results: SearchResult[] = [];
      
      snapshot.forEach(doc => {
        const post = doc.data();
        const title = post['title'] || '';
        
        // Only include if title matches search term
        if (title.toLowerCase().includes(term.toLowerCase())) {
          results.push({
            id: doc.id,
            title: title,
            type: 'post',
            subtitle: post['excerpt'] || '',
            imageUrl: post['imageUrl'] || ''
          });
        }
      });
      
      return results;
    } catch (error) {
      console.error('Error searching:', error);
      return [];
    }
  }
  
  getPopularSearchTerms(): string[] {
    // This could be dynamically loaded from analytics in a real app
    return [
      'Angular', 
      'Firebase', 
      'Authentication', 
      'Material Design',
      'State Management'
    ];
  }
}
