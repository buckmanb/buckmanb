// src/app/features/legal/privacy-policy.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule
  ],
  template: `
    <div class="container">
      <mat-card class="policy-card">
        <mat-card-header>
          <mat-card-title>
            <h1>Privacy Policy for Beau's Blog</h1>
          </mat-card-title>
          <mat-card-subtitle>
            <p><strong>Last Updated:</strong> March 10, 2025</p>
            <p><strong>Effective Date:</strong> March 10, 2025</p>
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <p>This privacy policy outlines how Beau's Blog ("we," "us," or "our") collects, uses, and protects personal information from users who:</p>
          <ul>
            <li>Create accounts via Google OAuth2</li>
            <li>Comment on blog posts</li>
            <li>Interact with our services at blog.beaubuckman.com</li>
          </ul>
          
          <h2>1. Information We Collect</h2>
          
          <h3>a. Google OAuth2 Account Creation</h3>
          <p>When you sign up using Google OAuth2, we collect:</p>
          <ul>
            <li>Email address</li>
            <li>Public profile information (e.g., name, profile picture)</li>
          </ul>
          
          <h3>b. User Comments</h3>
          <p>When you post comments, we collect:</p>
          <ul>
            <li>Name or username</li>
            <li>Email address (not displayed publicly)</li>
            <li>IP address (for spam detection)</li>
            <li>Content of comments</li>
          </ul>
          
          <h3>c. Automated Data</h3>
          <p>We use cookies and analytics tools (e.g., Google Analytics) to track:</p>
          <ul>
            <li>Device information (browser type, OS)</li>
            <li>Usage patterns (pages visited, time spent)</li>
          </ul>
          
          <mat-divider class="section-divider"></mat-divider>
          
          <h2>2. How We Use Your Information</h2>
          
          <table class="policy-table">
            <thead>
              <tr>
                <th>Purpose</th>
                <th>Legal Basis</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Authenticate accounts via Google OAuth2</td>
                <td>User consent</td>
              </tr>
              <tr>
                <td>Display user comments publicly</td>
                <td>Legitimate interest</td>
              </tr>
              <tr>
                <td>Improve site functionality</td>
                <td>Legitimate interest</td>
              </tr>
              <tr>
                <td>Comply with legal obligations</td>
                <td>Legal requirement</td>
              </tr>
            </tbody>
          </table>
          
          <mat-divider class="section-divider"></mat-divider>
          
          <h2>3. Third-Party Services</h2>
          
          <h3>Google OAuth2</h3>
          <ul>
            <li>Authentication is managed by Google LLC.</li>
            <li>Google's privacy practices are governed by their Privacy Policy.</li>
            <li>We do not store your Google password.</li>
          </ul>
          
          <h3>Comment Moderation</h3>
          <ul>
            <li>Comments and associated data are stored on our servers.</li>
            <li>IP addresses are used solely for spam prevention.</li>
          </ul>
          
          <mat-divider class="section-divider"></mat-divider>
          
          <h2>4. Data Retention</h2>
          <ul>
            <li><strong>Account data:</strong> Retained until you delete your account.</li>
            <li><strong>Comments:</strong> Retained indefinitely unless you request deletion.</li>
            <li><strong>IP addresses:</strong> Deleted after 30 days unless required for legal compliance.</li>
          </ul>
          
          <mat-divider class="section-divider"></mat-divider>
          
          <h2>5. Your Rights</h2>
          <p>Under GDPR, CCPA, and other laws, you may:</p>
          <ul>
            <li>Request access to or deletion of your data</li>
            <li>Opt out of data processing (excluding essential services)</li>
            <li>Withdraw consent for Google OAuth2 (via Google Account Settings)</li>
          </ul>
          
          <p>To exercise these rights, contact us at contact&#64;beaubuckman.com.</p>
          
          <mat-divider class="section-divider"></mat-divider>
          
          <h2>6. Updates to This Policy</h2>
          <p>We will notify users of material changes via email or a site banner. Minor updates will be reflected in the "Last Updated" date above.</p>
          
          <mat-divider class="section-divider"></mat-divider>
          
          <h2>Contact Information</h2>
          <p>Beau Buckman<br>
          contact&#64;beaubuckman.com</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 16px;
    }
    
    .policy-card {
      padding: 24px;
    }
    
    h1 {
      font-size: 2rem;
      margin-bottom: 16px;
    }
    
    h2 {
      font-size: 1.5rem;
      margin-top: 24px;
      margin-bottom: 16px;
      color: var(--primary-color);
    }
    
    h3 {
      font-size: 1.25rem;
      margin-top: 20px;
      margin-bottom: 12px;
    }
    
    ul {
      margin-bottom: 16px;
      padding-left: 24px;
    }
    
    p {
      margin-bottom: 16px;
      line-height: 1.6;
    }
    
    .section-divider {
      margin: 32px 0;
    }
    
    .policy-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    
    .policy-table th, .policy-table td {
      border: 1px solid var(--border-color);
      padding: 12px;
      text-align: left;
    }
    
    .policy-table th {
      background-color: var(--surface-color);
      font-weight: 500;
    }
  `]
})
export class PrivacyPolicyComponent { }