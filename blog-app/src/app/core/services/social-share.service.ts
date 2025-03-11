// src/app/core/services/social-share.service.ts
import { Injectable } from '@angular/core';
import { BlogPost } from '../../core/services/blog.service';

export interface SocialShareData {
  url: string;
  title: string;
  description?: string;
  image?: string;
  tags?: string[];
  authorName?: string;
  publishedDate?: Date;
  siteName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocialShareService {
  private readonly appTitle = 'Beau\'s Blog';
  private readonly appBaseUrl = window.location.origin;

  /**
   * Generate sharing data from a blog post
   */
  getShareDataFromPost(post: BlogPost): SocialShareData {
    // Create post URL
    const postUrl = `${this.appBaseUrl}/#/blog/${post.id}`;
    
    // Create description from excerpt or content
    const description = post.excerpt || this.createExcerptFromContent(post.content);
    
    // Get image URL - ensure it's an absolute URL
    const imageUrl = post.imageUrl ? this.ensureAbsoluteUrl(post.imageUrl) : undefined;
    
    // Create published date
    const publishedDate = post.publishedAt?.toDate ? post.publishedAt.toDate() : new Date(post.publishedAt);
    
    return {
      url: postUrl,
      title: post.title,
      description,
      image: imageUrl,
      tags: post.tags,
      authorName: post.authorName,
      publishedDate,
      siteName: this.appTitle
    };
  }
  
  /**
   * Make sure a URL is absolute (needed for OpenGraph tags)
   */
  private ensureAbsoluteUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    if (url.startsWith('/')) {
      return `${this.appBaseUrl}${url}`;
    }
    
    return `${this.appBaseUrl}/${url}`;
  }
  
  /**
   * Share to Facebook
   */
  shareToFacebook(data: SocialShareData): void {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`;
    this.openShareWindow(url, 'facebook-share');
  }
  
  /**
   * Share to Twitter
   */
  shareToTwitter(data: SocialShareData): void {
    const text = `${data.title}`;
    const hashtags = data.tags?.join(',') || '';
    
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(text)}&hashtags=${encodeURIComponent(hashtags)}`;
    this.openShareWindow(url, 'twitter-share');
  }
  
  /**
   * Share to LinkedIn
   */
  shareToLinkedIn(data: SocialShareData): void {
    const url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(data.url)}&title=${encodeURIComponent(data.title)}&summary=${encodeURIComponent(data.description || '')}`;
    this.openShareWindow(url, 'linkedin-share');
  }
  
  /**
   * Share via Email
   */
  shareViaEmail(data: SocialShareData): void {
    const subject = encodeURIComponent(`${data.title} | ${this.appTitle}`);
    const body = encodeURIComponent(`I thought you might be interested in this:\n\n${data.title}\n${data.description}\n\nRead more: ${data.url}`);
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }
  
  /**
   * Create a shareable preview card that can be used on social media
   */
  createShareablePreviewCard(post: BlogPost): string {
    // Create an HTML blob for social media sites
    const html = `
      <div style="border: 1px solid #ddd; border-radius: 8px; max-width: 500px; font-family: Arial, sans-serif;">
        ${post.imageUrl ? `<img src="${post.imageUrl}" alt="${post.title}" style="width: 100%; border-radius: 8px 8px 0 0; object-fit: cover; height: 250px;" />` : ''}
        <div style="padding: 16px;">
          <h2 style="margin-top: 0; color: #333;">${post.title}</h2>
          <p style="color: #666;">${post.excerpt || this.createExcerptFromContent(post.content)}</p>
          <div style="display: flex; align-items: center; margin-top: 16px;">
            ${post.authorPhotoURL ? `<img src="${post.authorPhotoURL}" alt="${post.authorName}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 8px;" />` : ''}
            <div>
              <div style="font-weight: bold;">${post.authorName}</div>
              <div style="font-size: 0.8rem; color: #888;">${this.formatDate(post.publishedAt)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    return html;
  }
  
  /**
   * Copy link to clipboard
   */
  async copyLinkToClipboard(data: SocialShareData): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(data.url);
      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
      return false;
    }
  }
  
  /**
   * Helper to open share windows
   */
  private openShareWindow(url: string, name: string): void {
    window.open(
      url,
      name,
      'width=600,height=400,location=0,menubar=0,toolbar=0,status=0,scrollbars=1,resizable=1'
    );
  }
  
  /**
   * Helper to create excerpt from content
   */
  private createExcerptFromContent(content: string, maxLength: number = 150): string {
    // Strip HTML tags
    const plainText = content.replace(/<[^>]*>/g, '');
    // Truncate if necessary
    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  }
  
  /**
   * Helper to format date
   */
  private formatDate(timestamp: any): string {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric', 
      year: 'numeric'
    });
  }
}