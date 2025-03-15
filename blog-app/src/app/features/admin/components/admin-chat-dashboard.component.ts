import { Component, inject, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Firestore, collection, query, orderBy, limit, getDocs, where, Timestamp } from '@angular/fire/firestore';

import { ChatMessage, ChatFeedback } from '../../../core/services/chat.service';
import { Chart, registerables } from 'chart.js';

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
  templateUrl: './admin-chat-dashboard.component.html',
  styleUrls: ['./admin-chat-dashboard.component.scss']
})
export class AdminChatDashboardComponent implements OnInit, AfterViewInit {
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
  ratingDistributionChart: any;
  @ViewChild('ratingChartCanvas') ratingChartCanvas!: ElementRef;


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

  ngAfterViewInit(): void {
    Chart.register(...registerables);
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
            session.timestamp = message.timestamp;
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
      let helpfulCount = 0;
      let notHelpfulCount = 0;

      feedbackSnapshot.forEach(doc => {
        const feedback = doc.data() as ChatFeedback;
        if (feedback.rating === 'helpful') {
          totalRating += 1;
          helpfulCount++;
        } else {
          totalRating += 0;
          notHelpfulCount++;
        }
        ratingCount++;
      });

      this.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

      // Process common questions
      this.commonQuestions = Array.from(userQuestions.entries())
        .map(([question, count]) => ({ question, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Rating distribution chart
      if (this.ratingChartCanvas) {
        if (this.ratingDistributionChart) {
          this.ratingDistributionChart.destroy(); // Destroy existing chart if it exists
        }
        this.ratingDistributionChart = new Chart(this.ratingChartCanvas.nativeElement, {
          type: 'pie',
          data: {
            labels: ['Helpful', 'Not Helpful'],
            datasets: [{
              label: 'Feedback Distribution',
              data: [helpfulCount, notHelpfulCount],
              backgroundColor: [
                'rgba(76, 175, 80, 0.8)', // Green for helpful
                'rgba(244, 67, 54, 0.8)'  // Red for not helpful
              ],
              borderColor: [
                'rgba(76, 175, 80, 1)',
                'rgba(244, 67, 54, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
              },
              title: {
                display: true,
                text: 'Chat Feedback Distribution'
              }
            }
          },
        });
      }


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
