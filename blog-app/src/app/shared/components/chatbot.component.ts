import { Component, Input, Output, EventEmitter, inject, signal, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
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

  isOpen = signal(false);
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
