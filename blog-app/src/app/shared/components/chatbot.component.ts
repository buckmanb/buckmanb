import { Component, Input, Output, EventEmitter, inject, signal, OnInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../core/services/chat.service';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';
import { ChatHistoryDialogComponent } from './chat-history-dialog.component';
import { SaveChatDialogComponent } from './save-chat-dialog.component';
import { BlogService } from '../../core/services/blog.service';
import { ErrorService } from '../../core/services/error.service';

// Declare the SpeechRecognition interface
declare var SpeechRecognition: any;
declare var webkitSpeechRecognition: any;

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    MatMenuModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ChatHistoryDialogComponent
  ],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit, OnDestroy {
  @Input() blogPostId?: string;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @ViewChild('chatMessagesContainer') private chatMessagesContainer!: ElementRef;

  isOpen = signal(true);
  messages = signal<ChatMessage[]>([]);
  newMessage = '';
  isRecording = signal<boolean>(false);
  lastBotMessage = signal<ChatMessage | null>(null);
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private dialog = inject(MatDialog);
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private ngZone = inject(NgZone); // Inject NgZone
  private blogService = inject(BlogService);
  private errorService = inject(ErrorService);

  recognition: any; // SpeechRecognition instance

  constructor() { }

  ngOnInit(): void {
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

  ngOnDestroy(): void {
    this.stopRecording(); // Ensure recording is stopped when component is destroyed
    if (this.recognition) {
      this.recognition.stop(); // Stop speech recognition if running
    }
  }

  toggleChat(): void {
    this.isOpen.update(value => !value);
    this.chatService.setChatOpen(this.isOpen());
    this.isOpenChange.emit(this.isOpen());

    // Track open/close events
    this.chatService.trackEvent(
      this.isOpen() ? 'chat_opened' : 'chat_closed'
    );

    if (this.isOpen()) {
      setTimeout(() => this.scrollToBottom(), 300);
    }
  }

  clearChat(): void {
    this.chatService.clearChat();
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      if (this.isRecording()) {
        this.stopRecording(); // Stop recording if send button is pressed
      }
      this.chatService.sendMessage(this.newMessage);
      this.newMessage = ''; // Clear input after sending
    }
  }

  deleteMessage(messageId: string | undefined): void {
    if (messageId) {
      this.chatService.deleteMessage(messageId);
    }
  }

  formatTimestamp(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  scrollToBottom(): void {
    if (this.chatMessagesContainer) {
      try {
        this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
      } catch(err) { }
    }
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

  sendSuggestion(suggestion: string): void {
    this.newMessage = suggestion;
    this.sendMessage();
  }

  async translateMessage(messageId: string, language: string): Promise<void> {
    try {
      await this.chatService.translateMessage(messageId, language);
    } catch (error) {
      console.error('Error translating message:', error);
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

  navigateToBlog(blogId?: string): void {
    if (!blogId) return;

    this.router.navigate(['/blog', blogId]);
    this.toggleChat(); // Close the chat window
  }

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


  async toggleVoiceInput(): Promise<void> {
    if (this.isRecording()) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording(): Promise<void> {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionConstructor: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; // Explicitly cast to any
      if (SpeechRecognitionConstructor) {
        // Create a fresh SpeechRecognition object every time
        this.recognition = new SpeechRecognitionConstructor();
        this.recognition.lang = 'en-US'; // Set language
        this.recognition.interimResults = false; // Get final results only
        this.recognition.maxAlternatives = 1; // Get single best result

        this.recognition.onstart = () => {
          this.isRecording.set(true);
          this.newMessage = 'Listening...'; // Update input to indicate listening
        };

        this.recognition.onspeechstart = () => {
          this.newMessage = 'Listening (recording)...'; // Update input to indicate recording
        };

        // REMOVE onspeechend handler to prevent premature stop
        // this.recognition.onspeechend = () => {
        //   this.stopRecognition(); // Stop recognition after speech ends
        // };

        this.recognition.onerror = (event: any) => {
          this.isRecording.set(false);
          this.newMessage = ''; // Clear "Listening..." message
          let errorMessage = 'Voice recognition error';
          if (event.error === 'not-allowed') {
            errorMessage = 'Microphone access denied. Please check your browser settings. Go to settings and allow microphone access for this site.';
          } else if (event.error === 'no-speech') {
            errorMessage = 'No speech detected. Please try again.';
          } else if (event.error === 'audio-capture') {
            errorMessage = 'Could not access microphone. Make sure a microphone is connected and working.';
          } else if (event.error === 'network') {
            errorMessage = 'Network error occurred. Please check your internet connection.';
          } else {
            errorMessage = `Voice recognition error: ${event.error}`; // General error message
          }
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          console.error('Speech recognition error:', event.error, event); // Log full error event for debugging
        };

        this.recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          this.ngZone.run(() => { // Run inside NgZone for Angular change detection
            this.newMessage = transcript;
          });
        };

        try {
          // Check for microphone permissions before starting
          navigator.permissions.query({ name: 'microphone' as PermissionName }).then(permissionStatus => {
            if (permissionStatus.state === 'granted') {
              this.recognition.start(); // Start recognition if permission is already granted
            } else if (permissionStatus.state === 'prompt') {
              // Start recognition which will prompt for permission
              this.recognition.start();
            } else if (permissionStatus.state === 'denied') {
              this.isRecording.set(false);
              this.newMessage = '';
              this.snackBar.open('Microphone access denied. Please check your browser settings and allow microphone access for this site.', 'Close', { duration: 5000 });
            }
          });


        } catch (error) {
          this.isRecording.set(false);
          this.newMessage = '';
          this.snackBar.open('Error starting voice recognition.', 'Close', { duration: 5000 });
          console.error('Error starting speech recognition:', error);
        }
      } else {
        this.snackBar.open('Voice input not supported in this browser.', 'Close', { duration: 5000 });
      }


    } else {
      this.snackBar.open('Voice input not supported in this browser.', 'Close', { duration: 5000 });
    }
  }


  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording()) {
      this.mediaRecorder.stop();
      this.isRecording.set(false);
    }
    this.stopRecognition();
  }

  stopRecognition(): void {
    if (this.recognition && this.isRecording()) {
      this.recognition.stop();
      this.isRecording.set(false);
      this.newMessage = ''; // Clear "Listening..." message if recognition is stopped manually
    }
  }


  async processAudioToText(): Promise<void> {
    // This function is now deprecated as we are using Web Speech API directly
    // You can remove this function if it's no longer needed
  }
}
