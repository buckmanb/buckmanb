import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SocialShareService, SocialShareData } from '../../core/services/social-share.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface ShareDialogData {
  shareData: SocialShareData;
}

@Component({
  selector: 'app-share-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Share This Post</h2>
    <div mat-dialog-content>
      <div class="share-preview">
        <div class="preview-header">Preview</div>
        <div class="preview-card">
          <!-- OpenGraph-style preview card -->
          <div *ngIf="shareData.image" class="preview-image">
            <img [src]="shareData.image" [alt]="shareData.title">
          </div>
          <div class="preview-content">
            <h3 class="preview-title">{{ shareData.title }}</h3>
            <p class="preview-description">{{ shareData.description }}</p>
            <div class="preview-meta">
              <span>{{ shareData.siteName || 'Blog App' }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="share-options">
        <button mat-raised-button color="primary" class="share-button facebook" (click)="shareToFacebook()">
          <mat-icon>facebook</mat-icon>
          Share on Facebook
        </button>
        
        <button mat-raised-button color="primary" class="share-button twitter" (click)="shareToTwitter()">
          <mat-icon>twitter</mat-icon>
          Share on Twitter
        </button>
        
        <button mat-raised-button color="primary" class="share-button linkedin" (click)="shareToLinkedIn()">
          <mat-icon>linkedin</mat-icon>
          Share on LinkedIn
        </button>
        
        <button mat-raised-button color="primary" class="share-button email" (click)="shareViaEmail()">
          <mat-icon>email</mat-icon>
          Share via Email
        </button>
        
        <button mat-raised-button class="share-button copy" (click)="copyLink()">
          <mat-icon>content_copy</mat-icon>
          Copy Link
        </button>
      </div>
      
      <div class="embed-code" *ngIf="embedHtml">
        <h3>Embed Code</h3>
        <div class="code-container">
          <pre>{{ embedHtml }}</pre>
        </div>
        <button mat-button color="primary" (click)="copyEmbedCode()">
          <mat-icon>content_copy</mat-icon> Copy Embed Code
        </button>
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </div>
  `,
  styles: [`
    .share-preview {
      margin-bottom: 20px;
    }
    
    .preview-header {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }
    
    .preview-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .preview-image img {
      width: 100%;
      max-height: 200px;
      object-fit: cover;
    }
    
    .preview-content {
      padding: 16px;
    }
    
    .preview-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 500;
    }
    
    .preview-description {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #666;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .preview-meta {
      font-size: 12px;
      color: #888;
    }
    
    .share-options {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .share-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .facebook {
      background-color: #1877f2;
      color: white;
    }
    
    .twitter {
      background-color: #1da1f2;
      color: white;
    }
    
    .linkedin {
      background-color: #0077b5;
      color: white;
    }
    
    .email {
      background-color: #ea4335;
      color: white;
    }
    
    .copy {
      background-color: #f5f5f5;
      color: #333;
    }
    
    .embed-code {
      margin-top: 20px;
    }
    
    .code-container {
      background-color: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      max-height: 100px;
      overflow-y: auto;
      margin-bottom: 12px;
    }
    
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      margin: 0;
      font-size: 12px;
    }
  `]
})
export class ShareDialogComponent {
  shareData: SocialShareData;
  embedHtml: string;
  
  constructor(
    private dialogRef: MatDialogRef<ShareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ShareDialogData,
    private shareService: SocialShareService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {
    this.shareData = data.shareData;
    
    // Create embeddable HTML snippet
    this.embedHtml = this.createEmbedCode();
  }
  
  shareToFacebook(): void {
    this.shareService.shareToFacebook(this.shareData);
  }
  
  shareToTwitter(): void {
    this.shareService.shareToTwitter(this.shareData);
  }
  
  shareToLinkedIn(): void {
    this.shareService.shareToLinkedIn(this.shareData);
  }
  
  shareViaEmail(): void {
    this.shareService.shareViaEmail(this.shareData);
  }
  
  async copyLink(): Promise<void> {
    try {
      const success = await this.shareService.copyLinkToClipboard(this.shareData);
      if (success) {
        this.snackBar.open('Link copied to clipboard', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Failed to copy link', 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error copying link:', error);
      this.snackBar.open('Failed to copy link', 'Close', { duration: 3000 });
    }
  }
  
  async copyEmbedCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.embedHtml);
      this.snackBar.open('Embed code copied to clipboard', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Failed to copy embed code:', error);
      this.snackBar.open('Failed to copy embed code', 'Close', { duration: 3000 });
    }
  }
  
  createEmbedCode(): string {
    return `<div style="border: 1px solid #ddd; border-radius: 8px; max-width: 500px; font-family: Arial, sans-serif;">
  ${this.shareData.image ? `<img src="${this.shareData.image}" alt="${this.shareData.title}" style="width: 100%; border-radius: 8px 8px 0 0; object-fit: cover; height: 250px;" />` : ''}
  <div style="padding: 16px;">
    <h2 style="margin-top: 0; color: #333;">${this.shareData.title}</h2>
    <p style="color: #666;">${this.shareData.description}</p>
    <a href="${this.shareData.url}" style="display: inline-block; padding: 8px 16px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-top: 12px;">Read More</a>
  </div>
</div>`;
  }
  
  close(): void {
    this.dialogRef.close();
  }
}