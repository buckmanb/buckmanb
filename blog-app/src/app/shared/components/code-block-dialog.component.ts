// src/app/shared/components/code-block-dialog.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export interface CodeBlockResult {
  code: string;
  language: string;
}

@Component({
  selector: 'app-code-block-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>Insert Code Block</h2>
    <mat-dialog-content>
      <form [formGroup]="codeForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Language</mat-label>
          <mat-select formControlName="language">
            <mat-option *ngFor="let lang of languages" [value]="lang.value">
              {{ lang.label }}
            </mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Code</mat-label>
          <textarea
            matInput
            formControlName="code"
            rows="10"
            placeholder="Paste your code here"
          ></textarea>
          <mat-error *ngIf="codeForm.get('code')?.hasError('required')">
            Code is required
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!codeForm.valid"
        (click)="insertCode()">
        Insert
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    mat-dialog-content {
      min-width: 500px;
      max-height: 80vh;
    }
    
    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: unset;
      }
    }
  `]
})
export class CodeBlockDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CodeBlockDialogComponent>);
  
  languages = [
    { value: 'typescript', label: 'TypeScript' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'scss', label: 'SCSS' },
    { value: 'json', label: 'JSON' },
    { value: 'bash', label: 'Bash' },
    { value: 'python', label: 'Python' },
    { value: 'csharp', label: 'C#' },
    { value: 'java', label: 'Java' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'go', label: 'Go' }
  ];
  
  codeForm = this.fb.group({
    code: ['', Validators.required],
    language: ['typescript', Validators.required]
  });
  
  insertCode() {
    if (this.codeForm.valid) {
      const result: CodeBlockResult = {
        code: this.codeForm.get('code')?.value || '',
        language: this.codeForm.get('language')?.value || 'typescript'
      };
      this.dialogRef.close(result);
    }
  }
}