// src/app/features/blog/post-detail.component.ts
import { Component, inject, signal, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { BlogService, BlogPost } from '../../core/services/blog.service';
import { AuthService } from '../../core/auth/auth.service';
import { SocialShareService } from '../../core/services/social-share.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CodeHighlightDirective } from '../../shared/directives/code-highlight.directive';
import { CommentListComponent } from './comments/comment-list.component';
import { ShareDialogComponent } from './share-dialog.component';
import { SocialShareData } from '../../core/services/social-share.service';
import { OpenGraphService } from '../../core/services/open-graph.service';

// Interface for parsed content blocks
interface ContentBlock {
  type: 'text' | 'code';
  content: string;
  language?: string;
  html?: SafeHtml;
}

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    CodeHighlightDirective,
    CommentListComponent,
    ShareDialogComponent,
  ],
  encapsulation: ViewEncapsulation.None, // Required for styling highlighted code
  template: `
    <div class="container">
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (!post()) {
        <div class="not-found">
          <h2>Post not found</h2>
          <p>The post you are looking for does not exist or has been removed.</p>
          <a mat-button routerLink="/blog" color="primary">Back to Posts</a>
        </div>
      } @else {
        <div class="post-header">
          <h1 class="post-title">{{ post()?.title }}</h1>
          
          <div class="post-meta">
            <div class="author-info">
              @if (post()?.authorPhotoURL) {
                <img [src]="post()?.authorPhotoURL" alt="Author" class="author-image">
              } @else {
                <mat-icon class="author-icon">account_circle</mat-icon>
              }
              <span>{{ post()?.authorName }}</span>
            </div>
            
            <div class="post-date">
              <mat-icon>calendar_today</mat-icon>
              <span>{{ formatDate(post()?.publishedAt) }}</span>
            </div>
          </div>
          
          @if (post()?.tags?.length) {
            <div class="post-tags">
              @for (tag of post()?.tags; track tag) {
                <mat-chip [routerLink]="['/blog']" [queryParams]="{tag: tag}">{{ tag }}</mat-chip>
              }
            </div>
          }
          
          <!-- Edit button for author -->
          @if (isAuthor()) {
            <div class="edit-actions">
              <a mat-button color="primary" [routerLink]="['/blog', post()?.id, 'edit']">
                <mat-icon>edit</mat-icon> Edit Post
              </a>
            </div>
          }
        </div>
        
        @if (post()?.imageUrl) {
          <div class="post-image-container">
            <img [src]="post()?.imageUrl" alt="{{ post()?.title }}" class="post-image">
          </div>
        }
        
        <mat-card class="post-content-card">
          <mat-card-content>
            <!-- Rendered content with syntax highlighting -->
            <div class="post-content">
              @for (block of contentBlocks(); track $index) {
                @if (block.type === 'code') {
                  <pre [appCodeHighlight]="block.language || 'plaintext'" [code]="block.content"></pre>
                } @else {
                  <div [innerHTML]="block.html"></div>
                }
              }
            </div>
          </mat-card-content>
          
          <mat-divider class="content-divider"></mat-divider>
          
          <mat-card-actions>
            <button mat-button (click)="likePost()" [disabled]="liking()" color="primary">
              <mat-icon>{{ liked() ? 'favorite' : 'favorite_border' }}</mat-icon>
              Like ({{ post()?.likes || 0 }})
            </button>
            
            <button mat-button (click)="sharePost()" [disabled]="sharing()">
              <mat-icon>share</mat-icon>
              Share
            </button>
          </mat-card-actions>
        </mat-card>
        
        <!-- Related posts section -->
        @if (relatedPosts().length > 0) {
          <div class="related-posts-section">
            <h2>Related Posts</h2>
            <div class="related-posts-grid">
              @for (relatedPost of relatedPosts(); track relatedPost.id) {
                <mat-card class="related-post-card" [routerLink]="['/blog', relatedPost.id]">
                  @if (relatedPost.imageUrl) {
                    <img [src]="relatedPost.imageUrl" alt="{{ relatedPost.title }}" class="related-post-image">
                  }
                  <mat-card-content>
                    <h3>{{ relatedPost.title }}</h3>
                    <p>{{ generateExcerpt(relatedPost) }}</p>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </div>
        }
        
        <!-- Comments section -->
        <div class="comments-section">
          <app-comment-list [postId]="post()?.id || ''"></app-comment-list>
        </div>
      }
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 16px;
    }
    
    .loading-container, .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      gap: 16px;
      text-align: center;
    }
    
    .post-header {
      margin-bottom: 24px;
    }
    
    .post-title {
      font-size: 2.5rem;
      margin-bottom: 16px;
      line-height: 1.2;
    }
    
    .post-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 16px;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    
    .author-info, .post-date {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .author-image {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }
    
    .author-icon {
      font-size: 32px;
      height: 32px;
      width: 32px;
    }
    
    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }

    .post-tags mat-chip {
      cursor: pointer;
    }
    
    .edit-actions {
      margin-top: 16px;
    }
    
    .post-image-container {
      margin-bottom: 24px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: var(--elevation-2);
    }
    
    .post-image {
      width: 100%;
      max-height: 400px;
      object-fit: cover;
    }
    
    .post-content-card {
      margin-bottom: 32px;
    }
    
    .post-content {
      font-size: 1.1rem;
      line-height: 1.7;
    }
    
    .content-divider {
      margin: 24px 0;
    }
    
    /* Code block styling */
    .post-content pre {
      background-color: var(--surface-color);
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 1.5rem 0;
      position: relative;
    }
    
    .post-content pre::before {
      content: attr(data-language);
      position: absolute;
      top: 0;
      right: 0;
      color: var(--text-secondary);
      font-size: 0.8rem;
      padding: 0.2rem 0.5rem;
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 0 4px 0 4px;
      text-transform: uppercase;
    }
    
    /* Style for code highlighting classes */
    .token.comment,
    .token.prolog,
    .token.doctype,
    .token.cdata {
      color: slategray;
    }
    
    .token.punctuation {
      color: #999;
    }
    
    .token.namespace {
      opacity: .7;
    }
    
    .token.property,
    .token.tag,
    .token.boolean,
    .token.number,
    .token.constant,
    .token.symbol,
    .token.deleted {
      color: #905;
    }
    
    .token.selector,
    .token.attr-name,
    .token.string,
    .token.char,
    .token.builtin,
    .token.inserted {
      color: #690;
    }
    
    .token.operator,
    .token.entity,
    .token.url,
    .language-css .token.string,
    .style .token.string {
      color: #9a6e3a;
    }
    
    .token.atrule,
    .token.attr-value,
    .token.keyword {
      color: #07a;
    }
    
    .token.function,
    .token.class-name {
      color: #DD4A68;
    }
    
    .token.regex,
    .token.important,
    .token.variable {
      color: #e90;
    }
    
    .token.important,
    .token.bold {
      font-weight: bold;
    }
    
    .token.italic {
      font-style: italic;
    }
    
    .token.entity {
      cursor: help;
    }
    
    /* Related posts section */
    .related-posts-section {
      margin-bottom: 32px;
    }
    
    .related-posts-section h2 {
      font-size: 1.5rem;
      margin-bottom: 16px;
    }
    
    .related-posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
    }
    
    .related-post-card {
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .related-post-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--elevation-3);
    }
    
    .related-post-image {
      width: 100%;
      height: 140px;
      object-fit: cover;
    }
    
    .related-post-card h3 {
      font-size: 1.1rem;
      margin: 8px 0;
    }
    
    .related-post-card p {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    /* Comments section */
    .comments-section {
      margin-top: 32px;
      margin-bottom: 64px;
    }
    
    /* Make sure images in the content are responsive */
    .post-content img {
      max-width: 100%;
      height: auto;
    }
    
    /* Style links in the content */
    .post-content a {
      color: var(--primary-color);
      text-decoration: none;
    }
    
    .post-content a:hover {
      text-decoration: underline;
    }
  `]
})
export class PostDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private blogService = inject(BlogService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private shareService = inject(SocialShareService);

  // Add OpenGraphService to the injected services
  private openGraphService = inject(OpenGraphService);
  
  loading = signal<boolean>(true);
  post = signal<BlogPost | null>(null);
  contentBlocks = signal<ContentBlock[]>([]);
  relatedPosts = signal<BlogPost[]>([]);
  liked = signal<boolean>(false);
  liking = signal<boolean>(false);
  sharing = signal<boolean>(false);
  
  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const postId = params.get('id');
      if (postId) {
        this.loadPost(postId);
      }
    });
  }

  ngOnDestroy() {
    // Clear OpenGraph tags when navigating away from the post
    this.openGraphService.clearOpenGraphTags();
    
    // Other cleanup from your existing ngOnDestroy
    // this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  async loadPost(postId: string) {
    this.loading.set(true);
    
    try {
      const post = await this.blogService.getPostById(postId);
      
      if (post) {
        this.post.set(post);
        
        // Add OpenGraph tags when post is loaded
        this.setOpenGraphTags(post);

        setTimeout(() => {
          this.setOpenGraphTags(post);
        }, 1000);
        

        // Parse content to identify and separate code blocks
        this.parseContent(post.content);
        
        // Load related posts based on tags
        if (post.tags && post.tags.length > 0) {
          const related = await this.blogService.getRelatedPosts(postId, post.tags, 3);
          this.relatedPosts.set(related);
        }
      }
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      this.loading.set(false);
    }
  }

    /**
   * Set OpenGraph tags for the current post
   */
    private setOpenGraphTags(post: BlogPost): void {
      if (!post) return;
      
      // Create share data using the SocialShareService
      const shareData = this.shareService.getShareDataFromPost(post);
      
      console.log(shareData);

      // Set OpenGraph tags
      this.openGraphService.setOpenGraphTags(shareData);
    }
  
  /**
   * Parse post content to separate text and code blocks
   */
  parseContent(content: string) {
    const blocks: ContentBlock[] = [];
    
    // Regular expression to find code blocks
    const codeBlockRegex = /<pre data-language="(\w+)"><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;
    
    let lastIndex = 0;
    let match;
    
    // Find all code blocks and extract them
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textContent = content.substring(lastIndex, match.index);
        blocks.push({
          type: 'text',
          content: textContent,
          html: this.sanitizer.bypassSecurityTrustHtml(textContent)
        });
      }
      
      // Get the language from the match
      const language = match[1] || match[2] || 'plaintext';
      
      // Add code block
      blocks.push({
        type: 'code',
        content: this.unescapeHtml(match[3]),
        language: language
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      const textContent = content.substring(lastIndex);
      blocks.push({
        type: 'text',
        content: textContent,
        html: this.sanitizer.bypassSecurityTrustHtml(textContent)
      });
    }
    
    this.contentBlocks.set(blocks);
  }
  
  /**
   * Unescape HTML entities in code blocks
   */
  unescapeHtml(html: string): string {
    return html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");
  }
  
  isAuthor(): boolean {
    const currentUser = this.authService.currentUser();
    return !!currentUser && currentUser.uid === this.post()?.authorId;
  }
  
  formatDate(timestamp: any): string {
    if (!timestamp) {
      return '';
    }
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric', 
      year: 'numeric'
    });
  }
  
  generateExcerpt(post: BlogPost): string {
    if (post.excerpt) {
      return post.excerpt;
    }
    
    // Strip HTML tags and get first 150 characters
    const plainText = post.content.replace(/<[^>]*>/g, '');
    return plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
  }
  
  async likePost() {
    const currentPost = this.post();
    if (!currentPost || !currentPost.id) return;
    
    this.liking.set(true);
    
    try {
      await this.blogService.likePost(currentPost.id);
      
      // Update local state
      this.liked.update(value => !value);
      const newLikes = (currentPost.likes || 0) + (this.liked() ? 1 : -1);
      
      this.post.set({
        ...currentPost,
        likes: newLikes
      });
    } catch (error) {
      console.error('Error liking post:', error);
      this.snackBar.open('Failed to like post', 'Close', { duration: 3000 });
    } finally {
      this.liking.set(false);
    }
  }
  
  sharePost() {
    const currentPost = this.post();
    if (!currentPost) return;
    
    this.sharing.set(true);
    
    try {
      // Create share data
      const shareData = this.shareService.getShareDataFromPost(currentPost);
      
      // Use the Web Share API if available
      if (!navigator.share) {
        navigator.share({
          title: shareData.title,
          text: shareData.description,
          url: shareData.url
        }).catch(error => {
          console.error('Error sharing:', error);
          // Fallback to our custom dialog if Web Share API fails
          this.openShareDialog(shareData);
        });
      } else {
        // Use our custom share dialog
        this.openShareDialog(shareData);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      this.snackBar.open('Error sharing post', 'Close', { duration: 3000 });
    } finally {
      this.sharing.set(false);
    }
  }
  
  /**
   * Open the custom share dialog
   */
  private openShareDialog(shareData: SocialShareData): void {
    this.dialog.open(ShareDialogComponent, {
      width: '500px',
      data: { shareData }
    });
  }
}