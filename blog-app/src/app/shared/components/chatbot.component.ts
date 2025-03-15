import { Component, inject, OnInit, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChatService, ChatMessage } from '../../core/services/chat.service';
import { ChatHistoryDialogComponent } from './chat-history-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDialogModule,
    MatMenuModule
  ],
  template: `
    <div class="chatbot-container">
      <!-- Chat Toggle Button -->
      <button 
        mat-fab 
        color="primary" 
        class="chat-toggle-button"
        [matBadge]="unreadCount() > 0 ? unreadCount() : null"
        matBadgeColor="accent"
        (click)="toggleChat()">
        <mat-icon>chat</mat-icon>
      </button>
      
      <!-- Chat Interface -->
      <div class="chat-window" [class.open]="isOpen()">
        <div class="chat-header">
          <h3>Chat Support</h3>
          <div class="chat-actions">
            <button mat-icon-button (click)="openChatHistory()" matTooltip="Chat history">
              <mat-icon>history</mat-icon>
            </button>
            <button mat-icon-button (click)="clearChat()" matTooltip="Clear chat">
              <mat-icon>delete_outline</mat-icon>
            </button>
            <button mat-icon-button (click)="toggleChat()" matTooltip="Close chat">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
        
        <div class="chat-messages" #messageContainer>
          @if (messages().length === 0) {
            <div class="empty-chat">
              <p>How can I help you today?</p>
            </div>
          }
          @for (message of messages(); track message.id) {
            <div class="message-container" [class.user-message]="message.isUser" [class.bot-message]="!message.isUser">
              @if (message.isTyping) {
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              } @else {
                <div class="message" [ngClass]="{'rich-content': message.contentType === 'blog-preview'}">
                  @if (message.contentType === 'blog-preview' && message.blogPreview) {
                    <div class="blog-preview" (click)="navigateToBlog(message.blogPreview?.id)">
                      @if (message.blogPreview.imageUrl) {
                        <img [src]="message.blogPreview.imageUrl" alt="Blog preview">
                      }
                      <div class="preview-content">
                        <h4>{{ message.blogPreview.title }}</h4>
                        <p>{{ message.blogPreview.excerpt }}</p>
                      </div>
                    </div>
                  } @else {
                    {{ message.content }}
                    @if (message.isUser) {
                      <button mat-icon-button class="delete-btn" (click)="deleteMessage(message.id)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    } @else {
                      <div class="feedback-buttons">
                        <button mat-icon-button matTooltip="Helpful" (click)="provideFeedback(message.id, 'helpful')">
                          <mat-icon>thumb_up</mat-icon>
                        </button>
                        <button mat-icon-button matTooltip="Not helpful" (click)="provideFeedback(message.id, 'not_helpful')">
                          <mat-icon>thumb_down</mat-icon>
                        </button>
                      </div>
                    }
                  }
                </div>
                @if (message.translatedFrom) {
                  <div class="message-translation-info">
                    Translated from: {{ message.translatedFrom }}
                  </div>
                }
                <div class="message-time">
                  {{ formatTimestamp(message.timestamp) }}
                </div>
                @if (!message.isTyping && !message.originalMessageId) {
                  <button mat-icon-button class="translate-btn" [matMenuTriggerFor]="translateMenu">
                    <mat-icon>translate</mat-icon>
                  </button>
                  
                  <mat-menu #translateMenu="matMenu">
                    <button mat-menu-item (click)="translateMessage(message.id, 'es')">Spanish</button>
                    <button mat-menu-item (click)="translateMessage(message.id, 'fr')">French</button>
                    <button mat-menu-item (click)="translateMessage(message.id, 'de')">German</button>
                    <button mat-menu-item (click)="translateMessage(message.id, 'zh')">Chinese</button>
                    <button mat-menu-item (click)="translateMessage(message.id, 'ja')">Japanese</button>
                  </mat-menu>
                }
              }
            </div>
          }
          @if (lastBotMessage()?.followUpQuestions?.length) {
            <div class="suggestion-buttons">
              @for (suggestion of lastBotMessage()?.followUpQuestions || []; track suggestion) {
                <button mat-stroked-button color="primary" (click)="sendSuggestion(suggestion)">
                  {{ suggestion }}
                </button>
              }
            </div>
          }
        </div>
        
        <div class="chat-input">
          <mat-form-field appearance="outline" class="full-width">
            <input 
              matInput 
              placeholder="Type a message..." 
              [(ngModel)]="newMessage"
              (keyup.enter)="sendMessage()">
          </mat-form-field>
          
          <button mat-icon-button color="primary" 
                  (click)="toggleVoiceInput()" 
                  [class.recording]="isRecording()"
                  matTooltip="Voice input">
            <mat-icon>mic</mat-icon>
          </button>
          
          <button mat-icon-button color="primary" (click)="sendMessage()" [disabled]="!newMessage.trim()">
            <mat-icon>send</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chatbot-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }
    
    .chat-toggle-button {
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
    
    .chat-window {
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 350px;
      height: 500px;
      background-color: var(--background-color);
      border-radius: 12px;
      box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0);
      transform-origin: bottom right;
      transition: transform 0.3s ease-out;
    }
    
    .chat-window.open {
      transform: scale(1);
    }
    
    .chat-header {
      padding: 15px;
      background-color: var(--primary-color);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .chat-header h3 {
      margin: 0;
    }
    
    .chat-actions {
      display: flex;
    }
    
    .chat-messages {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .message-container {
      display: flex;
      flex-direction: column;
      max-width: 80%;
    }
    
    .user-message {
      align-self: flex-end;
    }
    
    .bot-message {
      align-self: flex-start;
    }
    
    .message {
      position: relative;
      padding: 10px 15px;
      border-radius: 18px;
      word-break: break-word;
      white-space: pre-wrap;
    }
    
    .delete-btn {
      position: absolute;
      top: -10px;
      right: -10px;
      transform: scale(0.7);
      opacity: 0;
      transition: opacity 0.2s ease;
      background-color: rgba(255, 255, 255, 0.8);
    }
    
    .message:hover .delete-btn {
      opacity: 0.7;
    }
    
    .delete-btn:hover {
      opacity: 1 !important;
    }
    
    .user-message .message {
      background-color: var(--primary-color);
      color: white;
      border-bottom-right-radius: 5px;
    }
    
    .bot-message .message {
      background-color: var(--surface-color);
      border-bottom-left-radius: 5px;
    }
    
    .message-time {
      font-size: 11px;
      opacity: 0.7;
      margin-top: 4px;
      margin-left: 5px;
      margin-right: 5px;
    }
    
    .chat-input {
      padding: 10px 15px;
      display: flex;
      align-items: center;
      border-top: 1px solid var(--border-color);
    }
    
    .full-width {
      width: 100%;
      margin-right: 10px;
    }
    
    .empty-chat {
      text-align: center;
      color: var(--text-secondary-color);
      margin-top: 50px;
    }
    
    .suggestion-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
      margin-bottom: 8px;
    }

    .suggestion-buttons button {
      font-size: 12px;
      height: 32px;
      line-height: 1;
      white-space: normal;
      text-align: left;
      padding: 0 12px;
    }
    
    @media (max-width: 450px) {
      .chat-window {
        width: 300px;
        height: 450px;
        bottom: 70px;
        right: 0;
      }
    }

    /* Typing indicator styles */
    .typing-indicator {
      background-color: var(--surface-color);
      border-radius: 18px;
      padding: 10px 15px;
      display: flex;
      align-items: center;
      width: 60px;
    }

    .typing-indicator span {
      height: 8px;
      width: 8px;
      border-radius: 50%;
      background-color: var(--text-secondary-color);
      display: block;
      margin: 0 2px;
      opacity: 0.4;
      animation: typing 1.5s infinite;
    }

    .typing-indicator span:nth-child(1) {
      animation-delay: 0s;
    }

    .typing-indicator span:nth-child(2) {
      animation-delay: 0.3s;
    }

    .typing-indicator span:nth-child(3) {
      animation-delay: 0.6s;
    }

    @keyframes typing {
      0% {
        transform: translateY(0px);
        opacity: 0.4;
      }
      50% {
        transform: translateY(-5px);
        opacity: 0.8;
      }
      100% {
        transform: translateY(0px);
        opacity: 0.4;
      }
    }
    
    .rich-content {
      padding: 0 !important;
      overflow: hidden;
    }

    .blog-preview {
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .blog-preview:hover {
      transform: translateY(-2px);
    }

    .blog-preview img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-top-left-radius: 18px;
      border-top-right-radius: 18px;
    }

    .preview-content {
      padding: 12px;
    }

    .preview-content h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
    }

    .preview-content p {
      margin: 0;
      font-size: 12px;
      opacity: 0.8;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .feedback-buttons {
      position: absolute;
      top: -10px;
      right: 30px;
      transform: scale(0.7);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .message:hover .feedback-buttons {
      opacity: 0.7;
    }

    .feedback-buttons:hover {
      opacity: 1 !important;
    }
    
    .translate-btn {
      position: absolute;
      top: -10px;
      left: -10px;
      transform: scale(0.7);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .message:hover .translate-btn {
      opacity: 0.7;
    }

    .translate-btn:hover {
      opacity: 1 !important;
    }

    .message-translation-info {
      font-size: 11px;
      font-style: italic;
      opacity: 0.7;
      margin-top: 4px;
      margin-left: 5px;
    }
    
    .recording {
      color: red;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
      100% {
        opacity: 1;
      }
    }
  `]
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  private chatService = inject(ChatService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  
  messages = signal<ChatMessage[]>([]);
  isOpen = signal<boolean>(false);
  unreadCount = signal<number>(0);
  newMessage = '';
  
  // Signal to track the last bot message
  lastBotMessage = signal<ChatMessage | null>(null);
  
  // Voice Input
  isRecording = signal<boolean>(false);
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  
  ngOnInit(): void {
    // Subscribe to messages
    this.chatService.messages$.subscribe(messages => {
      this.messages.set(messages);
      
      // Find the last bot message
      const botMessages = messages.filter(m => !m.isUser);
      if (botMessages.length > 0) {
        this.lastBotMessage.set(botMessages[botMessages.length - 1]);
      }
      
      // Scroll to bottom on new messages
      setTimeout(() => this.scrollToBottom(), 100);
    });
    
    // Subscribe to unread count
    this.chatService.unreadCount$.subscribe(count => {
      this.unreadCount.set(count);
    });
  }
  
  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }
  
  toggleChat(): void {
    this.isOpen.update(value => !value);
    this.chatService.setChatOpen(this.isOpen());
    
    // Track open/close events
    this.chatService.trackEvent(
      this.isOpen() ? 'chat_opened' : 'chat_closed'
    );
    
    if (this.isOpen()) {
      setTimeout(() => this.scrollToBottom(), 300);
    }
  }
  
  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    
    this.chatService.sendMessage(this.newMessage.trim());
    this.newMessage = '';
  }
  
  clearChat(): void {
    this.chatService.clearChat();
  }
  
  formatTimestamp(timestamp: any): string {
    if (!timestamp) return '';
    
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async deleteMessage(messageId?: string): Promise<void> {
    if (!messageId) return;
    
    try {
      await this.chatService.deleteMessage(messageId);
    } catch (error: any) {
      // You could show an error message to the user here
      console.error('Failed to delete message:', error.message);
    }
  }
  
  // Method to handle suggestion clicks
  sendSuggestion(suggestion: string): void {
    this.newMessage = suggestion;
    this.sendMessage();
  }

  openChatHistory(): void {
    const dialogRef = this.dialog.open(ChatHistoryDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(sessionId => {
      if (sessionId) {
        this.chatService.loadSession(sessionId);
      }
    });
  }
  
  private scrollToBottom(): void {
    if (this.messageContainer) {
      const element = this.messageContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
  
  provideFeedback(messageId: string, rating: 'helpful' | 'not_helpful'): void {
    this.chatService.provideFeedback(messageId, rating);
    
    // Show a snackbar or some visual confirmation
    this.snackBar.open(
      `Thank you for your feedback!`, 
      'Close', 
      { duration: 3000 }
    );
  }
  
  async translateMessage(messageId: string, language: string): Promise<void> {
    try {
      await this.chatService.translateMessage(messageId, language);
    } catch (error) {
      console.error('Error translating message:', error);
    }
  }
  
  navigateToBlog(blogId?: string): void {
    if (!blogId) return;
    
    this.router.navigate(['/blog', blogId]);
    this.toggleChat(); // Close the chat window
  }
  
  async toggleVoiceInput(): Promise<void> {
    if (this.isRecording()) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }
  
  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        // Convert recording to text (in a real app, send to a speech-to-text API)
        this.processAudioToText();
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      this.mediaRecorder.start();
      this.isRecording.set(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      this.snackBar.open('Could not access microphone', 'Close', { duration: 3000 });
    }
  }
  
  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording()) {
      this.mediaRecorder.stop();
      this.isRecording.set(false);
    }
  }
  
  async processAudioToText(): Promise<void> {
    // In a production app, you would:
    // 1. Create a blob from the audio chunks
    // 2. Send to a speech-to-text API (Google, Azure, etc.)
    // 3. Get back the transcription
    
    // For demo, simulate a processing delay and provide dummy text
    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    
    // Show processing indicator
    this.newMessage = 'Processing voice...';
    
    // Simulate API call delay
    setTimeout(() => {
      // In real app, this would be the API response text
      this.newMessage = 'This is voice transcription result';
    }, 1500);
  }
}

@Component({
  selector: 'confirm-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button [color]="data.color || 'primary'" [mat-dialog-close]="true">{{ data.confirmButton }}</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ]
})
export class ConfirmDialog {
  data: any = inject(MAT_DIALOG_DATA);
}
