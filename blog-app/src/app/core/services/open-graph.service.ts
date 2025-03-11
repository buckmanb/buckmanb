// src/app/core/services/opengraph.service.ts
import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { SocialShareData } from './social-share.service';

@Injectable({
  providedIn: 'root'
})
export class OpenGraphService {
  constructor(
    private meta: Meta,
    private title: Title,
    @Inject(DOCUMENT) private document: Document
  ) {}

  /**
   * Set OpenGraph meta tags for a blog post or any shareable content
   * @param shareData The social share data containing post information
   */
  setOpenGraphTags(shareData: SocialShareData): void {
    // Set basic meta tags
    this.title.setTitle(shareData.title);
    this.meta.updateTag({ name: 'description', content: shareData.description || '' });
    
    // Set basic OpenGraph tags
    this.meta.updateTag({ property: 'og:title', content: shareData.title });
    this.meta.updateTag({ property: 'og:description', content: shareData.description || '' });
    this.meta.updateTag({ property: 'og:url', content: shareData.url });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    
    // Set image if available
    if (shareData.image) {
      this.meta.updateTag({ property: 'og:image', content: shareData.image });
      this.meta.updateTag({ property: 'og:image:alt', content: shareData.title });
    }
    
    // Set Twitter Card tags for better Twitter sharing
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: shareData.title });
    this.meta.updateTag({ name: 'twitter:description', content: shareData.description || '' });
    
    if (shareData.image) {
      this.meta.updateTag({ name: 'twitter:image', content: shareData.image });
    }
    
    // Add article tags if available
    if (shareData.tags && shareData.tags.length > 0) {
      shareData.tags.forEach((tag, index) => {
        this.meta.updateTag({ property: `article:tag`, content: tag });
      });
    }
    
    // Add canonical URL
    this.updateCanonicalUrl(shareData.url);
  }
  
  /**
   * Clear all OpenGraph tags (useful when navigating away from a post)
   */
  clearOpenGraphTags(): void {
    // Remove OG tags
    this.meta.removeTag('property="og:title"');
    this.meta.removeTag('property="og:description"');
    this.meta.removeTag('property="og:url"');
    this.meta.removeTag('property="og:type"');
    this.meta.removeTag('property="og:image"');
    this.meta.removeTag('property="og:image:alt"');
    
    // Remove Twitter tags
    this.meta.removeTag('name="twitter:card"');
    this.meta.removeTag('name="twitter:title"');
    this.meta.removeTag('name="twitter:description"');
    this.meta.removeTag('name="twitter:image"');
    
    // Remove article tags
    this.meta.removeTag('property="article:tag"');
    
    // Remove canonical URL
    this.removeCanonicalUrl();
  }
  
  /**
   * Update the canonical URL link tag
   * @param url The canonical URL to set
   */
  private updateCanonicalUrl(url: string): void {
    // First, remove any existing canonical link
    this.removeCanonicalUrl();
    
    // Create a new canonical link element
    const link: HTMLLinkElement = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    
    // Add it to the document head
    this.document.head.appendChild(link);
  }
  
  /**
   * Remove the canonical URL link tag
   */
  private removeCanonicalUrl(): void {
    const canonicalLink = this.document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.remove();
    }
  }
}