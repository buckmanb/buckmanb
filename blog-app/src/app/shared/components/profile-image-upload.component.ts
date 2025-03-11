// src/app/shared/components/profile-image-upload.component.ts
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CloudinaryService, CloudinaryUploadResult } from '../../core/services/cloudinary.service';

@Component({
  selector: 'app-profile-image-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="profile-upload-container">
      <div class="profile-image-wrapper" [class.has-image]="imageUrl()">
        <div class="profile-image" 
             [style.background-image]="imageUrl() ? 'url(' + imageUrl() + ')' : 'none'">
          <div class="placeholder" *ngIf="!imageUrl()">
            <mat-icon>person</mat-icon>
          </div>
        </div>
        
        <div class="upload-overlay" 
             [class.loading]="uploading()"
             (click)="!uploading() && fileInput.click()">
          <div class="overlay-content">
            <mat-spinner *ngIf="uploading()" [diameter]="30"></mat-spinner>
            <mat-icon *ngIf="!uploading()">photo_camera</mat-icon>
          </div>
        </div>
      </div>
      
      <div class="actions" *ngIf="imageUrl()">
        <button mat-icon-button color="warn" 
                matTooltip="Remove photo"
                (click)="removeImage()"
                [disabled]="uploading()">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
      
      <input 
        #fileInput
        type="file"
        accept="image/*"
        style="display: none;"
        (change)="onFileSelected($event)">
        
      <div class="error-message" *ngIf="errorMessage()">
        {{ errorMessage() }}
      </div>
    </div>
  `,
  styles: [`
    .profile-upload-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    
    .profile-image-wrapper {
      position: relative;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      overflow: hidden;
      cursor: pointer;
      box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
      background-color: var(--surface-color);
    }
    
    .profile-image {
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    
    .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background-color: var(--surface-color);
    }
    
    .placeholder mat-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      color: var(--border-color);
    }
    
    .upload-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .profile-image-wrapper:hover .upload-overlay {
      opacity: 1;
    }
    
    .upload-overlay.loading {
      opacity: 1;
    }
    
    .overlay-content {
      color: white;
    }
    
    .actions {
      margin-top: 0.5rem;
    }
    
    .error-message {
      color: var(--error-color);
      margin-top: 0.5rem;
      font-size: 0.8rem;
      text-align: center;
    }
  `]
})
export class ProfileImageUploadComponent {
  private cloudinaryService = inject(CloudinaryService);

  @Input() maxFileSizeMB = 5;
  @Input() currentImageUrl = '';
  @Output() imageUploaded = new EventEmitter<CloudinaryUploadResult>();
  @Output() imageRemoved = new EventEmitter<void>();

  imageUrl = signal<string>('');
  uploading = signal<boolean>(false);
  errorMessage = signal<string>('');

  ngOnInit() {
    if (this.currentImageUrl) {
      this.imageUrl.set(this.currentImageUrl);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File) {
    // Reset state
    this.errorMessage.set('');
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please select an image file');
      return;
    }
    
    // Validate file size
    if (file.size > this.maxFileSizeMB * 1024 * 1024) {
      this.errorMessage.set(`File size exceeds ${this.maxFileSizeMB}MB limit`);
      return;
    }
    
    // Begin upload
    this.uploading.set(true);
    
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => this.imageUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
    
    // Upload to Cloudinary
    this.cloudinaryService.uploadImage(file).subscribe({
      next: (result) => {
        this.uploading.set(false);
        this.imageUrl.set(result.secure_url);
        
        // Configure transformation for profile images (crop to center)
        const transformedUrl = this.cloudinaryService.getTransformedUrl(
          result.public_id, 
          { width: 400, height: 400, crop: 'fill', quality: 90 }
        );
        
        // Use the transformed URL for display
        this.imageUrl.set(transformedUrl);
        
        this.imageUploaded.emit(result);
      },
      error: (error) => {
        this.uploading.set(false);
        this.errorMessage.set('Upload failed: ' + (error.message || 'Unknown error'));
        console.error('Upload error:', error);
      }
    });
  }

  removeImage() {
    this.imageUrl.set('');
    this.imageRemoved.emit();
  }
}