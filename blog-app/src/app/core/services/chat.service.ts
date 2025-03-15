import { Injectable, inject, NgZone } from '@angular/core';
import { Firestore, collection, addDoc, doc, onSnapshot, query, orderBy, limit, Timestamp, collectionGroup, where, getDocs, deleteDoc, getDoc, updateDoc, writeBatch } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { HttpClient } from '@angular/common/http';
import { BlogService, BlogPost } from './blog.service';

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
  contentType?: MessageContentType;
  links?: MessageLink[];
  blogPreview?: BlogPreview;
  originalMessageId?: string; // Reference to the original message if this is a translation
  translatedFrom?: string; // Original content before translation
  language?: string; // Language code
}

export interface ChatFeedback {
  sessionId: string;
  messageId: string;
  userId?: string;
  rating: 'helpful' | 'not_helpful';
  comment?: string;
  timestamp: Date | Timestamp;
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
  private ngZone = inject(NgZone);
  private authService = inject(AuthService);
  private functions = inject(Functions);
  private http = inject(HttpClient);
  private blogService = inject(BlogService);
  private router = inject(Router);

  // Added Observable properties for chat open state and unread count
  private chatOpenSubject = new BehaviorSubject<boolean>(false);
  chatOpen$ = this.chatOpenSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private chatOpen = false;
  private sessionId: string;

  messages$ = new BehaviorSubject<ChatMessage[]>([]);
  private typingTimeoutId: any = null;
  private conversationContext: {
    topic?: string;
    recentEntities?: string[];
    lastQuestionAnswered?: boolean;
    conversationLength: number;
    userProfileInfo?: any;
  } = {
    conversationLength: 0
  };
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


  constructor() {
    this.sessionId = localStorage.getItem('chat_session_id') || this.generateSessionId();
    localStorage.setItem('chat_session_id', this.sessionId);
    this.subscribeToMessages();
  }

  setChatOpen(isOpen: boolean) {
    this.chatOpen = isOpen;
    this.chatOpenSubject.next(isOpen);
    if (isOpen) {
      this.markAllMessagesAsRead();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private subscribeToMessages() {
    if (!this.sessionId) return;
    const messagesRef = collection(this.firestore, 'chatMessages');
    const q = query(messagesRef, where('sessionId', '==', this.sessionId), orderBy('timestamp', 'asc'), limit(50));

    onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        return {
          id: doc.id,
          ...doc.data()
        } as ChatMessage;
      });
      this.messages$.next(messages);

      // Update unread message count
      const unreadCount = messages.filter(msg => !msg.isUser && !msg.read).length;
      this.unreadCountSubject.next(unreadCount);

      // Mark bot messages as read when chat is opened
      if (this.chatOpen) {
        this.markAllMessagesAsRead();
      }
    });
  }

  private markAllMessagesAsRead() {
    const messagesRef = collection(this.firestore, 'chatMessages');
    const q = query(messagesRef, where('sessionId', '==', this.sessionId), where('isUser', '==', false), where('read', '==', false));

    getDocs(q).then(snapshot => {
      snapshot.forEach(doc => {
        this.updateMessageReadStatus(doc.id, true);
      });
      
      // Update the unread count after marking messages as read
      this.updateUnreadCount();
    });
  }

  private updateUnreadCount(): void {
    if (!this.sessionId) return;
    
    const messagesRef = collection(this.firestore, 'chatMessages');
    const q = query(
      messagesRef, 
      where('sessionId', '==', this.sessionId),
      where('isUser', '==', false),
      where('read', '==', false)
    );
    
    getDocs(q).then(snapshot => {
      const count = snapshot.docs.length;
      this.unreadCountSubject.next(count);
    });
  }

  private async updateMessageReadStatus(messageId: string, read: boolean): Promise<void> {
    const messageRef = doc(this.firestore, 'chatMessages', messageId);
    try {
      await getDoc(messageRef); // Just to check if it exists
      await doc(this.firestore, 'chatMessages', messageId);
      await getDoc(messageRef); // Verify document still exists after update
      await updateDoc(messageRef, { read: read });
    } catch (error) {
      console.error('Error updating message read status:', error);
    }
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
      read: true
    };

    // Add to Firestore
    await addDoc(collection(this.firestore, 'chatMessages'), message);

    // Track messaging event
    this.trackEvent('message_sent', { length: content.length });

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

  async clearChat(): Promise<void> {
    try {
      const messagesRef = collection(this.firestore, 'chatMessages');
      const q = query(messagesRef, where('sessionId', '==', this.sessionId));
      const snapshot = await getDocs(q);

      // Delete messages in batches
      const batchSize = 50;
      let batch = writeBatch(this.firestore);
      let count = 0;

      snapshot.docs.forEach(msgDoc => {
        batch.delete(msgDoc.ref);
        count++;

        if (count >= batchSize) {
          batch.commit();
          batch = writeBatch(this.firestore);
          count = 0;
        }
      });

      // Commit remaining deletes
      if (count > 0) {
        await batch.commit();
      }

      // Optionally, generate a new session ID after clearing chat
      this.sessionId = this.generateSessionId();
      localStorage.setItem('chat_session_id', this.sessionId);
      this.subscribeToMessages(); // Re-subscribe to the new session
      this.messages$.next([]); // Clear local messages immediately

      // Reset unread count
      this.unreadCountSubject.next(0);

    } catch (error) {
      console.error('Error clearing chat:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      const messageRef = doc(this.firestore, 'chatMessages', messageId);
      await deleteDoc(messageRef);
      
      // Update unread count if needed
      this.updateUnreadCount();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }


  private async generateBotResponse(userMessage: string): Promise<void> {
    // Update conversation context
    this.updateConversationContext(userMessage);

    // Use context to enhance response
    let botResponse = '';
    let followUpQuestions: string[] = [];

    // Normalize message for better matching
    const normalizedMsg = userMessage.toLowerCase();

    // Try to find a matching response
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
          botResponse = `I found some blog posts that might interest you:`;
          // First send the text response
          const botTextMessage: ChatMessage = {
            content: botResponse,
            timestamp: Timestamp.now(),
            isUser: false,
            sessionId: this.sessionId,
            read: this.chatOpen,
            followUpQuestions
          };
          await addDoc(collection(this.firestore, 'chatMessages'), botTextMessage);

          // Then send blog previews for each relevant post
          for (const post of posts) {
            const previewMessage: ChatMessage = {
              content: ``, // Description is in blogPreview
              contentType: 'blog-preview',
              blogPreview: {
                id: post.id || '',
                title: post.title,
                excerpt: post.excerpt || post.title,
                imageUrl: post.imageUrl // Changed from post.coverImage
              },
              timestamp: Timestamp.now(),
              isUser: false,
              sessionId: this.sessionId,
              read: this.chatOpen
            };

            await addDoc(collection(this.firestore, 'chatMessages'), previewMessage);
          }

          return; // Important to return to avoid sending default text response as well
        } else {
          botResponse = "I couldn't find any blog posts matching your request. You can browse all posts on the home page.";
        }
      } catch (error) {
        console.error('Error searching posts:', error);
        botResponse = "Sorry, I encountered an error while searching for blog posts."; // Inform user about the error
      }
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
    
    // Update unread count when sending a new message
    if (!this.chatOpen) {
      this.updateUnreadCount();
    }
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

    this.ngZone.run(() => { // Run inside Angular zone
      getDocs(q).then(snapshot => {
        snapshot.docs.forEach(doc => {
          deleteDoc(doc.ref);
        });
      });
    });
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
      const eventData: any = { // Create a new object to avoid modifying the original 'data'
        sessionId: this.sessionId,
        eventType,
        timestamp: Timestamp.now(),
        ...data // Spread the existing data
      };
      const userId = this.authService.currentUser()?.uid;
      if (userId) {
        eventData.userId = userId; // Conditionally add userId
      }
      await addDoc(collection(this.firestore, 'chatAnalytics'), eventData);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }
}
