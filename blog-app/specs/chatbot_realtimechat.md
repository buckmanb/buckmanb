## Part 4: Real-Time Chat Viewing for Guests

Implement a feature that allows the chat owner to generate a shareable link for guests to view the chat conversation in real-time without participating.

### Step 1: Update the ChatbotComponent Template

Add a "Share Viewer Link" button in the chat header:

```html
<!-- In chatbot.component.html -->
<div class="chat-header">
  <h3>Chat Support</h3>
  <div class="chat-actions">
    <button mat-icon-button (click)="getViewerLink()" matTooltip="Get Viewer Link">
      <mat-icon>visibility</mat-icon>
    </button>
    <button mat-icon-button (click)="saveChatToBlog()" matTooltip="Save to Blog" *ngIf="authService.hasAuthorAccess()">
      <mat-icon>post_add</mat-icon>
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

### Step 2: Create the Chat Viewer Link Dialog Component

Create a new file `chat-viewer-link-dialog.component.ts` in the `shared/components` directory:

```typescript
import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Clipboard } from '@angular/cdk/clipboard';

export interface ChatViewerLinkDialogData {
  sessionId: string;
  baseUrl: string;
}

@Component({
  selector: 'app-chat-viewer-link-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <h2 mat-dialog-title>Real-Time Chat Viewer Link</h2>
    <div mat-dialog-content>
      <p>Share this link to allow guests to view this chat conversation in real-time:</p>
      
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Viewer Link</mat-label>
        <input matInput [value]="viewerLink" readonly #linkInput>
        <button mat-icon-button matSuffix (click)="copyToClipboard(linkInput.value)" matTooltip="Copy to clipboard">
          <mat-icon>content_copy</mat-icon>
        </button>
      </mat-form-field>
      
      <div class="info-box">
        <mat-icon color="primary">info</mat-icon>
        <span>Anyone with this link can view your chat conversation in real-time, but cannot send messages.</span>
      </div>
      
      <div class="qr-container" *ngIf="showQR">
        <h3>QR Code</h3>
        <div class="qr-code">
          <img [src]="qrCodeUrl" alt="QR Code for chat viewer">
        </div>
        <button mat-button color="primary" (click)="downloadQRCode()">
          <mat-icon>download</mat-icon> Download QR Code
        </button>
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="toggleQRCode()">
        {{ showQR ? 'Hide QR Code' : 'Show QR Code' }}
      </button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true" cdkFocusInitial>Done</button>
    </div>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    
    .info-box {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin: 16px 0;
      padding: 12px;
      background-color: rgba(33, 150, 243, 0.1);
      border-radius: 4px;
      font-size: 14px;
    }
    
    .qr-container {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--divider-color);
      text-align: center;
    }
    
    .qr-container h3 {
      margin-top: 0;
      font-size: 16px;
      font-weight: 500;
    }
    
    .qr-code {
      margin: 16px 0;
      display: flex;
      justify-content: center;
    }
    
    .qr-code img {
      max-width: 200px;
      max-height: 200px;
      border: 1px solid var(--divider-color);
      padding: 8px;
      background-color: white;
    }
  `]
})
export class ChatViewerLinkDialogComponent {
  private clipboard = inject(Clipboard);
  private snackBar = inject(MatSnackBar);
  
  viewerLink: string = '';
  showQR: boolean = false;
  qrCodeUrl: string = '';
  
  constructor(
    public dialogRef: MatDialogRef<ChatViewerLinkDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ChatViewerLinkDialogData
  ) {
    this.generateViewerLink();
  }
  
  generateViewerLink(): void {
    // Create a unique token to identify this viewing session
    const viewToken = btoa(`${this.data.sessionId}-${Date.now()}`);
    
    // Construct the viewer link
    const params = new URLSearchParams();
    params.set('session', this.data.sessionId);
    params.set('mode', 'view');
    params.set('token', viewToken);
    
    this.viewerLink = `${this.data.baseUrl}/chat-viewer?${params.toString()}`;
  }
  
  toggleQRCode(): void {
    this.showQR = !this.showQR;
    if (this.showQR) {
      this.generateQRCode();
    }
  }
  
  generateQRCode(): void {
    // Generate QR code using Google Charts API
    const encodedUrl = encodeURIComponent(this.viewerLink);
    this.qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodedUrl}&choe=UTF-8`;
  }
  
  copyToClipboard(text: string): void {
    this.clipboard.copy(text);
    this.snackBar.open('Viewer link copied to clipboard', 'Dismiss', {
      duration: 3000
    });
  }
  
  downloadQRCode(): void {
    // Create an anchor element and trigger download
    const link = document.createElement('a');
    link.href = this.qrCodeUrl;
    link.download = 'chat-viewer-qr.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
```

### Step 3: Create a Read-Only Chat Viewer Component

Create a new file `chat-viewer.component.ts` in the `shared/components` directory:

```typescript
import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ChatService, ChatMessage } from '../../core/services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  template: `
    <div class="chat-viewer-container">
      <mat-card class="chat-viewer-card">
        <mat-card-header>
          <mat-card-title>
            <div class="view-header">
              <span>Live Chat Viewer</span>
              <div class="status-indicator" [class.active]="isConnected()">
                <span class="status-dot"></span>
                {{ isConnected() ? 'Connected' : 'Connecting...' }}
              </div>
            </div>
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <mat-progress-bar *ngIf="!isConnected()" mode="indeterminate"></mat-progress-bar>
          
          <div class="messages-container" #messagesContainer>
            <div *ngIf="messages().length === 0" class="empty-state">
              <mat-icon>chat</mat-icon>
              <p>Waiting for messages...</p>
            </div>
            
            <div *ngFor="let message of messages()" class="message-container" 
                [class.user-message]="message.isUser" 
                [class.bot-message]="!message.isUser"
                [class.system-message]="message.isSystemMessage">
              <div class="message">
                <div *ngIf="message.isSystemMessage" class="system-indicator">
                  <mat-icon>info</mat-icon>
                </div>
                {{ message.content }}
              </div>
              <div class="message-time">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>
        </mat-card-content>
        
        <mat-card-actions>
          <div class="viewer-info">
            <mat-icon>visibility</mat-icon>
            Read-only view • Messages update in real-time
          </div>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .chat-viewer-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
      height: 100%;
      box-sizing: border-box;
    }
    
    .chat-viewer-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .view-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      font-size: 14px;
      color: var(--text-secondary);
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--warn-color);
      margin-right: 8px;
    }
    
    .status-indicator.active .status-dot {
      background-color: var(--success-color);
    }
    
    .messages-container {
      padding: 16px;
      overflow-y: auto;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 60vh;
      min-height: 300px;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      opacity: 0.6;
    }
    
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
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
    
    .system-message {
      align-self: center;
      max-width: 90%;
    }
    
    .message {
      padding: 10px 15px;
      border-radius: 18px;
      word-break: break-word;
      background-color: var(--surface-color);
      position: relative;
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
    
    .system-message .message {
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      display: flex;
      align-items: center;
    }
    
    .system-indicator {
      margin-right: 8px;
    }
    
    .message-time {
      font-size: 11px;
      opacity: 0.7;
      margin-top: 4px;
      margin-left: 5px;
      margin-right: 5px;
    }
    
    .viewer-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);
      font-size: 14px;
      padding: 8px 16px;
    }
    
    mat-card-content {
      flex-grow: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class ChatViewerComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  private route = inject(ActivatedRoute);
  private chatService = inject(ChatService);
  
  messages = signal<ChatMessage[]>([]);
  isConnected = signal<boolean>(false);
  
  private subscriptions: Subscription[] = [];
  private sessionId: string | null = null;
  
  ngOnInit(): void {
    // Get session ID from URL params
    this.route.queryParams.subscribe(params => {
      this.sessionId = params['session'];
      const viewMode = params['mode'] === 'view';
      
      if (this.sessionId && viewMode) {
        this.connectToSession(this.sessionId);
      }
    });
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  connectToSession(sessionId: string): void {
    // Set up subscription to messages for read-only view
    this.subscriptions.push(
      this.chatService.connectToSessionAsViewer(sessionId).subscribe({
        next: (success) => {
          this.isConnected.set(success);
          
          if (success) {
            this.subscribeToMessages();
          }
        },
        error: (err) => {
          console.error('Error connecting to session:', err);
          this.isConnected.set(false);
        }
      })
    );
  }
  
  private subscribeToMessages(): void {
    this.subscriptions.push(
      this.chatService.messages$.subscribe(messages => {
        this.messages.set(messages);
        setTimeout(() => this.scrollToBottom(), 100);
      })
    );
  }
  
  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch(err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
  
  formatTime(timestamp: any): string {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  }
}
```

### Step 4: Add the getViewerLink Method to ChatbotComponent

Add a method to handle generating the viewer link in `chatbot.component.ts`:

```typescript
import { ChatViewerLinkDialogComponent } from './chat-viewer-link-dialog.component';
import { environment } from '../../../environments/environment';

export class ChatbotComponent implements OnInit, AfterViewInit {
  // Existing code...
  
  getViewerLink(): void {
    // Open the viewer link dialog
    this.dialog.open(ChatViewerLinkDialogComponent, {
      width: '500px',
      data: {
        sessionId: this.chatService.getSessionId(),
        baseUrl: environment.production ? window.location.origin : 'http://localhost:4200'
      }
    });
  }
}
```

### Step 5: Update the ChatService to Support View-Only Mode

Add methods to the `chat.service.ts` file to support view-only connections:

```typescript
// In chat.service.ts

// Add a method to get the current session ID
getSessionId(): string {
  return this.sessionId;
}

// Add a method to connect to a session as a viewer only
connectToSessionAsViewer(sessionId: string): Observable<boolean> {
  return new Observable<boolean>(observer => {
    try {
      // Store the original session ID so we can restore it later if needed
      const originalSessionId = this.sessionId;
      
      // Set to view the target session
      this.viewingSessionId = sessionId;
      
      // Subscribe to messages for this session in view-only mode
      const messagesRef = collection(this.firestore, 'chatMessages');
      const q = query(
        messagesRef,
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'asc')
      );

      // Set up real-time listener
      this.viewerUnsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => {
          return {
            id: doc.id,
            ...doc.data()
          } as ChatMessage;
        });
        
        this.messages$.next(messages);
      }, 
      (error) => {
        console.error('Error in real-time listener:', error);
        observer.next(false);
        observer.complete();
      });
      
      observer.next(true);
      observer.complete();
    } catch (error) {
      console.error('Error connecting to session as viewer:', error);
      observer.next(false);
      observer.complete();
    }
  });
}

// Store the viewing session ID
private viewingSessionId: string | null = null;

// Store the unsubscribe function for the viewer
private viewerUnsubscribe: (() => void) | null = null;

// Add cleanup method to stop viewing
stopViewing(): void {
  if (this.viewerUnsubscribe) {
    this.viewerUnsubscribe();
    this.viewerUnsubscribe = null;
  }
  
  this.viewingSessionId = null;
}
```

### Step 6: Add Chat Viewer Route to App Routes

Add a chat-viewer route to handle viewer links in the `app.routes.ts` file:

```typescript
// In app.routes.ts
{
  path: 'chat-viewer',
  loadComponent: () => import('./shared/components/chat-viewer.component')
    .then(m => m.ChatViewerComponent)
}
```

### Step 7: Create a Floating Viewer Status Component

Create a new component to show when someone is viewing the chat:

```typescript
// src/app/shared/components/viewer-status.component.ts
import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-viewer-status',
  standalone: true,
  imports: [
    CommonModule,
    MatBadgeModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="viewer-status" *ngIf="activeViewers > 0">
      <div class="viewer-badge" matTooltip="{{ activeViewers }} active {{ activeViewers === 1 ? 'viewer' : 'viewers' }}">
        <mat-icon matBadge="{{ activeViewers }}" matBadgeColor="accent">visibility</mat-icon>
      </div>
    </div>
  `,
  styles: [`
    .viewer-status {
      position: absolute;
      bottom: 16px;
      right: 16px;
      z-index: 10;
    }
    
    .viewer-badge {
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      border-radius: 20px;
      padding: 4px 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      cursor: pointer;
    }
    
    :host ::ng-deep .mat-badge-content {
      font-size: 10px;
      height: 16px;
      width: 16px;
      line-height: 16px;
    }
  `]
})
export class ViewerStatusComponent implements OnInit {
  private chatService = inject(ChatService);
  
  activeViewers: number = 0;
  
  ngOnInit(): void {
    this.chatService.activeViewers$.subscribe(count => {
      this.activeViewers = count;
    });
  }
}
```

### Step 8: Update ChatService to Track Viewers

Modify `chat.service.ts` to track active viewers:

```typescript
// In chat.service.ts

// Add a property to track active viewers
private activeViewersSubject = new BehaviorSubject<number>(0);
activeViewers$ = this.activeViewersSubject.asObservable();

// Add these imports
import { serverTimestamp, increment } from '@angular/fire/firestore';

// Add method to track viewers
private trackViewerActivity(sessionId: string, isActive: boolean): void {
  try {
    const viewersRef = doc(this.firestore, 'chatViewers', sessionId);
    
    if (isActive) {
      // Add this viewer
      const viewerId = `viewer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chat_viewer_id', viewerId);
      
      // Update viewers count and set this viewer's last active timestamp
      setDoc(viewersRef, {
        activeViewers: increment(1),
        lastUpdated: serverTimestamp(),
        [`viewers.${viewerId}`]: serverTimestamp()
      }, { merge: true });
      
      // Set up interval to update presence
      this.viewerActivityInterval = setInterval(() => {
        updateDoc(viewersRef, {
          lastUpdated: serverTimestamp(),
          [`viewers.${viewerId}`]: serverTimestamp()
        }).catch(err => console.error('Error updating viewer activity:', err));
      }, 30000); // Update every 30 seconds
      
      // Set up listener for viewer count
      this.viewersUnsubscribe = onSnapshot(viewersRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          this.activeViewersSubject.next(data['activeViewers'] || 0);
        }
      });
    } else {
      // Remove this viewer
      const viewerId = localStorage.getItem('chat_viewer_id');
      
      if (viewerId) {
        // Decrement the viewer count and remove this viewer's entry
        updateDoc(viewersRef, {
          activeViewers: increment(-1),
          [`viewers.${viewerId}`]: deleteField(),
          lastUpdated: serverTimestamp()
        }).catch(err => console.error('Error removing viewer:', err));
        
        localStorage.removeItem('chat_viewer_id');
      }
      
      // Clear interval and unsubscribe
      if (this.viewerActivityInterval) {
        clearInterval(this.viewerActivityInterval);
        this.viewerActivityInterval = null;
      }
      
      if (this.viewersUnsubscribe) {
        this.viewersUnsubscribe();
        this.viewersUnsubscribe = null;
      }
    }
  } catch (error) {
    console.error('Error tracking viewer activity:', error);
  }
}

// Add properties to store cleanup functions
private viewerActivityInterval: any = null;
private viewersUnsubscribe: (() => void) | null = null;

// Update the connectToSessionAsViewer method to track viewers
connectToSessionAsViewer(sessionId: string): Observable<boolean> {
  return new Observable<boolean>(observer => {
    try {
      // ... existing code ...
      
      // Track viewer activity
      this.trackViewerActivity(sessionId, true);
      
      observer.next(true);
      observer.complete();
    } catch (error) {
      // ... existing error handling ...
    }
  });
}

// Update the stopViewing method to clean up
stopViewing(): void {
  if (this.viewingSessionId) {
    // Stop tracking viewer activity
    this.trackViewerActivity(this.viewingSessionId, false);
  }
  
  // ... existing cleanup code ...
}
```

### Step 9: Add the ViewerStatus Component to ChatbotComponent

Update the `chatbot.component.html` to include the viewer status:

```html
<!-- In chatbot.component.html, add this right before the closing div of .chatbot-container -->
<app-viewer-status *ngIf="isOpen()"></app-viewer-status>
```

Also update the imports in `chatbot.component.ts`:

```typescript
// In chatbot.component.ts
import { ViewerStatusComponent } from './viewer-status.component';

@Component({
  // ...existing component metadata
  imports: [
    // ...existing imports
    ViewerStatusComponent
  ],
  // ...
})
```

### Step 10: Create Cloud Functions to Clean Up Inactive Viewers

Create a cloud function to periodically clean up inactive viewers (this should be added to your Firebase functions):

```typescript
// In Firebase functions
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Clean up inactive viewers every hour
exports.cleanupInactiveViewers = functions.pubsub.schedule('every 60 minutes').onRun(async (context) => {
  const db = admin.firestore();
  const cutoff = new Date();
  cutoff.setMinutes(cutoff.getMinutes() - 30); // Consider viewers inactive after 30 minutes
  
  try {
    const viewersRef = db.collection('chatViewers');
    const snapshot = await viewersRef.get();
    
    const batch = db.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      let activeCount = 0;
      const viewers = data.viewers || {};
      
      // Count active viewers and remove inactive ones
      Object.entries(viewers).forEach(([viewerId, timestamp]: [string, any]) => {
        const viewerTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        
        if (viewerTime < cutoff) {
          // Remove inactive viewer
          viewers[viewerId] = admin.firestore.FieldValue.delete();
        } else {
          // Count active viewer
          activeCount++;
        }
      });
      
      // Update the document with correct count and cleaned viewers
      batch.update(doc.ref, {
        activeViewers: activeCount,
        viewers: viewers,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      batchCount++;
      
      // Commit batch when it reaches maximum size
      if (batchCount >= 500) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
    
    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
    }
    
    return { result: 'Inactive viewers cleanup completed successfully.' };
  } catch (error) {
    console.error('Error cleaning up inactive viewers:', error);
    return { error: 'Failed to clean up inactive viewers.' };
  }
});
```

### Step 11: Update the Styling

Add some styles to make the viewer feature visually appealing:

```css
/* In chatbot.component.scss */
.chatbot-container {
  position: relative; /* Ensure the viewer status can be positioned absolutely */
}

/* Add a subtle visual indicator when someone is watching */
.being-viewed {
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.3);
  transition: box-shadow 0.3s ease;
}
```

## Implementation Steps Summary

1. **Chat Icon Toggle**:
   - Update the navbar to disable the chat button when chat is open
   - Add styles to maintain badge visibility when disabled

2. **Search Bar with Intellisense**:
   - Create SearchService for handling search queries
   - Implement SearchBarComponent with autocomplete
   - Add search to navbar for desktop
   - Create a search dialog for mobile

3. **Save Chat to Blog Feature**:
   - Add a "Save to Blog" button in the chat header
   - Create a dialog component for configuring the blog post
   - Implement the logic to convert chat history to blog content
   - Add authentication check to only show the button for users with author privileges
   - Style the new button to match the existing UI

4. **Real-Time Chat Viewing for Guests**:
   - Add a "Get Viewer Link" button in the chat header
   - Create a dialog component for generating and sharing the view-only link
   - Implement a read-only ChatViewerComponent that displays real-time updates
   - Enhance ChatService to track active viewers and handle view-only connections
   - Add a ViewerStatusComponent to show when people are watching the chat
   - Create a cloud function to clean up inactive viewers
   - Style the components to provide visual feedback about active viewers# Blog App Development Plan

## Part 1: Chat Icon Toggle Implementation

Currently, there's a chat button in the navbar that toggles the chat functionality. However, we need to refine it by disabling the button when the chat is open, while keeping it enabled when closed.

### Step 1: Update the Navbar Component

Enhance the existing `toggleChat` method in `navbar.component.ts`:

```typescript
toggleChat(): void {
  this.chatService.setChatOpen(!this.isChatOpen());
}
```

### Step 2: Update the Navbar Template

Modify the chat button in `navbar.component.html` to reflect the chat state:

```html
<button mat-icon-button
        (click)="toggleChat()"
        matTooltip="Chat Support"
        [disabled]="isChatOpen()"
        [matBadge]="unreadChatMessages() > 0 ? unreadChatMessages() : null"
        matBadgeColor="accent"
        class="chat-button">
  <mat-icon>chat</mat-icon>
</button>
```

### Step 3: Update CSS for Disabled State

Add styles to `navbar.component.css` to maintain badge visibility when the button is disabled:

```css
.chat-button.mat-button-disabled {
  opacity: 0.5;
}

/* Style to maintain badge visibility even when button is disabled */
.mat-button-disabled .mat-badge-content {
  opacity: 1;
}
```

## Part 2: Search Bar with Intellisense

Implement a search bar with autocomplete functionality that suggests relevant search indicators as the user types.

### Step 1: Create a Search Service

Create a new file `search.service.ts` in the `core/services` directory:

```typescript
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, orderBy, limit, getDocs } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { debounceTime, switchMap, map } from 'rxjs/operators';
import { BlogService } from './blog.service';

export interface SearchResult {
  id: string;
  title: string;
  type: 'post' | 'tag' | 'category' | 'author';
  subtitle?: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private firestore = inject(Firestore);
  private blogService = inject(BlogService);
  
  private searchTerms = new BehaviorSubject<string>('');
  searchResults$ = this.searchTerms.pipe(
    debounceTime(300),
    switchMap(term => this.search(term))
  );
  
  updateSearchTerm(term: string): void {
    this.searchTerms.next(term);
  }
  
  async search(term: string): Promise<SearchResult[]> {
    if (!term || term.length < 2) {
      return [];
    }
    
    try {
      // Search blog posts
      const postsRef = collection(this.firestore, 'posts');
      const q = query(
        postsRef,
        where('status', '==', 'published'),
        orderBy('title'),
        limit(5)
      );
      
      const snapshot = await getDocs(q);
      const results: SearchResult[] = [];
      
      snapshot.forEach(doc => {
        const post = doc.data();
        const title = post['title'] || '';
        
        // Only include if title matches search term
        if (title.toLowerCase().includes(term.toLowerCase())) {
          results.push({
            id: doc.id,
            title: title,
            type: 'post',
            subtitle: post['excerpt'] || '',
            imageUrl: post['imageUrl'] || ''
          });
        }
      });
      
      // Additional searches for tags, categories, or authors could be added here
      
      return results;
    } catch (error) {
      console.error('Error searching:', error);
      return [];
    }
  }
  
  getPopularSearchTerms(): string[] {
    // This could be dynamically loaded from analytics in a real app
    return [
      'Angular', 
      'Firebase', 
      'Authentication', 
      'Material Design',
      'State Management'
    ];
  }
}
```

### Step 2: Create the Search Component

Create a new file `search-bar.component.ts` in the `shared/components` directory:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, distinctUntilChanged, Observable } from 'rxjs';
import { SearchService, SearchResult } from '../../core/services/search.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="search-container">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search</mat-label>
        <input 
          matInput 
          [(ngModel)]="searchTerm" 
          (ngModelChange)="onSearchChange($event)"
          [matAutocomplete]="auto"
          placeholder="Search posts, tags, authors...">
        <mat-icon matSuffix>search</mat-icon>
        <button 
          *ngIf="searchTerm" 
          matSuffix 
          mat-icon-button 
          aria-label="Clear" 
          (click)="clearSearch()">
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>
      
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onOptionSelected($event)">
        <mat-option *ngIf="isSearching" class="searching-option">
          <mat-icon class="searching-icon">hourglass_empty</mat-icon>
          Searching...
        </mat-option>
        
        <ng-container *ngIf="!isSearching">
          <mat-option 
            *ngFor="let result of searchResults" 
            [value]="result.title"
            [routerLink]="getRouterLink(result)">
            <div class="search-result-item">
              <div class="search-result-icon" [ngClass]="result.type">
                <mat-icon>{{ getIconForType(result.type) }}</mat-icon>
              </div>
              <div class="search-result-content">
                <div class="search-result-title">{{ result.title }}</div>
                <div class="search-result-subtitle" *ngIf="result.subtitle">
                  {{ result.subtitle }}
                </div>
              </div>
            </div>
          </mat-option>
          
          <mat-option 
            *ngIf="searchTerm && searchResults.length === 0" 
            [disabled]="true"
            class="no-results-option">
            No results found
          </mat-option>
          
          <mat-option *ngIf="!searchTerm" [disabled]="true" class="popular-searches-label">
            Popular searches
          </mat-option>
          
          <mat-option 
            *ngIf="!searchTerm"
            *ngFor="let term of popularSearchTerms" 
            [value]="term"
            class="popular-search-option">
            <mat-icon>trending_up</mat-icon>
            {{ term }}
          </mat-option>
        </ng-container>
      </mat-autocomplete>
    </div>
  `,
  styles: [`
    .search-container {
      width: 300px;
      transition: width 0.3s ease;
    }
    
    .search-field {
      width: 100%;
    }
    
    .search-container:focus-within {
      width: 350px;
    }
    
    .search-result-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .search-result-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--primary-color);
      color: white;
    }
    
    .search-result-icon.post {
      background-color: var(--primary-color);
    }
    
    .search-result-icon.tag {
      background-color: var(--accent-color);
    }
    
    .search-result-icon.category {
      background-color: var(--warn-color);
    }
    
    .search-result-icon.author {
      background-color: var(--success-color);
    }
    
    .search-result-content {
      display: flex;
      flex-direction: column;
    }
    
    .search-result-title {
      font-weight: 500;
    }
    
    .search-result-subtitle {
      font-size: 12px;
      opacity: 0.7;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 250px;
    }
    
    .searching-option {
      display: flex;
      align-items: center;
    }
    
    .searching-icon {
      margin-right: 8px;
      animation: rotate 1.5s linear infinite;
    }
    
    .no-results-option {
      color: var(--text-secondary);
      font-style: italic;
    }
    
    .popular-searches-label {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
    }
    
    .popular-search-option mat-icon {
      margin-right: 8px;
      font-size: 16px;
      height: 16px;
      width: 16px;
    }
    
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class SearchBarComponent implements OnInit {
  private searchService = inject(SearchService);
  private router = inject(Router);
  
  searchTerm: string = '';
  searchResults: SearchResult[] = [];
  isSearching: boolean = false;
  popularSearchTerms: string[] = [];
  
  ngOnInit() {
    this.popularSearchTerms = this.searchService.getPopularSearchTerms();
    
    this.searchService.searchResults$.subscribe(results => {
      this.searchResults = results;
      this.isSearching = false;
    });
  }
  
  onSearchChange(term: string) {
    if (term && term.length >= 2) {
      this.isSearching = true;
    }
    this.searchService.updateSearchTerm(term);
  }
  
  clearSearch() {
    this.searchTerm = '';
    this.searchResults = [];
  }
  
  onOptionSelected(event: any) {
    // If selecting a popular search term, search with it
    if (this.popularSearchTerms.includes(event.option.value)) {
      this.searchTerm = event.option.value;
      this.searchService.updateSearchTerm(this.searchTerm);
    }
  }
  
  getIconForType(type: string): string {
    switch (type) {
      case 'post': return 'article';
      case 'tag': return 'tag';
      case 'category': return 'category';
      case 'author': return 'person';
      default: return 'search';
    }
  }
  
  getRouterLink(result: SearchResult): string[] {
    switch (result.type) {
      case 'post': return ['/blog', result.id];
      case 'tag': return ['/blog/tag', result.id];
      case 'category': return ['/blog/category', result.id];
      case 'author': return ['/author', result.id];
      default: return ['/'];
    }
  }
}
```

### Step 3: Add the Search Bar to the Navbar

Update the navbar component template to include the search bar:

```html
<!-- In navbar.component.html, add this right after the links and before the theme toggle -->
<div class="spacer"></div> <!-- This pushes everything after it to the right -->

<app-search-bar class="navbar-search"></app-search-bar>

<app-theme-toggle></app-theme-toggle>
```

Update the imports in `navbar.component.ts`:

```typescript
// In navbar.component.ts
import { SearchBarComponent } from '../shared/components/search-bar.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  // ...existing component metadata
  imports: [
    // ...existing imports
    SearchBarComponent
  ],
  // ...
})
export class NavbarComponent {
  // Add MatDialog as a dependency
  private dialog = inject(MatDialog);
  
  // ... existing properties and methods
}
```

Add some styling to the navbar for the search bar:

```css
/* In navbar.component.css */
.navbar-search {
  margin-right: 16px;
}

@media (max-width: 1024px) {
  .navbar-search {
    display: none; /* Hide search on smaller screens */
  }
}
```

### Step 4: Add Search to Mobile Menu

For mobile users, add the search entry to the mobile menu:

```html
<!-- In navbar.component.html, add this to the mobile menu -->
<button mat-menu-item (click)="openMobileSearch()">
  <mat-icon>search</mat-icon>
  <span>Search</span>
</button>
```

Add the openMobileSearch method to `navbar.component.ts`:

```typescript
// In navbar.component.ts
openMobileSearch(): void {
  // Use MatDialog to open the search in a dialog for mobile
  this.dialog.open(SearchDialogComponent, {
    width: '100%',
    maxWidth: '600px',
    panelClass: 'search-dialog'
  });
}
```

### Step 5: Create a Mobile Search Dialog

Create a new file `search-dialog.component.ts` in the `shared/components` directory:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { SearchBarComponent } from './search-bar.component';

@Component({
  selector: 'app-search-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    SearchBarComponent
  ],
  template: `
    <h2 mat-dialog-title>Search</h2>
    <div mat-dialog-content>
      <app-search-bar class="full-width"></app-search-bar>
    </div>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    
    ::ng-deep .mat-mdc-form-field {
      width: 100%;
    }
  `]
})
export class SearchDialogComponent {}
```

## Part 3: Save Chat History to Blog Post Feature

Implement a feature that allows users to save their current chat history as a new blog post.

### Step 1: Update the ChatbotComponent Template

Add a "Save to Blog" button in the chat header:

```html
<!-- In chatbot.component.html -->
<div class="chat-header">
  <h3>Chat Support</h3>
  <div class="chat-actions">
    <button mat-icon-button (click)="saveChatToBlog()" matTooltip="Save to Blog" *ngIf="authService.hasAuthorAccess()">
      <mat-icon>post_add</mat-icon>
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

### Step 2: Create the Save to Blog Dialog Component

Create a new file `save-chat-dialog.component.ts` in the `shared/components` directory:

```typescript
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
  template: `
    <h2 mat-dialog-title>Save Chat as Blog Post</h2>
    <form [formGroup]="blogForm" (ngSubmit)="onSubmit()">
      <div mat-dialog-content>
        <p>Create a new blog post from this chat conversation.</p>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Blog Title</mat-label>
          <input matInput formControlName="title" placeholder="Enter a title for your blog post">
          <mat-error *ngIf="blogForm.get('title')?.hasError('required')">
            Title is required
          </mat-error>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Excerpt</mat-label>
          <textarea matInput formControlName="excerpt" placeholder="Enter a short excerpt or summary" rows="3"></textarea>
          <mat-error *ngIf="blogForm.get('excerpt')?.hasError('required')">
            Excerpt is required
          </mat-error>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tags (comma separated)</mat-label>
          <input matInput formControlName="tags" placeholder="chat, ai, support">
        </mat-form-field>
        
        <div class="options-section">
          <h3>Format Options</h3>
          
          <mat-checkbox formControlName="includeTimestamps">
            Include message timestamps
          </mat-checkbox>
          
          <mat-checkbox formControlName="includeUserInfo">
            Include user information
          </mat-checkbox>
        </div>
        
        <div class="preview-section">
          <h3>Preview</h3>
          <div class="preview-container">
            <p class="message-count">
              Converting {{ data.messages.length }} messages to blog format.
            </p>
            
            <div class="message-preview" *ngFor="let message of previewMessages; let i = index">
              <strong>{{ message.isUser ? 'You' : 'Assistant' }}:</strong> {{ message.content | slice:0:100 }}{{ message.content.length > 100 ? '...' : '' }}
            </div>
          </div>
        </div>
      </div>
      
      <div mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="blogForm.invalid">
          Create Blog Post
        </button>
      </div>
    </form>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    
    .options-section {
      margin: 16px 0;
    }
    
    .options-section h3 {
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
    }
    
    mat-checkbox {
      display: block;
      margin-bottom: 8px;
    }
    
    .preview-section {
      margin: 16px 0;
      padding: 16px;
      background-color: var(--surface-color);
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .preview-section h3 {
      margin-top: 0;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
    }
    
    .message-count {
      font-style: italic;
      margin-bottom: 16px;
      font-size: 12px;
    }
    
    .message-preview {
      margin-bottom: 8px;
      font-size: 12px;
    }
  `]
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
```

### Step 3: Add the saveChatToBlog Method to ChatbotComponent

Add the method to handle saving chat to blog in `chatbot.component.ts`:

```typescript
import { MatDialog } from '@angular/material/dialog';
import { SaveChatDialogComponent } from './save-chat-dialog.component';
import { BlogService } from '../../core/services/blog.service';

export class ChatbotComponent implements OnInit, AfterViewInit {
  // Add these injections
  private dialog = inject(MatDialog);
  private blogService = inject(BlogService);
  
  // Existing code...
  
  saveChatToBlog(): void {
    const dialogRef = this.dialog.open(SaveChatDialogComponent, {
      width: '600px',
      data: { messages: this.messages() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createBlogPostFromChat(result);
      }
    });
  }

  private async createBlogPostFromChat(blogData: any): Promise<void> {
    try {
      this.isThinking.set(true);
      
      // Format chat messages as markdown or HTML
      const content = this.formatChatContent(
        this.messages(), 
        blogData.includeTimestamps,
        blogData.includeUserInfo
      );
      
      // Create the blog post object
      const blogPost = {
        title: blogData.title,
        content: content,
        excerpt: blogData.excerpt,
        tags: blogData.tags,
        status: 'draft', // Default to draft so user can review before publishing
        source: 'chat',
        createdAt: new Date(),
      };
      
      // Save the blog post
      const postId = await this.blogService.createPost(blogPost);
      
      // Show success message
      this.snackBar.open('Chat saved as blog post draft', 'Edit Post', {
        duration: 5000
      }).onAction().subscribe(() => {
        // Navigate to edit page when action button clicked
        this.router.navigate(['/blog', postId, 'edit']);
      });
    } catch (error) {
      console.error('Error creating blog post from chat:', error);
      this.errorService.showError('Failed to save chat as blog post');
    } finally {
      this.isThinking.set(false);
    }
  }
  
  private formatChatContent(messages: ChatMessage[], includeTimestamps: boolean, includeUserInfo: boolean): string {
    let content = '# Chat Conversation\n\n';
    
    messages.forEach(message => {
      if (message.isTyping) return; // Skip typing indicators
      
      const sender = message.isUser ? 'User' : 'Assistant';
      let messageContent = message.content;
      
      // Format message
      content += `## ${sender}\n\n`;
      
      if (includeTimestamps && message.timestamp) {
        const timestamp = message.timestamp instanceof Date 
          ? message.timestamp 
          : message.timestamp.toDate?.() || new Date(message.timestamp);
        
        content += `*${timestamp.toLocaleString()}*\n\n`;
      }
      
      if (includeUserInfo && message.userId && !message.isUser) {
        content += `*Response to user ${message.userId}*\n\n`;
      }
      
      content += `${messageContent}\n\n---\n\n`;
    });
    
    return content;
  }
}
```

### Step 4: Update ChatbotComponent Imports

Update the imports in the `chatbot.component.ts` file:

```typescript
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SaveChatDialogComponent } from './save-chat-dialog.component';
import { BlogService } from '../../core/services/blog.service';
import { ErrorService } from '../../core/services/error.service';
```

### Step 5: Add hasAuthorAccess Method to Auth Service

In `auth.service.ts`, add a method to check if the user has author or admin privileges:

```typescript
// In auth.service.ts
hasAuthorAccess(): boolean {
  const user = this.currentUser();
  const profile = this.profile();
  
  if (!user || !profile) {
    return false;
  }
  
  return ['author', 'admin'].includes(profile.role);
}
```

### Step 6: Styling Updates for the Chat Header Button

Add styles to `chatbot.component.scss` (or .css) for the new button:

```css
.chat-actions {
  display: flex;
  gap: 4px;
}

.chat-actions button {
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.chat-actions button:hover {
  opacity: 1;
}
```

## Implementation Steps Summary

1. **Chat Icon Toggle**:
   - Update the navbar to disable the chat button when chat is open
   - Add styles to maintain badge visibility when disabled

2. **Search Bar with Intellisense**:
   - Create SearchService for handling search queries
   - Implement SearchBarComponent with autocomplete
   - Add search to navbar for desktop
   - Create a search dialog for mobile

3. **Save Chat to Blog Feature**:
   - Add a "Save to Blog" button in the chat header
   - Create a dialog component for configuring the blog post
   - Implement the logic to convert chat history to blog content
   - Add authentication check to only show the button for users with author privileges
   - Style the new button to match the existing UI

4. **Integration**:
   - Update imports in the application module/components
   - Add routing for search results and blog post creation
   - Test the implementation thoroughly

## Testing Plan

1. Test the chat icon toggle:
   - Verify the button is enabled when chat is closed
   - Verify the button is disabled when chat is open
   - Ensure the unread message badge remains visible even when disabled

2. Test the search functionality:
   - Verify search results appear as you type
   - Confirm popular search terms show up when no search is active
   - Test that clicking a result navigates to the correct page
   - Ensure the mobile search dialog works properly on smaller screens

3. Test the save chat to blog feature:
   - Verify the "Save to Blog" button only appears for users with author/admin privileges
   - Test the dialog form validation (required fields)
   - Confirm the preview displays messages correctly
   - Verify the created blog post contains properly formatted chat content
   - Test different format options (with/without timestamps, user info)
   - Ensure navigation to edit page works when clicking "Edit Post" in the snackbar