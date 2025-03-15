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
  followUpQuestions?: string[]; // New field
  isTyping?: boolean; // New field for typing indicators
}

interface BotResponse {
  keywords: string[];
  response: string;
  followUpQuestions?: string[];
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
      response: 'You can contact us through our contact form or email directly at info@example.com',
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

  private conversationContext: {
    topic?: string;
    recentEntities?: string[];
    lastQuestionAnswered?: boolean;
    conversationLength: number;
    userProfileInfo?: any;
  } = {
    conversationLength: 0
  };

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

  private typingTimeoutId: any = null;

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

  private async generateBotResponse(userMessage: string): Promise<void> {
    // Update conversation context
    this.updateConversationContext(userMessage);

    // Use context to enhance response
    let botResponse = '';
    let followUpQuestions: string[] = [];

    // Analyze message for topic extraction
    const normalizedMsg = userMessage.toLowerCase();

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

  clearChat(): void {
    // Generate a new session ID to start fresh
    this.sessionId = this.generateSessionId();
    localStorage.setItem('chat_session_id', this.sessionId);

    // Re-subscribe with new session ID
    this.subscribeToMessages();
    
    // Reset conversation context
    this.resetConversationContext();
  }
  
  private resetConversationContext(): void {
    this.conversationContext = {
      conversationLength: 0
    };
  }
  
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
}
