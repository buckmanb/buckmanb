import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Firestore, collection, addDoc, query, orderBy, limit, onSnapshot, Timestamp, where, getDocs, updateDoc, doc, getDoc, deleteDoc } from '@angular/fire/firestore';
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

  async deleteMessage(messageId: string): Promise<void> {
    try {
      const user = this.authService.currentUser();
      
      // Get the message first to check permissions
      const messageRef = doc(this.firestore, 'chatMessages', messageId);
      const messageSnap = await getDoc(messageRef);
      
      if (!messageSnap.exists()) {
        throw new Error('Message not found');
      }
      
      const message = messageSnap.data() as ChatMessage;
      
      // Only allow users to delete their own messages
      if (message.isUser && user?.uid === message.userId) {
        await deleteDoc(messageRef);
      } else {
        throw new Error('You can only delete your own messages');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  clearChat(): void {
    // Generate a new session ID to start fresh
    this.sessionId = this.generateSessionId();
    localStorage.setItem('chat_session_id', this.sessionId);

    // Re-subscribe with new session ID
    this.subscribeToMessages();
  }
}
