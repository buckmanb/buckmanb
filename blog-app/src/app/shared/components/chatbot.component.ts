import { Component, inject, OnInit, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ChatService, ChatMessage } from '../../core/services/chat.service';

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
    MatTooltipModule
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
              <div class="message">
                {{ message.content }}
              </div>
              <div class="message-time">
                {{ formatTimestamp(message.timestamp) }}
              </div>
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
      padding: 10px 15px;
      border-radius: 18px;
      word-break: break-word;
      white-space: pre-wrap;
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

    @media (max-width: 450px) {
      .chat-window {
        width: 300px;
        height: 450px;
        bottom: 70px;
        right: 0;
      }
    }
  `]
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  private chatService = inject(ChatService);

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  messages = signal<ChatMessage[]>([]);
  isOpen = signal<boolean>(false);
  unreadCount = signal<number>(0);
  newMessage = '';

  ngOnInit(): void {
    // Subscribe to messages
    this.chatService.messages$.subscribe(messages => {
      this.messages.set(messages);
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

  private scrollToBottom(): void {
    if (this.messageContainer) {
      const element = this.messageContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
}
