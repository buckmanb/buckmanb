// src/app/features/blog/blog-post-editor.component.ts
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { CloudinaryUploadResult } from '../../core/services/cloudinary.service';
import { ImageUploadComponent } from '../../shared/components/image-upload.component';
import { CodeHighlightDirective } from '../../shared/directives/code-highlight.directive';
import { BlogPost, BlogService } from '../../core/services/blog.service';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorToolbarComponent } from '../../shared/components/editor-toolbar.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EditorAutoSave } from '../../shared/editor/auto-save';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';

import jsonDoc from '../../shared/editor/doc';
import schema from '../../shared/editor/schema';
import nodeViews from '../../shared/editor/nodeviews';
import { CustomMenuComponent } from '../../shared/editor/custom-menu';

@Component({
  selector: 'app-blog-post-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatButtonToggleModule,
    MatDialogModule,
    NgxEditorModule,
    ImageUploadComponent,
    CodeHighlightDirective,
    EditorToolbarComponent,
    CustomMenuComponent
  ],
  providers: [EditorAutoSave],
  template: `
    <div class="editor-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ isEditMode ? 'Edit Post' : 'Create New Post' }}</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="postForm" class="post-form">
            <!-- Title field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" placeholder="Enter post title">
              <mat-error *ngIf="postForm.get('title')?.hasError('required')">
                Title is required
              </mat-error>
            </mat-form-field>
            
            <!-- Excerpt/summary field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Excerpt</mat-label>
              <textarea 
                matInput 
                formControlName="excerpt" 
                placeholder="Brief summary of your post (optional)"
                rows="2">
              </textarea>
              <mat-hint align="end">{{ postForm.get('excerpt')?.value?.length || 0 }}/200</mat-hint>
            </mat-form-field>
            
            <!-- Featured image -->
            <div class="image-section">
              <h3>Featured Image</h3>
              <app-image-upload 
                [initialImageUrl]="currentPost?.imageUrl || ''"
                (imageUploaded)="onImageUploaded($event)"
                (imageRemoved)="onImageRemoved()">
              </app-image-upload>
            </div>
            
            <!-- Content editor -->
            <div class="editor-section">
              <h3>Content</h3>
              
              <div class="editor-actions">
                <mat-button-toggle-group [value]="editorMode">
                  <mat-button-toggle value="edit" (click)="editorMode = 'edit'">Edit</mat-button-toggle>
                  <mat-button-toggle value="preview" (click)="editorMode = 'preview'">Preview</mat-button-toggle>
                </mat-button-toggle-group>
              </div>
              
              <!-- Editor / Preview container -->
              <div class="editor-preview-container">
                <!-- Editor view -->
                <div *ngIf="editorMode === 'edit'" class="editor-container">
                  <!-- Custom toolbar component -->
                  <app-editor-toolbar [editor]="editor"></app-editor-toolbar>
                  <ngx-editor-menu [editor]="editor" [toolbar]="toolbar" [customMenuRef]="customMenu"> </ngx-editor-menu>
                  <!-- NgxEditor with built-in toolbar -->
                  <ngx-editor
                    [editor]="editor"
                    formControlName="content"
                    [placeholder]="'Write your post content here...'">
                  </ngx-editor>
                </div>

                <!-- custom menu -->
                <ng-template #customMenu>
                  <app-custom-menu [editor]="editor"></app-custom-menu>
                </ng-template>
                
                <!-- Preview view -->
                <div *ngIf="editorMode === 'preview'" class="preview-container">
                  <div class="preview-content" [innerHTML]="sanitizedContent()"></div>
                </div>
              </div>
              
              <mat-error *ngIf="postForm.get('content')?.hasError('required') && postForm.get('content')?.touched">
                Content is required
              </mat-error>
            </div>
            
            <!-- Tags -->
            <div class="tags-section">
              <h3>Tags</h3>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Tags</mat-label>
                <mat-chip-grid #chipGrid aria-label="Tag selection">
                  <mat-chip-row 
                    *ngFor="let tag of tags" 
                    (removed)="removeTag(tag)"
                    [editable]="true"
                    (edited)="editTag(tag, $event)">
                    {{tag}}
                    <button matChipRemove>
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </mat-chip-row>
                </mat-chip-grid>
                <input 
                  placeholder="New tag..."
                  [matChipInputFor]="chipGrid"
                  [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                  [matChipInputAddOnBlur]="true"
                  (matChipInputTokenEnd)="addTag($event)">
                <mat-hint>Press Enter or comma to add a tag</mat-hint>
              </mat-form-field>
            </div>
            
            <!-- Featured checkbox -->
            <div class="featured-section">
              <mat-checkbox formControlName="featured">
                Feature this post on the homepage
              </mat-checkbox>
            </div>
            
            <!-- Action buttons -->
            <div class="action-buttons">
              <button 
                mat-button 
                type="button" 
                (click)="cancel()" 
                [disabled]="saving">
                Cancel
              </button>
              
              <button 
                mat-stroked-button 
                type="button" 
                (click)="saveDraft()" 
                [disabled]="saving || !postForm.valid">
                <mat-icon *ngIf="!saving">save</mat-icon>
                <mat-spinner *ngIf="saving && saveAsDraft" diameter="24"></mat-spinner>
                Save as Draft
              </button>
              
              <button 
                mat-raised-button 
                color="primary" 
                type="button" 
                (click)="publishPost()" 
                [disabled]="saving || !postForm.valid">
                <mat-icon *ngIf="!saving">publish</mat-icon>
                <mat-spinner *ngIf="saving && !saveAsDraft" diameter="24" color="accent"></mat-spinner>
                {{ isEditMode ? 'Update' : 'Publish' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .editor-container {
      max-width: 1000px;
      margin: 0 auto 32px;
      padding: 0 16px;
    }
    
    .post-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 16px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .editor-section {
      margin-bottom: 16px;
    }
    
    .image-section, .tags-section, .featured-section {
      margin-bottom: 16px;
    }
    
    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 16px;
    }
    
    h3 {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--text-primary);
    }
    
    .editor-preview-container {
      border: 1px solid var(--border-color);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .editor-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
    }
    
    .preview-container {
      min-height: 400px;
      padding: 16px;
      background-color: var(--surface-color);
    }
    
    .preview-content {
      font-family: 'Roboto', sans-serif;
      line-height: 1.6;
    }
    
    ::ng-deep .NgxEditor {
      min-height: 400px;
      border: none !important;
    }
    
    ::ng-deep .NgxEditor__Content {
      min-height: 350px;
      padding: 16px;
    }
    
    button mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class BlogPostEditorComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private blogService = inject(BlogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private autoSave = inject(EditorAutoSave);
  private sanitizer = inject(DomSanitizer);
  
  editor!: Editor;
  // Define toolbar options
  toolbar: Toolbar = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];
  
  postForm = this.fb.group({
    title: ['', Validators.required],
    excerpt: ['', Validators.maxLength(200)],
    content: ['', Validators.required],
    featured: [false]
  });
  
  tags: string[] = [];
  featuredImage?: CloudinaryUploadResult;
  
  saving = false;
  saveAsDraft = true;
  isEditMode = false;
  currentPost?: BlogPost;
  postId?: string;
  editorMode: 'edit' | 'preview' = 'edit';
  
  separatorKeysCodes: number[] = [ENTER, COMMA];

  form?: FormGroup;
  
  ngOnInit() {
    // editordoc = jsonDoc;

    this.form = new FormGroup({
      editorContent: new FormControl(jsonDoc),
    });

    // Initialize the editor
    this.editor = new Editor({
      schema,
      nodeViews,
      history: true,
      keyboardShortcuts: true
    });

    // Check for auto-saved draft if not in edit mode
    if (!this.isEditMode) {
      const savedDraft = this.autoSave.getDraft();
      if (savedDraft) {
        // Ask the user if they want to restore the draft
        const restore = confirm('Would you like to restore your unsaved draft?');
        if (restore) {
          this.postForm.patchValue({
            content: savedDraft
          });
        } else {
          this.autoSave.clearDraft();
        }
      }
    }

    // Subscribe to content changes for auto-save
    this.postForm.get('content')?.valueChanges.subscribe(content => {
      if (content && !this.isEditMode) {
        this.autoSave.updateContent(content);
      }
    });
    
    // Check if we're in edit mode by looking for an ID parameter
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.postId = id;
        this.loadExistingPost(id);
      }
    });
  }
  
  ngOnDestroy() {
    this.editor.destroy();
  }
  
  /**
   * Load existing post data when in edit mode
   */
  async loadExistingPost(postId: string) {
    try {
      const post = await this.blogService.getPostById(postId);
      
      if (post) {
        this.currentPost = post;
        
        // Populate the form with existing post data
        this.postForm.patchValue({
          title: post.title,
          excerpt: post.excerpt || '',
          content: post.content,
          featured: post.featured || false
        });
        
        this.tags = [...(post.tags || [])];
      } else {
        this.snackBar.open('Post not found', 'Close', { duration: 3000 });
        this.router.navigate(['/blog']);
      }
    } catch (error) {
      console.error('Error loading post:', error);
      this.snackBar.open('Error loading post', 'Close', { duration: 3000 });
    }
  }
  
  onImageUploaded(result: CloudinaryUploadResult) {
    this.featuredImage = result;
  }
  
  onImageRemoved() {
    this.featuredImage = undefined;
  }
  
  addTag(event: any) {
    const value = (event.value || '').trim();
    
    if (value) {
      // Check if tag already exists
      if (!this.tags.includes(value)) {
        this.tags.push(value);
      }
    }
    
    // Clear the input value
    if (event.input) {
      event.input.value = '';
    }
  }
  
  removeTag(tag: string) {
    const index = this.tags.indexOf(tag);
    
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }
  
  editTag(tag: string, event: any) {
    const newTag = event.value.trim();
    
    // Replace old tag with edited tag
    if (newTag && !this.tags.includes(newTag)) {
      const index = this.tags.indexOf(tag);
      if (index >= 0) {
        this.tags[index] = newTag;
      }
    }
  }
  
  saveDraft() {
    this.saveAsDraft = true;
    this.savePost('draft');
  }
  
  publishPost() {
    this.saveAsDraft = false;
    this.savePost('published');
  }
  
  async savePost(status: 'draft' | 'published') {
    if (this.postForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      // Mark all fields as touched to show validation errors
      this.postForm.markAllAsTouched();
      return;
    }
    
    this.saving = true;
    
    const formData = this.postForm.getRawValue();
    
    const post: Partial<BlogPost> = {
      title: formData.title!,
      content: formData.content!,
      excerpt: formData.excerpt || undefined,
      featured: formData.featured || false,
      tags: this.tags,
      status: status,
      imageUrl: this.featuredImage?.secure_url || this.currentPost?.imageUrl,
    };
    
    // Add image data if available
    if (this.featuredImage) {
      post.image = {
        publicId: this.featuredImage.public_id,
        url: this.featuredImage.secure_url,
        width: this.featuredImage.width,
        height: this.featuredImage.height
      };
    }
    
    try {
      if (this.isEditMode && this.postId) {
        // Update existing post
        await this.blogService.updatePost(this.postId, post);
        this.snackBar.open('Post updated successfully', 'Close', { duration: 3000 });
        
        // Navigate to the post detail page
        this.router.navigate(['/blog', this.postId]);
      } else {
        // Create new post
        const newPostId = await this.blogService.createPost(post);
        
        // Clear auto-saved draft after successful save
        this.autoSave.clearDraft();
        
        if (status === 'published') {
          this.snackBar.open('Post published successfully', 'Close', { duration: 3000 });
          // Navigate to the new post
          this.router.navigate(['/blog', newPostId]);
        } else {
          this.snackBar.open('Draft saved successfully', 'Close', { duration: 3000 });
          // Navigate to user's posts list
          this.router.navigate(['/user/posts']);
        }
      }
    } catch (error) {
      console.error('Error saving post:', error);
      this.snackBar.open('Error saving post', 'Close', { duration: 3000 });
    } finally {
      this.saving = false;
    }
  }
  
  cancel() {
    if (this.isEditMode && this.postId) {
      // Navigate back to post detail page
      this.router.navigate(['/blog', this.postId]);
    } else {
      // Navigate back to posts list
      this.router.navigate(['/blog']);
    }
  }
  
  sanitizedContent(): SafeHtml {
    const content = this.postForm.get('content')?.value || '';
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}