// src/app/core/services/cloudinary.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  resource_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private http = inject(HttpClient);
  
  // Replace these with your actual Cloudinary credentials
  private cloudName = 'beau-media'; // Your Cloudinary cloud name
  private uploadPreset = 'blog-uploads'; // Your unsigned upload preset name
  
  // Cloudinary upload URL
  private uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

  // Upload an image to Cloudinary with improved error handling
  uploadImage(file: File): Observable<CloudinaryUploadResult> {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    
    // Optional: add timestamp and other parameters if needed
    formData.append('timestamp', Date.now().toString());
    
    // Log the upload attempt
    console.log(`Attempting to upload to Cloudinary: ${this.uploadUrl}`);
    console.log(`Using upload preset: ${this.uploadPreset}`);
    
    // Send the request
    return this.http.post<CloudinaryUploadResult>(this.uploadUrl, formData)
      .pipe(
        map(response => {
          console.log('Cloudinary upload successful:', response);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  // Generate an image URL with transformations
  getTransformedUrl(publicId: string, options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: number;
  } = {}): string {
    // Build the transformation string
    let transformations = '';
    
    if (options.width || options.height) {
      transformations += options.width ? `w_${options.width},` : '';
      transformations += options.height ? `h_${options.height},` : '';
      transformations += options.crop ? `c_${options.crop},` : 'c_limit,';
    }
    
    transformations += options.quality ? `q_${options.quality},` : 'q_auto,';
    transformations += 'f_auto/'; // Automatic format selection
    
    // Remove trailing comma if present
    if (transformations.endsWith(',/')) {
      transformations = transformations.replace(',/', '/');
    }
    
    // Construct the full URL
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformations}${publicId}`;
  }
  
  // Error handler for HTTP requests
  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
      console.error('Client-side error:', error.error.message);
    } else {
      // Server-side error
      console.error(`Backend returned code ${error.status}, body:`, error.error);
      
      // Try to extract more meaningful error from Cloudinary response
      if (error.error?.error?.message) {
        errorMessage = `Cloudinary error: ${error.error.error.message}`;
      } else if (error.status === 400) {
        errorMessage = 'Bad request: Check your Cloudinary configuration (cloud name and upload preset)';
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized: Authentication failed';
      } else if (error.status === 403) {
        errorMessage = 'Forbidden: You do not have permission to upload';
      } else if (error.status === 404) {
        errorMessage = 'Not found: The specified cloud name or preset does not exist';
      } else {
        errorMessage = `Server error: ${error.status} ${error.statusText}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}