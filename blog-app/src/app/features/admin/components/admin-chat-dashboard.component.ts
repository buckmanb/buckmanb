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