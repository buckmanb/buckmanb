import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { ChatService, ChatMessage } from '../../core/services/chat.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatCardModule,
    MatTooltipModule,
    MatMenuModule
  ],
  template: `
    <div class="chat-page-container">
      <mat-card class="chat-card">
        <mat-card-header>
          <mat-card-title>
            <div class="header-content">
              <h1>Chat with Assistant</h1>
              <div class="header-actions">
                <button mat-icon-button (click)="clearChat()" matTooltip="Clear conversation">
                  <mat-icon>delete_sweep</mat-icon>
                </button>
              </div>
            </div>
          </mat-card-title>
        </mat-card-header>
        
        <mat-divider></mat-divider>
        
        <mat-card-content>
          <div class="messages-container" #messagesContainer>
            <!-- Empty state -->
            <div *ngIf="messages.length === 0" class="empty-state">
              <mat-icon>chat</mat-icon>
              <h2>Start a Conversation</h2>
              <p>Ask me anything about our blog, site features, or any other questions you might have.</p>
            </div>
            
            <!-- Messages -->
            <div *ngFor="let message of messages" class="message-wrapper" 
                 [ngClass]="{'user-message': message.isUser, 'bot-message': !message.isUser}">
              <div class="message-avatar">
                <mat-icon>{{ message.isUser ? 'person' : 'smart_toy' }}</mat-icon>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-sender">{{ message.isUser ? 'You' : 'Assistant' }}</span>
                  <span class="message-time">{{ formatTimestamp(message.timestamp) }}</span>
                </div>
                <div class="message-text">
                  <ng-container *ngIf="message.isTyping">
                    <div class="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </ng-container>
                  <ng-container *ngIf="!message.isTyping">
                    {{ message.content }}
                  </ng-container>
                </div>
                
                <!-- Follow-up suggestion buttons (only for bot messages) -->
                <div *ngIf="!message.isUser && message.followUpQuestions && message.followUpQuestions.length > 0" 
                     class="suggestion-buttons">
                  <button *ngFor="let suggestion of message.followUpQuestions"
                          mat-stroked-button 
                          color="primary" 
                          (click)="sendSuggestion(suggestion)">
                    {{ suggestion }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>
        
        <mat-card-actions>
          <div class="input-container">
            <mat-form-field appearance="outline" class="message-input">
              <input matInput 
                     [(ngModel)]="newMessage" 
                     placeholder="Type your message..." 
                     (keyup.enter)="sendMessage()"
                     [disabled]="isRecording">
              <button *ngIf="newMessage" 
                      matSuffix 
                      mat-icon-button 
                      aria-label="Clear" 
                      (click)="newMessage=''">
                <mat-icon>close</mat-icon>
              </button>
            </mat-form-field>
            
            <button mat-icon-button 
                    color="primary" 
                    matTooltip="Voice input"
                    [class.recording]="isRecording"
                    (click)="toggleVoiceInput()">
              <mat-icon>{{ isRecording ? 'mic' : 'mic_none' }}</mat-icon>
            </button>
            
            <button mat-fab 
                    color="primary" 
                    matTooltip="Send message"
                    [disabled]="!newMessage.trim() && !isRecording"
                    (click)="sendMessage()">
              <mat-icon>send</mat-icon>
            </button>
          </div>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .chat-page-container {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
      height: calc(100vh - 140px);
      display: flex;
      flex-direction: column;
    }
    
    .chat-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    
    .header-content h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
    
    mat-card-content {
      flex: 1;
      overflow: hidden;
      padding: 0 !important;
    }
    
    .messages-container {
      height: 100%;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: var(--text-secondary);
      padding: 48px 0;
    }
    
    .empty-state mat-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      opacity: 0.5;
      margin-bottom: 16px;
    }
    
    .message-wrapper {
      display: flex;
      gap: 16px;
      max-width: 85%;
    }
    
    .user-message {
      align-self: flex-end;
      flex-direction: row-reverse;
    }
    
    .bot-message {
      align-self: flex-start;
    }
    
    .message-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--primary-color);
      color: white;
      flex-shrink: 0;
    }
    
    .user-message .message-avatar {
      background-color: var(--accent-color);
    }
    
    .message-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
    }
    
    .message-sender {
      font-weight: 500;
    }
    
    .message-time {
      color: var(--text-secondary);
    }
    
    .message-text {
      padding: 12px 16px;
      background-color: var(--surface-color);
      border-radius: 8px;
      box-shadow: var(--shadow-1);
    }
    
    .user-message .message-text {
      background-color: var(--primary-color);
      color: white;
    }
    
    .typing-indicator {
      display: flex;
      gap: 4px;
    }
    
    .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--text-secondary);
      animation: typing-pulse 1.5s infinite;
    }
    
    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes typing-pulse {
      0%, 100% {
        transform: translateY(0);
        opacity: 0.5;
      }
      50% {
        transform: translateY(-5px);
        opacity: 1;
      }
    }
    
    .suggestion-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    
    .suggestion-buttons button {
      font-size: 12px;
      padding: 0 12px;
      height: 32px;
      line-height: 32px;
      white-space: normal;
      text-align: left;
    }
    
    .input-container {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 0 16px 16px;
      width: 100%;
    }
    
    .message-input {
      flex: 1;
    }
    
    .recording {
      color: red;
      animation: pulse 1.5s infinite;
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
    
    @media (max-width: 768px) {
      .chat-page-container {
        padding: 16px;
        height: calc(100vh - 116px);
      }
      
      .message-wrapper {
        max-width: 100%;
      }
    }
  `]
})
export class ChatPageComponent implements OnInit {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  newMessage: string = '';
  isRecording: boolean = false;
  
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  
  constructor() {}
  
  ngOnInit(): void {
    // Subscribe to messages from the chat service
    this.chatService.messages$.subscribe(messages => {
      this.messages = messages;
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }
  
  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.newMessage);
      this.newMessage = '';
    }
  }
  
  sendSuggestion(suggestion: string): void {
    this.newMessage = suggestion;
    this.sendMessage();
  }
  
  clearChat(): void {
    this.chatService.clearChat();
  }
  
  toggleVoiceInput(): void {
    this.isRecording = !this.isRecording;
    // Implement voice recording functionality here
    // For now, just toggle the state as a placeholder
    if (this.isRecording) {
      setTimeout(() => {
        this.isRecording = false;
      }, 3000);
    }
  }
  
  formatTimestamp(timestamp: any): string {
    if (!timestamp) return '';
    
    let date: Date;
    
    // Check if it has a toDate method (Firestore Timestamp)
    if (timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(Number(timestamp) || String(timestamp));
    }
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  private scrollToBottom(): void {
    if (this.messagesContainer) {
      try {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      } catch(err) {
        console.error('Error scrolling to bottom:', err);
      }
    }
  }
}