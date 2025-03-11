// src/app/shared/components/editor-image-dialog.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { ImageUploadComponent } from './image-upload.component';
import { CloudinaryUploadResult, CloudinaryService } from '../../core/services/cloudinary.service';

export interface EditorImageResult {
  src: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
}

@Component({
  selector: 'app-editor-image-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    ImageUploadComponent
  ],
  template: `
    <h2 mat-dialog-title>Insert Image</h2>
    <mat-dialog-content>
      <mat-tab-group>
        <mat-tab label="Upload">
          <div class="tab-content">
            <app-image-upload
              (imageUploaded)="onImageUploaded($event)"
              (imageRemoved)="onImageRemoved()">
            </app-image-upload>
            
            <form [formGroup]="uploadForm" *ngIf="uploadedImage">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Alt Text</mat-label>
                <input matInput formControlName="alt" placeholder="Describe the image">
                <mat-hint>Helps with accessibility and SEO</mat-hint>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Title</mat-label>
                <input matInput formControlName="title" placeholder="Optional title">
              </mat-form-field>
            </form>
          </div>
        </mat-tab>
        
        <mat-tab label="URL">
          <div class="tab-content">
            <form [formGroup]="urlForm">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Image URL</mat-label>
                <input matInput formControlName="src" placeholder="https://example.com/image.jpg">
                <mat-error *ngIf="urlForm.get('src')?.hasError('required')">
                  URL is required
                </mat-error>
                <mat-error *ngIf="urlForm.get('src')?.hasError('pattern')">
                  Please enter a valid URL
                </mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Alt Text</mat-label>
                <input matInput formControlName="alt" placeholder="Describe the image">
                <mat-hint>Helps with accessibility and SEO</mat-hint>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Title</mat-label>
                <input matInput formControlName="title" placeholder="Optional title">
              </mat-form-field>
            </form>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button 
        mat-raised-button 
        color="primary" 
        [disabled]="!canInsert()"
        (click)="insertImage()">
        Insert
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .tab-content {
      padding: 16px 0;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    mat-dialog-content {
      min-width: 500px;
      max-width: 100%;
      max-height: 80vh;
    }
    
    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: unset;
      }
    }
  `]
})
export class EditorImageDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EditorImageDialogComponent>);
  
  uploadedImage?: CloudinaryUploadResult;
  
  uploadForm = this.fb.group({
    alt: [''],
    title: ['']
  });
  
  urlForm = this.fb.group({
    src: ['', [Validators.required, Validators.pattern(/^(https?:\/\/.*)\.(jpg|jpeg|png|gif|webp)$/i)]],
    alt: [''],
    title: ['']
  });
  
  onImageUploaded(result: CloudinaryUploadResult) {
    this.uploadedImage = result;
  }
  
  onImageRemoved() {
    this.uploadedImage = undefined;
  }
  
  canInsert(): boolean {
    return (
      (!!this.uploadedImage) || 
      (this.urlForm.valid && !!this.urlForm.get('src')?.value)
    );
  }
  
  insertImage() {
    let result: EditorImageResult;
    
    if (this.uploadedImage) {
      // Use uploaded image
      result = {
        src: this.uploadedImage.secure_url,
        alt: this.uploadForm.get('alt')?.value || '',
        title: this.uploadForm.get('title')?.value || '',
        width: this.uploadedImage.width,
        height: this.uploadedImage.height
      };
    } else {
      // Use URL
      result = {
        src: this.urlForm.get('src')?.value || '',
        alt: this.urlForm.get('alt')?.value || '',
        title: this.urlForm.get('title')?.value || ''
      };
    }
    
    this.dialogRef.close(result);
  }
}