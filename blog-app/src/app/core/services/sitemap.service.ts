// src/app/core/services/sitemap.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BlogService } from './blog.service';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SitemapService {
  private blogService = inject(BlogService);
  private http = inject(HttpClient);
  
  private readonly baseUrl = environment.production 
    ? 'https://blog.beaubuckman.com' 
    : 'http://localhost:4200';
  
  /**
   * Generate the sitemap XML content
   */
  async generateSitemapXml(): Promise<string> {
    const urls = await this.collectSitemapUrls();
    return this.formatXmlSitemap(urls);
  }
  
  /**
   * Collect all URLs for the sitemap
   */
  private async collectSitemapUrls(): Promise<SitemapUrl[]> {
    const staticUrls = this.getStaticUrls();
    const dynamicUrls = await this.getDynamicUrls();
    
    return [...staticUrls, ...dynamicUrls];
  }
  
  /**
   * Get static URLs for the sitemap (pages that don't change frequently)
   */
  private getStaticUrls(): SitemapUrl[] {
    const today = new Date().toISOString().split('T')[0];
    
    return [
      {
        loc: `${this.baseUrl}/`,
        lastmod: today,
        changefreq: 'daily',
        priority: 1.0
      },
      {
        loc: `${this.baseUrl}/blog`,
        lastmod: today,
        changefreq: 'daily',
        priority: 0.9
      },
      {
        loc: `${this.baseUrl}/auth/login`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.5
      },
      {
        loc: `${this.baseUrl}/auth/signup`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.5
      },
      {
        loc: `${this.baseUrl}/legal/privacy-policy`,
        lastmod: today,
        changefreq: 'yearly',
        priority: 0.3
      },
      {
        loc: `${this.baseUrl}/sitemap`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.2
      }
    ];
  }
  
  /**
   * Get dynamic URLs for the sitemap (pages that are created from content)
   */
  private async getDynamicUrls(): Promise<SitemapUrl[]> {
    try {
      // Get blog posts
      const posts = await this.blogService.getPublishedPosts();
      
      return posts.map(post => {
        // Format the date if available, otherwise use today's date
        let lastmod: string;
        if (post.updatedAt) {
          const date = post.updatedAt.toDate ? post.updatedAt.toDate() : new Date(post.updatedAt);
          lastmod = date.toISOString().split('T')[0];
        } else if (post.publishedAt) {
          const date = post.publishedAt.toDate ? post.publishedAt.toDate() : new Date(post.publishedAt);
          lastmod = date.toISOString().split('T')[0];
        } else {
          lastmod = new Date().toISOString().split('T')[0];
        }
        
        return {
          loc: `${this.baseUrl}/blog/${post.id}`,
          lastmod,
          changefreq: 'weekly',
          priority: 0.8
        };
      });
    } catch (error) {
      console.error('Error getting dynamic URLs for sitemap:', error);
      return [];
    }
  }
  
  /**
   * Format the sitemap URLs into XML
   */
  private formatXmlSitemap(urls: SitemapUrl[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add each URL to the sitemap
    urls.forEach(url => {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(url.loc)}</loc>\n`;
      
      if (url.lastmod) {
        xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }
      
      if (url.changefreq) {
        xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      }
      
      if (url.priority !== undefined) {
        xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
      }
      
      xml += '  </url>\n';
    });
    
    xml += '</urlset>';
    return xml;
  }
  
  /**
   * Escape special characters for XML
   */
  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[&<>"']/g, match => {
      switch (match) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&apos;';
        default: return match;
      }
    });
  }
  
  /**
   * Submit sitemap to search engines
   */
  async submitSitemapToSearchEngines(): Promise<void> {
    if (!environment.production) {
      console.log('Skipping sitemap submission in development mode');
      return;
    }
    
    const sitemapUrl = `${this.baseUrl}/sitemap.xml`;
    
    try {
      // Submit to Google
      const googleUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      await firstValueFrom(this.http.get(googleUrl));
      console.log('Sitemap submitted to Google');
      
      // Submit to Bing
      const bingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      await firstValueFrom(this.http.get(bingUrl));
      console.log('Sitemap submitted to Bing');
    } catch (error) {
      console.error('Error submitting sitemap to search engines:', error);
    }
  }
}