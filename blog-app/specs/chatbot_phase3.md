# Enhanced Chatbot Functionality Development Plan

## Overview
This plan outlines additional features to enhance the basic chatbot implementation, making it more powerful, user-friendly, and valuable to your blog visitors.

## 1. Keyword-based Smart Responses

### Implementation Plan
1. Create a structured response system in the ChatService:

```typescript
// src/app/core/services/chat.service.ts

interface BotResponse {
  keywords: string[];
  response: string;
  followUpQuestions?: string[];
}

// Add to ChatService class
private botResponses: BotResponse[] = [
  {
    keywords: ['hello', 'hi', 'hey', 'greetings'],
    response: 'Hello! How can I help you today?',
    followUpQuestions: [
      'Are you looking for specific blog posts?',
      'Do you want to know more about the author?',
      'Need help finding something?'
    ]
  },
  {
    keywords: ['blog', 'article', 'post'],
    response: 'You can find all our blog posts on the home page. We cover topics like Angular, Firebase, and web development.',
    followUpQuestions: [
      'Are you interested in a specific topic?',
      'Would you like to see our most popular posts?'
    ]
  },
  {
    keywords: ['login', 'signin', 'signup', 'register', 'account'],
    response: 'You can create an account or sign in by clicking the "Login" button in the top navigation bar.',
    followUpQuestions: [
      'Are you having trouble with authentication?',
      'Do you need to reset your password?'
    ]
  },
  {
    keywords: ['contact', 'email', 'reach'],
    response: 'You can contact us through our contact form or email directly at example@yourblog.com',
    followUpQuestions: [
      'Do you have a specific question I might help with?'
    ]
  },
  {
    keywords: ['search', 'find', 'looking'],
    response: 'You can use the search box at the top of the page to find specific content.',
    followUpQuestions: [
      'What topic are you interested in?'
    ]
  }
];

// Enhance the generateBotResponse method
private async generateBotResponse(userMessage: string): Promise<void> {
  // Normalize message for better matching
  const normalizedMsg = userMessage.toLowerCase();
  
  // Try to find a matching response
  let botResponse = '';
  let followUpQuestions: string[] = [];
  
  // Check for matches in our predefined responses
  for (const response of this.botResponses) {
    if (response.keywords.some(keyword => normalizedMsg.includes(keyword))) {
      botResponse = response.response;
      followUpQuestions = response.followUpQuestions || [];
      break;
    }
  }
  
  // Fallback response if no match found
  if (!botResponse) {
    botResponse = "I'm not sure I understand. Could you rephrase your question?";
    followUpQuestions = [
      "Are you looking for blog posts?",
      "Do you need help with the website?",
      "Would you like to contact us?"
    ];
  }
  
  // Create the message
  const botMessage: ChatMessage = {
    content: botResponse,
    timestamp: Timestamp.now(),
    isUser: false,
    sessionId: this.sessionId,
    read: this.chatOpen,
    followUpQuestions
  };
  
  // Add to Firestore
  await addDoc(collection(this.firestore, 'chatMessages'), botMessage);
}
```

2. Update the ChatMessage interface to include follow-up questions:

```typescript
// Update the ChatMessage interface
export interface ChatMessage {
  id?: string;
  content: string;
  timestamp: Date | Timestamp;
  isUser: boolean;
  userId?: string;
  sessionId: string;
  read?: boolean;
  followUpQuestions?: string[]; // New field
}
```

## 2. Suggested Responses / Quick Replies

### Implementation Plan
1. Update the chatbot component template to display suggestion buttons:

```typescript
// src/app/shared/components/chatbot.component.ts

// Add inside the chat-messages div, after the message loop
@if (lastBotMessage()?.followUpQuestions?.length) {
  <div class="suggestion-buttons">
    @for (suggestion of lastBotMessage()?.followUpQuestions || []; track suggestion) {
      <button mat-stroked-button color="primary" (click)="sendSuggestion(suggestion)">
        {{ suggestion }}
      </button>
    }
  </div>
}
```

2. Add the necessary methods and properties to the component:

```typescript
// Add to ChatbotComponent class

// Signal to track the last bot message
lastBotMessage = signal<ChatMessage | null>(null);

// Update ngOnInit to set the last bot message
ngOnInit(): void {
  // Existing code...
  
  // Keep track of last bot message for suggestion buttons
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
}

// Method to handle suggestion clicks
sendSuggestion(suggestion: string): void {
  this.newMessage = suggestion;
  this.sendMessage();
}
```

3. Add styles for the suggestion buttons:

```css
// Add to component styles
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
```

## 3. Chat History Persistence

### Implementation Plan
1. Add methods to ChatService to retrieve past conversations:

```typescript
// src/app/core/services/chat.service.ts

// Add to ChatService class
async getPastSessions(): Promise<string[]> {
  const user = this.authService.currentUser();
  if (!user) return [];
  
  try {
    // Get all unique sessionIds for this user
    const messagesRef = collection(this.firestore, 'chatMessages');
    const q = query(
      messagesRef,
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    // Extract unique session IDs
    const sessionIds = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data() as ChatMessage;
      if (data.sessionId) {
        sessionIds.add(data.sessionId);
      }
    });
    
    return Array.from(sessionIds);
  } catch (error) {
    console.error('Error getting past sessions:', error);
    return [];
  }
}

async loadSession(sessionId: string): Promise<void> {
  if (!sessionId) return;
  
  // Set the current session ID
  this.sessionId = sessionId;
  localStorage.setItem('chat_session_id', sessionId);
  
  // Refresh messages with the new session ID
  this.subscribeToMessages();
}
```

2. Create a session history dialog component:

```typescript
// src/app/shared/components/chat-history-dialog.component.ts
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
```

3. Add a history button to the chat component:

```typescript
// Update chatbot.component.ts template
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
```

4. Add the dialog open method to the component:

```typescript
// Add to ChatbotComponent class
private dialog = inject(MatDialog);

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
```

## 4. Typing Indicators

### Implementation Plan
1. Update the ChatMessage interface to support typing status:

```typescript
// src/app/core/services/chat.service.ts

// Update the ChatMessage interface
export interface ChatMessage {
  // ... existing fields
  isTyping?: boolean; // New field for typing indicators
}
```

2. Add typing indicator methods to ChatService:

```typescript
// Add to ChatService class
private typingTimeoutId: any = null;

showTypingIndicator(): void {
  const typingMessage: ChatMessage = {
    content: '',
    timestamp: Timestamp.now(),
    isUser: false,
    sessionId: this.sessionId,
    read: this.chatOpen,
    isTyping: true
  };
  
  // Add temporary typing indicator message
  addDoc(collection(this.firestore, 'chatMessages'), typingMessage);
}

hideTypingIndicator(): void {
  // Find and remove typing indicator messages
  const messagesRef = collection(this.firestore, 'chatMessages');
  const q = query(
    messagesRef,
    where('sessionId', '==', this.sessionId),
    where('isTyping', '==', true)
  );
  
  getDocs(q).then(snapshot => {
    snapshot.docs.forEach(doc => {
      deleteDoc(doc.ref);
    });
  });
}

// Update the sendMessage method
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
    read: true
  };
  
  // Add to Firestore
  await addDoc(collection(this.firestore, 'chatMessages'), message);
  
  // Show typing indicator
  this.showTypingIndicator();
  
  // Generate bot response with delay
  if (this.typingTimeoutId) {
    clearTimeout(this.typingTimeoutId);
  }
  
  // Random delay between 1-3 seconds for more natural feel
  const delay = 1000 + Math.random() * 2000;
  this.typingTimeoutId = setTimeout(async () => {
    // Remove typing indicator
    this.hideTypingIndicator();
    
    // Generate response
    await this.generateBotResponse(content);
  }, delay);
}
```

3. Update the chatbot component template to display typing indicators:

```typescript
// Add to the message loop in chatbot.component.ts template
@for (message of messages(); track message.id) {
  <div class="message-container" [class.user-message]="message.isUser" [class.bot-message]="!message.isUser">
    @if (message.isTyping) {
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    } @else {
      <div class="message">
        {{ message.content }}
        @if (message.isUser) {
          <button mat-icon-button class="delete-btn" (click)="deleteMessage(message.id)">
            <mat-icon>delete</mat-icon>
          </button>
        }
      </div>
      <div class="message-time">
        {{ formatTimestamp(message.timestamp) }}
      </div>
    }
  </div>
}
```

4. Add CSS for the typing indicator:

```css
// Add to component styles
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
```

## 5. Rich Content Support

### Implementation Plan
1. Enhance the ChatMessage interface to support different content types:

```typescript
// src/app/core/services/chat.service.ts

export type MessageContentType = 'text' | 'link' | 'image' | 'blog-preview';

export interface MessageLink {
  url: string;
  text: string;
}

export interface BlogPreview {
  id: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
}

// Update the ChatMessage interface
export interface ChatMessage {
  // ... existing fields
  contentType?: MessageContentType;
  links?: MessageLink[];
  blogPreview?: BlogPreview;
}
```

2. Add methods to generate rich content in the chat service:

```typescript
// Add to ChatService class
private blogService = inject(BlogService);

// Update the generateBotResponse method to include rich content
private async generateBotResponse(userMessage: string): Promise<void> {
  // ... existing code
  
  // Check for blog post references
  if (normalizedMsg.includes('blog') || 
      normalizedMsg.includes('article') || 
      normalizedMsg.includes('post')) {
    
    // Try to find relevant blog posts
    try {
      const posts = await this.blogService.searchPosts(
        userMessage.replace(/blog|article|post/gi, '').trim(), 
        3
      );
      
      if (posts.length > 0) {
        // First send the text response
        await addDoc(collection(this.firestore, 'chatMessages'), botMessage);
        
        // Then send blog previews for each relevant post
        for (const post of posts) {
          const previewMessage: ChatMessage = {
            content: `I found this post that might interest you:`,
            contentType: 'blog-preview',
            blogPreview: {
              id: post.id || '',
              title: post.title,
              excerpt: post.excerpt || post.title,
              imageUrl: post.coverImage
            },
            timestamp: Timestamp.now(),
            isUser: false,
            sessionId: this.sessionId,
            read: this.chatOpen
          };
          
          await addDoc(collection(this.firestore, 'chatMessages'), previewMessage);
        }
        
        return;
      }
    } catch (error) {
      console.error('Error searching posts:', error);
    }
  }
  
  // Otherwise just send the regular text message
  await addDoc(collection(this.firestore, 'chatMessages'), botMessage);
}
```

3. Update the chatbot component template to render rich content:

```typescript
// Update the message rendering in chatbot.component.ts template
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
          }
        }
      </div>
      <div class="message-time">
        {{ formatTimestamp(message.timestamp) }}
      </div>
    }
  </div>
}
```

4. Add styles for the rich content:

```css
// Add to component styles
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
```

5. Add the navigation method to the component:

```typescript
// Add to ChatbotComponent class
private router = inject(Router);

navigateToBlog(blogId?: string): void {
  if (!blogId) return;
  
  this.router.navigate(['/blog', blogId]);
  this.toggleChat(); // Close the chat window
}
```

## 6. Analytics and Feedback

### Implementation Plan
1. Add a feedback system to the ChatService:

```typescript
// src/app/core/services/chat.service.ts

export interface ChatFeedback {
  sessionId: string;
  messageId: string;
  userId?: string;
  rating: 'helpful' | 'not_helpful';
  comment?: string;
  timestamp: Date | Timestamp;
}

// Add to ChatService class
async provideFeedback(messageId: string, rating: 'helpful' | 'not_helpful', comment?: string): Promise<void> {
  const user = this.authService.currentUser();
  const userId = user?.uid;
  
  const feedback: ChatFeedback = {
    sessionId: this.sessionId,
    messageId,
    userId,
    rating,
    comment,
    timestamp: Timestamp.now()
  };
  
  try {
    await addDoc(collection(this.firestore, 'chatFeedback'), feedback);
  } catch (error) {
    console.error('Error saving feedback:', error);
    throw error;
  }
}

async trackEvent(eventType: string, data?: any): Promise<void> {
  try {
    await addDoc(collection(this.firestore, 'chatAnalytics'), {
      sessionId: this.sessionId,
      userId: this.authService.currentUser()?.uid,
      eventType,
      data,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}
```

2. Update the sendMessage method to track message events:

```typescript
// Update the sendMessage method in ChatService
async sendMessage(content: string): Promise<void> {
  // ... existing code
  
  // Track messaging event
  this.trackEvent('message_sent', { length: content.length });
  
  // ... rest of the method
}
```

3. Add feedback buttons to bot messages:

```typescript
// Update the message rendering in chatbot.component.ts template
<div class="message">
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
</div>
```

4. Add the feedback method to the component:

```typescript
// Add to ChatbotComponent class
provideFeedback(messageId: string, rating: 'helpful' | 'not_helpful'): void {
  this.chatService.provideFeedback(messageId, rating);
  
  // Show a snackbar or some visual confirmation
  this.snackBar.open(
    `Thank you for your feedback!`, 
    'Close', 
    { duration: 3000 }
  );
}
```

5. Add tracking for chat open/close events in the component:

```typescript
// Update the toggleChat method in ChatbotComponent
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
```

## 7. Admin Dashboard for Chat Management

Create a new component for admin chat management:

```typescript
// src/app/features/admin/components/admin-chat-dashboard.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Firestore, collection, query, orderBy, limit, getDocs, where, Timestamp } from '@angular/fire/firestore';

import { ChatMessage, ChatFeedback } from '../../../core/services/chat.service';

@Component({
  selector: 'app-admin-chat-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="container">
      <h1>Chat Management</h1>
      
      <mat-card>
        <mat-card-content>
          <mat-tab-group>
            <mat-tab label="Recent Conversations">
              <table mat-table [dataSource]="recentSessions" class="mat-elevation-z1 w-full">
                <!-- Session ID Column -->
                <ng-container matColumnDef="sessionId">
                  <th mat-header-cell *matHeaderCellDef>Session ID</th>
                  <td mat-cell *matCellDef="let session">{{ session.sessionId.substring(0, 10) }}...</td>
                </ng-container>
                
                <!-- Start Time Column -->
                <ng-container matColumnDef="startTime">
                  <th mat-header-cell *matHeaderCellDef>Start Time</th>
                  <td mat-cell *matCellDef="let session">{{ formatDate(session.startTime) }}</td>
                </ng-container>
                
                <!-- Message Count Column -->
                <ng-container matColumnDef="messageCount">
                  <th mat-header-cell *matHeaderCellDef>Messages</th>
                  <td mat-cell *matCellDef="let session">{{ session.messageCount }}</td>
                </ng-container>
                
                <!-- User Column -->
                <ng-container matColumnDef="userId">
                  <th mat-header-cell *matHeaderCellDef>User</th>
                  <td mat-cell *matCellDef="let session">
                    {{ session.userId ? session.userId.substring(0, 10) + '...' : 'Anonymous' }}
                  </td>
                </ng-container>
                
                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let session">
                    <button mat-icon-button color="primary" (click)="viewSession(session.sessionId)">
                      <mat-icon>visibility</mat-icon>
                    </button>
                  </td>
                </ng-container>
                
                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </mat-tab>
            
            <mat-tab label="Feedback">
              <table mat-table [dataSource]="feedbackItems" class="mat-elevation-z1 w-full">
                <!-- Session ID Column -->
                <ng-container matColumnDef="sessionId">
                  <th mat-header-cell *matHeaderCellDef>Session ID</th>
                  <td mat-cell *matCellDef="let feedback">{{ feedback.sessionId.substring(0, 10) }}...</td>
                </ng-container>
                
                <!-- Rating Column -->
                <ng-container matColumnDef="rating">
                  <th mat-header-cell *matHeaderCellDef>Rating</th>
                  <td mat-cell *matCellDef="let feedback">
                    <mat-icon [color]="feedback.rating === 'helpful' ? 'accent' : 'warn'">
                      {{ feedback.rating === 'helpful' ? 'thumb_up' : 'thumb_down' }}
                    </mat-icon>
                  </td>
                </ng-container>
                
                <!-- Time Column -->
                <ng-container matColumnDef="timestamp">
                  <th mat-header-cell *matHeaderCellDef>Time</th>
                  <td mat-cell *matCellDef="let feedback">{{ formatDate(feedback.timestamp) }}</td>
                </ng-container>
                
                <!-- Comment Column -->
                <ng-container matColumnDef="comment">
                  <th mat-header-cell *matHeaderCellDef>Comment</th>
                  <td mat-cell *matCellDef="let feedback">{{ feedback.comment || 'No comment' }}</td>
                </ng-container>
                
                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let feedback">
                    <button mat-icon-button color="primary" (click)="viewSession(feedback.sessionId)">
                      <mat-icon>visibility</mat-icon>
                    </button>
                  </td>
                </ng-container>
                
                <tr mat-header-row *matHeaderRowDef="feedbackColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: feedbackColumns;"></tr>
              </table>
            </mat-tab>
            
            <mat-tab label="Analytics">
              <div class="analytics-dashboard">
                <div class="analytics-cards">
                  <mat-card>
                    <mat-card-content>
                      <div class="analytics-value">{{ totalSessions }}</div>
                      <div class="analytics-label">Total Sessions</div>
                    </mat-card-content>
                  </mat-card>
                  
                  <mat-card>
                    <mat-card-content>
                      <div class="analytics-value">{{ totalMessages }}</div>
                      <div class="analytics-label">Total Messages</div>
                    </mat-card-content>
                  </mat-card>
                  
                  <mat-card>
                    <mat-card-content>
                      <div class="analytics-value">{{ averageRating | number:'1.1-1' }}</div>
                      <div class="analytics-label">Average Rating</div>
                    </mat-card-content>
                  </mat-card>
                </div>
                
                <h3>Common User Questions</h3>
                <table mat-table [dataSource]="commonQuestions" class="mat-elevation-z1 w-full">
                  <ng-container matColumnDef="question">
                    <th mat-header-cell *matHeaderCellDef>Question</th>
                    <td mat-cell *matCellDef="let item">{{ item.question }}</td>
                  </ng-container>
                  
                  <ng-container matColumnDef="count">
                    <th mat-header-cell *matHeaderCellDef>Count</th>
                    <td mat-cell *matCellDef="let item">{{ item.count }}</td>
                  </ng-container>
                  
                  <tr mat-header-row *matHeaderRowDef="['question', 'count']"></tr>
                  <tr mat-row *matRowDef="let row; columns: ['question', 'count'];"></tr>
                </table>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
      
      @if (selectedSessionId) {
        <mat-card class="mt-4">
          <mat-card-header>
            <mat-card-title>
              Conversation Detail
              <button mat-icon-button color="warn" (click)="selectedSessionId = null">
                <mat-icon>close</mat-icon>
              </button>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="conversation-container">
              @for (message of sessionMessages; track message.id) {
                <div class="message-container" [class.user-message]="message.isUser" [class.bot-message]="!message.isUser">
                  <div class="message">
                    {{ message.content }}
                  </div>
                  <div class="message-time">
                    {{ formatDate(message.timestamp) }}
                  </div>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
    
    table {
      width: 100%;
    }
    
    .analytics-dashboard {
      padding: 16px 0;
    }
    
    .analytics-cards {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .analytics-cards mat-card {
      flex: 1;
      text-align: center;
    }
    
    .analytics-value {
      font-size: 32px;
      font-weight: 500;
      color: var(--primary-color);
    }
    
    .analytics-label {
      font-size: 14px;
      opacity: 0.7;
    }
    
    .conversation-container {
      max-height: 400px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
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
    
    .w-full {
      width: 100%;
    }
    
    .mt-4 {
      margin-top: 16px;
    }
  `]
})
export class AdminChatDashboardComponent implements OnInit {
  private firestore = inject(Firestore);
  
  // Table data
  recentSessions: any[] = [];
  feedbackItems: any[] = [];
  sessionMessages: ChatMessage[] = [];
  commonQuestions: any[] = [];
  
  // Analytics
  totalSessions: number = 0;
  totalMessages: number = 0;
  averageRating: number = 0;
  
  // Table columns
  displayedColumns: string[] = ['sessionId', 'startTime', 'messageCount', 'userId', 'actions'];
  feedbackColumns: string[] = ['sessionId', 'rating', 'timestamp', 'comment', 'actions'];
  
  // Selected session for viewing
  selectedSessionId: string | null = null;
  
  ngOnInit(): void {
    this.loadRecentSessions();
    this.loadFeedback();
    this.loadAnalytics();
  }
  
  async loadRecentSessions(): Promise<void> {
    try {
      // First get unique session IDs with their first message timestamp
      const messagesRef = collection(this.firestore, 'chatMessages');
      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      
      // Process to get session data
      const sessionsMap = new Map<string, any>();
      
      snapshot.docs.forEach(doc => {
        const message = doc.data() as ChatMessage;
        const sessionId = message.sessionId;
        
        if (!sessionsMap.has(sessionId)) {
          sessionsMap.set(sessionId, {
            sessionId,
            startTime: message.timestamp,
            messageCount: 1,
            userId: message.userId || null
          });
        } else {
          const session = sessionsMap.get(sessionId);
          session.messageCount++;
          
          // Track earliest message as start time
          if (message.timestamp < session.startTime) {
            session.startTime = message.timestamp;
          }
          
          // Set userId if available
          if (message.userId && !session.userId) {
            session.userId = message.userId;
          }
        }
      });
      
      this.recentSessions = Array.from(sessionsMap.values())
        .sort((a, b) => {
          // Sort by most recent first
          const timeA = a.startTime instanceof Timestamp ? a.startTime.toMillis() : a.startTime;
          const timeB = b.startTime instanceof Timestamp ? b.startTime.toMillis() : b.startTime;
          return timeB - timeA;
        })
        .slice(0, 20); // Just get the most recent 20
      
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }
  
  async loadFeedback(): Promise<void> {
    try {
      const feedbackRef = collection(this.firestore, 'chatFeedback');
      const q = query(
        feedbackRef,
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      this.feedbackItems = snapshot.docs.map(doc => doc.data() as ChatFeedback);
      
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  }
  
  async loadAnalytics(): Promise<void> {
    try {
      // Count total sessions (unique sessionIds)
      const messagesRef = collection(this.firestore, 'chatMessages');
      const messagesSnapshot = await getDocs(messagesRef);
      
      const sessions = new Set<string>();
      let totalMessages = 0;
      const userQuestions: Map<string, number> = new Map();
      
      messagesSnapshot.forEach(doc => {
        const message = doc.data() as ChatMessage;
        sessions.add(message.sessionId);
        totalMessages++;
        
        // Collect user questions for analysis
        if (message.isUser && message.content) {
          const normalizedQuestion = message.content.toLowerCase().trim();
          userQuestions.set(
            normalizedQuestion, 
            (userQuestions.get(normalizedQuestion) || 0) + 1
          );
        }
      });
      
      this.totalSessions = sessions.size;
      this.totalMessages = totalMessages;
      
      // Calculate average rating
      const feedbackRef = collection(this.firestore, 'chatFeedback');
      const feedbackSnapshot = await getDocs(feedbackRef);
      
      let totalRating = 0;
      let ratingCount = 0;
      
      feedbackSnapshot.forEach(doc => {
        const feedback = doc.data() as ChatFeedback;
        if (feedback.rating === 'helpful') {
          totalRating += 1;
        } else {
          totalRating += 0;
        }
        ratingCount++;
      });
      
      this.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
      
      // Process common questions
      this.commonQuestions = Array.from(userQuestions.entries())
        .map(([question, count]) => ({ question, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }
  
  async viewSession(sessionId: string): Promise<void> {
    this.selectedSessionId = sessionId;
    
    try {
      const messagesRef = collection(this.firestore, 'chatMessages');
      const q = query(
        messagesRef,
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'asc')
      );
      
      const snapshot = await getDocs(q);
      this.sessionMessages = snapshot.docs.map(doc => {
        const data = doc.data() as ChatMessage;
        return {
          ...data,
          id: doc.id
        };
      });
      
    } catch (error) {
      console.error('Error loading session messages:', error);
    }
  }
  
  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleString();
  }
}
```

## 8. Chat Translation Support

Enable multi-language support for chat messages:

```typescript
// src/app/core/services/chat.service.ts

// Add to ChatService
import { HttpClient } from '@angular/common/http';

// Add to ChatService class
private http = inject(HttpClient);

// Add translation method
async translateMessage(messageId: string, targetLanguage: string): Promise<void> {
  try {
    const messageRef = doc(this.firestore, 'chatMessages', messageId);
    const messageSnap = await getDoc(messageRef);
    
    if (!messageSnap.exists()) {
      throw new Error('Message not found');
    }
    
    const message = messageSnap.data() as ChatMessage;
    
    // For a production app, you would use a translation API like Google Translate
    // This is a simplified example that calls a cloud function
    
    // Option 1: Using Firebase Functions
    /*
    const translateFn = httpsCallable(this.functions, 'translateText');
    const result = await translateFn({
      text: message.content,
      targetLanguage
    });
    
    const translatedText = result.data.translatedText;
    */
    
    // Option 2: For demo purposes, just append the target language
    const translatedText = `${message.content} [Translated to ${targetLanguage}]`;
    
    // Create a new message with the translation
    const translatedMessage: ChatMessage = {
      content: translatedText,
      timestamp: Timestamp.now(),
      isUser: message.isUser,
      userId: message.userId,
      sessionId: this.sessionId,
      read: true,
      originalMessageId: messageId,
      translatedFrom: message.content,
      language: targetLanguage
    };
    
    await addDoc(collection(this.firestore, 'chatMessages'), translatedMessage);
    
  } catch (error) {
    console.error('Error translating message:', error);
    throw error;
  }
}
```

Update the ChatMessage interface:

```typescript
export interface ChatMessage {
  // ... existing fields
  originalMessageId?: string; // Reference to the original message if this is a translation
  translatedFrom?: string; // Original content before translation
  language?: string; // Language code
}
```

Add translation options to the UI:

```typescript
// Add to ChatbotComponent template
<div class="message-container" [class.user-message]="message.isUser" [class.bot-message]="!message.isUser">
  <div class="message">
    {{ message.content }}
    
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
    
    // Other buttons...
  </div>
  
  @if (message.translatedFrom) {
    <div class="message-translation-info">
      Translated from: {{ message.translatedFrom }}
    </div>
  }
  
  <div class="message-time">
    {{ formatTimestamp(message.timestamp) }}
  </div>
</div>
```

Add translation method to the component:

```typescript
// Add to ChatbotComponent class
async translateMessage(messageId: string, language: string): Promise<void> {
  try {
    await this.chatService.translateMessage(messageId, language);
  } catch (error) {
    console.error('Error translating message:', error);
  }
}
```

Add styles for translation:

```css
// Add to component styles
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
```

## 9. Voice Input

Add voice input capability to the chatbot:

```typescript
// src/app/shared/components/chatbot.component.ts

// Add to ChatbotComponent template, in the chat-input div
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

// Add to ChatbotComponent class
isRecording = signal<boolean>(false);
private mediaRecorder: MediaRecorder | null = null;
private audioChunks: Blob[] = [];

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
```

Add styles for the recording indicator:

```css
// Add to component styles
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
```

## 10. Chat Context Awareness

Enhance the chat service with context awareness capabilities:

```typescript
// src/app/core/services/chat.service.ts

// Add to ChatService class
private conversationContext: {
  topic?: string;
  recentEntities?: string[];
  lastQuestionAnswered?: boolean;
  conversationLength: number;
  userProfileInfo?: any;
} = {
  conversationLength: 0
};

// Update at the beginning of generateBotResponse
private async generateBotResponse(userMessage: string): Promise<void> {
  // Update conversation context
  this.updateConversationContext(userMessage);
  
  // Use context to enhance response
  let botResponse = '';
  let followUpQuestions: string[] = [];
  
  // ... existing code for response generation
  
  // Enhance response based on context
  if (this.conversationContext.topic) {
    // If we've identified a specific topic the user is interested in
    if (botResponse.includes('blog posts') || botResponse.includes('articles')) {
      botResponse += ` I see you're interested in ${this.conversationContext.topic}. `;
      
      // Add specific topic-related follow-up
      followUpQuestions.push(`Would you like to see the latest posts about ${this.conversationContext.topic}?`);
    }
  }
  
  // Add conversation-length based customization
  if (this.conversationContext.conversationLength > 5) {
    // Add more personalized responses for longer conversations
    botResponse = botResponse.replace('How can I help you?', 'How else can I assist you today?');
  }
  
  // Create the message with context-aware enhancements
  // ...
}

private updateConversationContext(userMessage: string): void {
  // Increment conversation length
  this.conversationContext.conversationLength++;
  
  // Analyze message for topic extraction
  const normalizedMsg = userMessage.toLowerCase();
  
  // Simple topic detection (would be more sophisticated in production)
  const topics = [
    'angular', 'react', 'vue', 'javascript', 'typescript',
    'css', 'html', 'web development', 'firebase', 'authentication',
    'database', 'cloud functions', 'hosting', 'performance', 'security'
  ];
  
  for (const topic of topics) {
    if (normalizedMsg.includes(topic)) {
      this.conversationContext.topic = topic;
      break;
    }
  }
  
  // Mark last question as answered
  this.conversationContext.lastQuestionAnswered = true;
  
  // Get user profile info if signed in
  const user = this.authService.currentUser();
  if (user) {
    this.conversationContext.userProfileInfo = {
      displayName: user.displayName,
      isAuthenticated: true
    };
  }
}
```

## Implementation Timeline

1. **Phase 1: Core Enhancements (2-3 days)**
   - Keyword-based smart responses
   - Suggested responses / quick replies
   - Typing indicators
   
2. **Phase 2: Content & UI Enhancements (2-3 days)**
   - Rich content support
   - Chat history persistence
   - Voice input capability
   
3. **Phase 3: Advanced Features (3-4 days)**
   - Analytics and feedback system
   - Admin dashboard
   - Chat translation support
   - Context awareness

## Conclusion

These enhancements will transform your basic chatbot into a sophisticated support tool for your blog. While implementing all features at once might be ambitious, you can prioritize based on what would provide the most value to your users.

The suggested approach allows for incremental implementation, where each feature builds on the previous ones. Start with the core enhancements to improve the basic user experience, then add more advanced features as needed.

Remember to thoroughly test each feature in isolation before integrating it into the main application, especially features requiring external services or APIs.