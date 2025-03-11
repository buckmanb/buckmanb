import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SitemapService } from "../../core/services/sitemap.service";

@Component({
  selector: 'app-sitemap-xml',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="xml-container">
      <pre>{{ xmlContent }}</pre>
    </div>
  `,
  styles: [`
    .xml-container {
      display: none; /* Hide the XML from view, it's meant for robots */
    }
  `]
})
export class SitemapXmlComponent implements OnInit {
  private sitemapService = inject(SitemapService);
  
  xmlContent: string = '';
  
  ngOnInit() {
    this.generateSitemap();
  }
  
  async generateSitemap() {
    try {
      this.xmlContent = await this.sitemapService.generateSitemapXml();
      
      // Set the proper content type in the response header
      if (typeof document !== 'undefined') {
        // This is a workaround since we can't directly set headers in Angular
        // We create a meta tag that can be used by server-side rendering or middleware
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Type';
        meta.content = 'application/xml; charset=utf-8';
        document.head.appendChild(meta);
      }
    } catch (error) {
      console.error('Error generating sitemap XML:', error);
      this.xmlContent = '<!-- Error generating sitemap -->';
    }
  }
}