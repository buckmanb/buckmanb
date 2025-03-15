# Chatbot Implementation Plan for Blog App

## Overview
This plan outlines the steps to implement a basic chatbot functionality for your Angular blog application. The chatbot will provide users with a way to get quick assistance, find information, and engage with your blog content.

## Component Structure
1. **Chat Service**: Handles the business logic, message management, and API interactions
2. **Chat UI Component**: The visual interface for the chat functionality
3. **Chat Button Component**: A floating action button to open the chat
4. **Optional: Admin Chat Dashboard**: For viewing and responding to user messages

## Files to Create

### 1. Chat Service
**File**: `src/app/core/services/chat.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Firestore, collection, addDoc, query, orderBy, limit, onSnapshot, Timestamp, where, getDocs, updateDoc, doc } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';

export interface ChatMessage {
  id?: string;
  content: string;
  timestamp: Date | Timestamp;
  isUser: boolean;
  userId?: string;
  sessionId: string;
  read?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  messages$ = this.messagesSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();
  
  private sessionId: string = '';
  private chatOpen = false;
  
  constructor() {
    this.initSession();
  }
  
  private initSession(): void {
    // Generate unique session ID if not exists
    this.sessionId = localStorage.getItem('chat_session_id') || this.generateSessionId();
    localStorage.setItem('chat_session_id', this.sessionId);
    
    // Subscribe to messages for this session
    this.subscribeToMessages();
  }
  
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  private subscribeToMessages(): void {
    const messagesRef = collection(this.firestore, 'chatMessages');
    const q = query(
      messagesRef,
      where('sessionId', '==', this.sessionId),
      orderBy('timestamp', 'asc'),
      limit(50)
    );
    
    onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data() as ChatMessage;
        return {
          ...data,
          id: doc.id,
          timestamp: data.timestamp
        };
      });
      
      this.messagesSubject.next(messages);
      this.updateUnreadCount();
    });
  }
  
  setChatOpen(isOpen: boolean): void {
    this.chatOpen = isOpen;
    if (isOpen) {
      this.markAllAsRead();
    }
  }
  
  private async markAllAsRead(): Promise<void> {
    // Don't run if there are no unread messages
    if (this.unreadCountSubject.value === 0) return;
    
    const messagesRef = collection(this.firestore, 'chatMessages');
    const q = query(
      messagesRef,
      where('sessionId', '==', this.sessionId),
      where('isUser', '==', false),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    snapshot.docs.forEach(async (document) => {
      await updateDoc(doc(this.firestore, 'chatMessages', document.id), {
        read: true
      });
    });
  }
  
  private updateUnreadCount(): void {
    // Only count unread messages from the bot when chat is closed
    if (this.chatOpen) {
      this.unreadCountSubject.next(0);
      return;
    }
    
    const unreadCount = this.messagesSubject.value.filter(
      msg => !msg.isUser && msg.read === false
    ).length;
    
    this.unreadCountSubject.next(unreadCount);
  }
  
  async sendMessage(content: string): Promise<void> {
    if (!content.trim()) return;
    
    const user = this.authService.currentUser();
    const userId = user?.uid;
    
    const message: ChatMessage = {
      content,
      timestamp: Timestamp.now(),
      isUser: true,
      userId,
      sessionId: this.sessionId,
      read: true // User messages are always "read"
    };
    
    // Add to Firestore
    await addDoc(collection(this.firestore, 'chatMessages'), message);
    
    // Simulate bot response (in a real app, you'd call an API)
    setTimeout(() => this.generateBotResponse(content), 1000);
  }
  
  private async generateBotResponse(userMessage: string): Promise<void> {
    // Simple bot logic - in a real app, you'd call an API (e.g., OpenAI, Dialogflow)
    let botResponse = '';
    
    // Very basic response logic
    const normalizedMsg = userMessage.toLowerCase();
    if (normalizedMsg.includes('hello') || normalizedMsg.includes('hi')) {
      botResponse = 'Hello! How can I help you today?';
    } else if (normalizedMsg.includes('blog') || normalizedMsg.includes('article')) {
      botResponse = 'You can find all our blog posts on the home page. Is there a specific topic you\'re interested in?';
    } else if (normalizedMsg.includes('contact') || normalizedMsg.includes('email')) {
      botResponse = 'You can contact us through the contact page or email us at info@example.com';
    } else if (normalizedMsg.includes('login') || normalizedMsg.includes('sign')) {
      botResponse = 'You can login or create an account through our authentication page.';
    } else {
      botResponse = 'I\'m not sure I understand. Could you rephrase your question?';
    }
    
    const botMessage: ChatMessage = {
      content: botResponse,
      timestamp: Timestamp.now(),
      isUser: false,
      sessionId: this.sessionId,
      read: this.chatOpen // Mark as read if chat is open
    };
    
    // Add to Firestore
    await addDoc(collection(this.firestore, 'chatMessages'), botMessage);
  }
  
  clearChat(): void {
    // Generate a new session ID to start fresh
    this.sessionId = this.generateSessionId();
    localStorage.setItem('chat_session_id', this.sessionId);
    
    // Re-subscribe with new session ID
    this.subscribeToMessages();
  }
}
```

### 2. Chat UI Component
**File**: `src/app/shared/components/chatbot.component.ts`

```typescript
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
```

### 3. Update App Component
**File**: `src/app/app.component.ts`

Update the imports array to include the chatbot component:

```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    ThemeToggleComponent,
    ChatbotComponent, // Add this line
    // ... other imports
  ],
  // ...
})
```

Add the chatbot component to your template:

```html
<!-- Add at the end of your app.component.ts template -->
<app-chatbot></app-chatbot>
```

### 4. Firestore Rules Updates

You'll need to update your Firestore security rules to allow reading and writing chat messages:

```
// firestore.rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // ... other rules
    
    match /chatMessages/{messageId} {
      // Allow users to read their own chat messages
      allow read: if request.auth != null && 
                  resource.data.sessionId == request.resource.data.sessionId;
      
      // Allow creating messages
      allow create: if request.auth != null || 
                    request.resource.data.isUser == true;
      
      // Allow updating only with proper authorization
      allow update: if request.auth != null && 
                    (resource.data.userId == request.auth.uid || 
                    request.auth.token.role == "admin");
    }
  }
}
```

## Optional Features to Implement Later

### 1. Admin Chat Dashboard
Create an admin component to view and respond to user chats:

- List all active chat sessions
- View messages for each session
- Allow admins to respond directly to users
- Filter and search capabilities

### 2. Integration with AI Services
Improve the bot responses by integrating with:

- OpenAI API (GPT)
- Google Dialogflow
- Azure Bot Service
- Or other NLP/chatbot services

### 3. Enhanced Features
Additional features to consider:

- Chat history persistence
- Typing indicators
- File/image sharing
- Pre-defined quick responses
- FAQ integration
- Voice input/output
- Chatbot analytics

## Testing Plan

1. **Unit Testing**:
   - Test chat service methods
   - Test component interactions

2. **Integration Testing**:
   - Test Firestore integration
   - Test authentication integration

3. **User Testing**:
   - Test on different devices
   - Test different conversation flows

## Deployment Considerations

1. **Firestore Configuration**:
   - Update security rules
   - Consider adding indexes for queries
   - Set up backup strategies

2. **Performance**:
   - Limit message history loading
   - Consider pagination for long conversations

3. **Security**:
   - Ensure proper authentication
   - Sanitize user inputs
   - Rate limiting for message sending

## Implementation Timeline

1. **Phase 1 (1-2 days)**:
   - Create basic chat service
   - Implement UI components
   - Set up Firestore integration

2. **Phase 2 (1-2 days)**:
   - Add advanced features
   - Improve bot responses
   - Style enhancements

3. **Phase 3 (1-2 days)**:
   - Testing and bug fixing
   - Admin dashboard
   - Documentation
