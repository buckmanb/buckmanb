import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-chat-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule
  ],
  template: `
    <h2 mat-dialog-title>Chat History</h2>
    <div mat-dialog-content>
      @if (sessions.length === 0) {
        <p>No previous chat sessions found.</p>
      } @else {
        <mat-selection-list [multiple]="false">
          @for (session of sessions; track session) {
            <mat-list-option (click)="selectSession(session)">
              {{ formatSessionDate(session) }}
            </mat-list-option>
          }
        </mat-selection-list>
      }
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
    </div>
  `,
  styles: [`
    mat-dialog-content {
      min-height: 200px;
    }
  `]
})
export class ChatHistoryDialogComponent {
  private dialogRef = inject(MatDialogRef<ChatHistoryDialogComponent>);
  private chatService = inject(ChatService);

  sessions: string[] = [];

  constructor() {
    this.loadSessions();
  }

  async loadSessions(): Promise<void> {
    this.sessions = await this.chatService.getPastSessions();
  }

  selectSession(sessionId: string): void {
    this.dialogRef.close(sessionId);
  }

  formatSessionDate(sessionId: string): string {
    // Session IDs often include timestamps - we can parse those
    // This is a simplified example - adjust based on your session ID format
    try {
      // Extract timestamp portion if it exists
      const timestamp = parseInt(sessionId.split('-')[0], 10);
      if (!isNaN(timestamp)) {
        return new Date(timestamp).toLocaleString();
      }
    } catch (e) {}

    // Fallback
    return `Chat session ${sessionId.substring(0, 8)}...`;
  }
}
