import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ChatMessage } from '../../core/services/chat.service';

export interface SaveChatDialogData {
  messages: ChatMessage[];
}

export interface SaveChatDialogResult {
  title: string;
  excerpt: string;
  tags: string[];
  includeTimestamps: boolean;
  includeUserInfo: boolean;
}

@Component({
  selector: 'app-save-chat-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './save-chat-dialog.component.html',
  styleUrls: ['./save-chat-dialog.component.css']
})
export class SaveChatDialogComponent {
  private fb = inject(FormBuilder);

  blogForm: FormGroup = this.fb.group({
    title: ['Chat Conversation: ' + new Date().toLocaleDateString(), Validators.required],
    excerpt: ['A saved conversation from the chat support.', Validators.required],
    tags: ['chat, support, conversation'],
    includeTimestamps: [true],
    includeUserInfo: [false]
  });

  // Show only first 5 messages in preview
  previewMessages: ChatMessage[] = [];

  constructor(
    public dialogRef: MatDialogRef<SaveChatDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SaveChatDialogData
  ) {
    // Get first 5 messages for preview
    this.previewMessages = data.messages.slice(0, 5);
  }

  onSubmit(): void {
    if (this.blogForm.valid) {
      const formData = this.blogForm.value;

      // Convert tags string to array
      const tags = formData.tags.split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0);

      this.dialogRef.close({
        ...formData,
        tags
      });
    }
  }
}
