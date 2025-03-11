import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { CloudinaryService, CloudinaryUploadResult } from '../../core/services/cloudinary.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatCardModule
  ],
  template: `
    <div class="image-upload-container" 
         [class.has-image]="imageUrl()"
         [class.dragging]="isDragging()">
      
      <!-- Upload area -->
      <div 
        class="upload-area"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave()"
        (drop)="onDrop($event)"
        *ngIf="!imageUrl()">
        
        <mat-icon class="upload-icon">cloud_upload</mat-icon>
        <p class="upload-text">Drag and drop an image here or</p>
        <button mat-raised-button color="primary" (click)="fileInput.click()">
          Choose File
        </button>
        <input 
          #fileInput
          type="file"
          accept="image/*"
          style="display: none;"
          (change)="onFileSelected($event)">
        <p class="file-limit">Maximum file size: 10MB</p>
      </div>

      <!-- Preview area -->
      <div class="preview-area" *ngIf="imageUrl()">
        <div class="image-container">
          <img [src]="imageUrl()" alt="Uploaded image">
          <button mat-mini-fab color="warn" class="remove-btn" (click)="removeImage()">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </div>

      <!-- Upload progress -->
      <mat-progress-bar 
        *ngIf="uploadProgress() > 0 && uploadProgress() < 100"
        mode="determinate" 
        [value]="uploadProgress()">
      </mat-progress-bar>

      <!-- Error message -->
      <div class="error-message" *ngIf="errorMessage()">
        {{ errorMessage() }}
      </div>
    </div>
  `,
  styles: [`
    .image-upload-container {
      border: 2px dashed var(--border-color);
      border-radius: 8px;
      padding: 1rem;
      transition: all 0.3s ease;
      background-color: var(--surface-color);
      min-height: 200px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .image-upload-container.has-image {
      border-style: solid;
    }

    .image-upload-container.dragging {
      border-color: var(--primary-color);
      background-color: rgba(var(--primary-color-rgb), 0.05);
    }

    .upload-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      width: 100%;
      padding: 2rem;
      box-sizing: border-box;
    }

    .upload-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: var(--primary-color);
    }

    .upload-text {
      font-size: 1rem;
      margin: 0;
      color: var(--text-secondary);
    }

    .file-limit {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 0.5rem;
    }

    .preview-area {
      width: 100%;
    }

    .image-container {
      position: relative;
      display: inline-block;
      max-width: 100%;
    }

    .image-container img {
      max-width: 100%;
      max-height: 300px;
      border-radius: 4px;
      display: block;
      margin: 0 auto;
    }

    .remove-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      transform: scale(0.8);
    }

    .error-message {
      color: var(--error-color);
      margin-top: 0.5rem;
      font-size: 0.9rem;
    }
  `]
})
export class ImageUploadComponent {
  private cloudinaryService = inject(CloudinaryService);

  @Input() maxFileSizeMB = 10;
  @Input() initialImageUrl = '';   
  @Output() imageUploaded = new EventEmitter<CloudinaryUploadResult>();
  @Output() imageRemoved = new EventEmitter<void>();

  imageUrl = signal<string>('');
  uploadProgress = signal<number>(0);
  isDragging = signal<boolean>(false);
  errorMessage = signal<string>('');
  imageData = signal<CloudinaryUploadResult | null>(null);

  ngOnInit() {
    // Initialize the image URL if provided
    if (this.initialImageUrl) {
      this.imageUrl.set(this.initialImageUrl);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave() {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File) {
    // Reset states
    this.errorMessage.set('');
    this.uploadProgress.set(0);
    
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
    
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => this.imageUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
    
    // Simulate progress (since HttpClient doesn't expose progress events easily)
    const progressInterval = setInterval(() => {
      if (this.uploadProgress() < 90) {
        this.uploadProgress.update(value => value + 10);
      }
    }, 200);
    
    // Upload to Cloudinary
    this.cloudinaryService.uploadImage(file).subscribe({
      next: (result) => {
        clearInterval(progressInterval);
        this.uploadProgress.set(100);
        this.imageUrl.set(result.secure_url);
        this.imageData.set(result);
        this.imageUploaded.emit(result);
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.uploadProgress.set(0);
        this.errorMessage.set('Upload failed: ' + (error.message || 'Unknown error'));
        console.error('Upload error:', error);
      }
    });
  }

  removeImage() {
    this.imageUrl.set('');
    this.uploadProgress.set(0);
    this.imageData.set(null);
    this.imageRemoved.emit();
  }
}