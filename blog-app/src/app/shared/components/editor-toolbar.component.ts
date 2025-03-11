// src/app/shared/components/editor-toolbar.component.ts
import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Editor } from 'ngx-editor';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { EditorImageDialogComponent, EditorImageResult } from './editor-image-dialog.component';
import { CodeBlockDialogComponent, CodeBlockResult } from './code-block-dialog.component';

@Component({
  selector: 'app-editor-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    MatMenuModule
  ],
  template: `
    <div class="editor-toolbar">
      <!-- Custom toolbar features that aren't in the default NgxEditor toolbar -->
      <div class="toolbar-group">
        <!-- Enhanced image insertion -->
        <button mat-icon-button matTooltip="Enhanced Image Upload" (click)="insertEnhancedImage()">
          <mat-icon>add_photo_alternate</mat-icon>
        </button>
        
        <!-- Code block insertion -->
        <button mat-icon-button matTooltip="Insert Code Block" (click)="insertCodeBlock()">
          <mat-icon>code</mat-icon>
        </button>
        
        <!-- Table insertion -->
        <button mat-icon-button matTooltip="Insert Table" (click)="insertTable()">
          <mat-icon>table_chart</mat-icon>
        </button>
      </div>
      
      <mat-divider [vertical]="true"></mat-divider>
      
      <!-- Indent/Outdent -->
      <div class="toolbar-group">
        <button mat-icon-button matTooltip="Decrease Indent" (click)="decreaseIndent()">
          <mat-icon>format_indent_decrease</mat-icon>
        </button>
        <button mat-icon-button matTooltip="Increase Indent" (click)="increaseIndent()">
          <mat-icon>format_indent_increase</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .editor-toolbar {
      display: flex;
      align-items: center;
      padding: 8px;
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-bottom: none;
      border-radius: 4px 4px 0 0;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .toolbar-group {
      display: flex;
      align-items: center;
    }
    
    mat-divider {
      height: 24px;
      margin: 0 4px;
    }
    
    @media (max-width: 600px) {
      .editor-toolbar {
        justify-content: center;
      }
    }
  `]
})
export class EditorToolbarComponent implements OnInit {
  @Input() editor!: Editor;
  
  private dialog = inject(MatDialog);
  
  ngOnInit(): void {
    // Initialize any editor plugins or extensions if needed
  }
  
  insertEnhancedImage() {
    const dialogRef = this.dialog.open(EditorImageDialogComponent, {
      width: '600px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe((result: EditorImageResult | undefined) => {
      if (result) {
        // Use the editor command to insert the image with additional attributes
        this.editor.commands.insertImage(result.src, {
          alt: result.alt,
          title: result.title,
          width: result.width?.toString() + 'px',
          // height: result.height?.toString()
        }).exec();
      }
    });
  }
  
  insertCodeBlock() {
    const dialogRef = this.dialog.open(CodeBlockDialogComponent, {
      width: '700px',
      maxWidth: '95vw'
    });
    
    dialogRef.afterClosed().subscribe((result: CodeBlockResult | undefined) => {
      if (result) {
        // Create custom HTML for the code block with language
        const codeBlock = `
          <pre data-language="${result.language}"><code class="language-${result.language}">${this.escapeHtml(result.code)}</code></pre>
        `;
        
        // Insert as HTML
        this.editor.commands.insertHTML(codeBlock).exec();
      }
    });
  }
  
  insertTable() {
    // Simple 3x3 table
    const tableHTML = `
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="border: 1px solid var(--border-color); padding: 8px;"></td>
            <td style="border: 1px solid var(--border-color); padding: 8px;"></td>
            <td style="border: 1px solid var(--border-color); padding: 8px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid var(--border-color); padding: 8px;"></td>
            <td style="border: 1px solid var(--border-color); padding: 8px;"></td>
            <td style="border: 1px solid var(--border-color); padding: 8px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid var(--border-color); padding: 8px;"></td>
            <td style="border: 1px solid var(--border-color); padding: 8px;"></td>
            <td style="border: 1px solid var(--border-color); padding: 8px;"></td>
          </tr>
        </tbody>
      </table>
    `;
    
    this.editor.commands.insertHTML(tableHTML).exec();
  }
  
  decreaseIndent() {
    document.execCommand('outdent', false);
  }
  
  increaseIndent() {
    document.execCommand('indent', false);
  }
  
  // Helper method to escape HTML special characters
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}