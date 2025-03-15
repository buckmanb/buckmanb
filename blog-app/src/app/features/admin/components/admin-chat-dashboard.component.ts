import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
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
            
            <mat-tab label="Usage Patterns">
              <div class="analytics-dashboard">
                <h3>Session Durations</h3>
                <canvas id="sessionDurationChart" width="400" height="200"></canvas>
                
                <h3>Messages per Session</h3>
                <canvas id="messagesPerSessionChart" width="400" height="200"></canvas>
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
  
  // Table columns
  displayedColumns: string[] = ['sessionId', 'startTime', 'messageCount', 'userId', 'actions'];
  feedbackColumns: string[] = ['sessionId', 'rating', 'timestamp', 'comment', 'actions'];
  
  // Selected session for viewing
  selectedSessionId: string | null = null;
  
  // Chart data
  sessionDurations: number[] = [];
  messagesPerSession: number[] = [];
  
  // Charts
  sessionDurationChart: any;
  messagesPerSessionChart: any;
  
  constructor() {
    Chart.register(...registerables);
  }
  
  ngOnInit(): void {
    this.loadRecentSessions();
    this.loadFeedback();
    this.loadAnalytics();
  }
  
  ngAfterViewInit(): void {
    this.loadUsagePatterns();
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
  
  async loadUsagePatterns(): Promise<void> {
    try {
      const messagesRef = collection(this.firestore, 'chatMessages');
      const snapshot = await getDocs(messagesRef);
      
      const sessionData: { [sessionId: string]: { startTime: number; endTime: number; messageCount: number } } = {};
      
      snapshot.docs.forEach(doc => {
        const message = doc.data() as ChatMessage;
        const sessionId = message.sessionId;
        const timestamp = message.timestamp instanceof Timestamp ? message.timestamp.toMillis() : new Date(message.timestamp).getTime();
        
        if (!sessionData[sessionId]) {
          sessionData[sessionId] = {
            startTime: timestamp,
            endTime: timestamp,
            messageCount: 1
          };
        } else {
          sessionData[sessionId].startTime = Math.min(sessionData[sessionId].startTime, timestamp);
          sessionData[sessionId].endTime = Math.max(sessionData[sessionId].endTime, timestamp);
          sessionData[sessionId].messageCount++;
        }
      });
      
      // Process session data for charts
      this.sessionDurations = Object.values(sessionData).map(session => (session.endTime - session.startTime) / (60 * 1000)); // in minutes
      this.messagesPerSession = Object.values(sessionData).map(session => session.messageCount);
      
      this.renderCharts();
      
    } catch (error) {
      console.error('Error loading usage patterns:', error);
    }
  }
  
  renderCharts(): void {
    if (this.sessionDurationChart) {
      this.sessionDurationChart.destroy();
    }
    
    if (this.messagesPerSessionChart) {
      this.messagesPerSessionChart.destroy();
    }
    
    // Session Duration Chart
    const sessionDurationCanvas = document.getElementById('sessionDurationChart') as HTMLCanvasElement;
    if (sessionDurationCanvas) {
      this.sessionDurationChart = new Chart(sessionDurationCanvas, {
        type: 'bar',
        data: {
          labels: this.sessionDurations.map((_, index) => `Session ${index + 1}`),
          datasets: [{
            label: 'Session Duration (minutes)',
            data: this.sessionDurations,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Duration (minutes)'
              }
            }
          }
        }
      });
    }
    
    // Messages Per Session Chart
    const messagesPerSessionCanvas = document.getElementById('messagesPerSessionChart') as HTMLCanvasElement;
    if (messagesPerSessionCanvas) {
      this.messagesPerSessionChart = new Chart(messagesPerSessionCanvas, {
        type: 'bar',
        data: {
          labels: this.messagesPerSession.map((_, index) => `Session ${index + 1}`),
          datasets: [{
            label: 'Messages per Session',
            data: this.messagesPerSession,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Messages'
              }
            }
          }
        }
      });
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
