// src/app/features/sitemap/sitemap.routes.ts
import { Routes } from '@angular/router';
import { SitemapComponent } from './sitemap.component';
import { SitemapXmlComponent } from './sitemap-xml.component';

export const SITEMAP_ROUTES: Routes = [
  {
    path: '',
    component: SitemapComponent
  },
  {
    path: 'xml',
    component: SitemapXmlComponent
  }
];