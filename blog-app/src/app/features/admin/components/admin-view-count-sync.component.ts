import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Firestore, collection, getDocs, query, doc, getDoc, setDoc, serverTimestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-admin-view-count-sync',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>View Count Synchronization</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>
          This tool will count all post views in the postViews collection and update the 
          corresponding entries in the postStats collection.
        </p>
        
        <div *ngIf="syncProgress() > 0" class="progress-container">
          <mat-progress-bar mode="determinate" [value]="syncProgress()"></mat-progress-bar>
          <p>Processing: {{ syncProgress() }}%</p>
        </div>
        
        <div class="stats-container" *ngIf="syncComplete()">
          <p>Sync completed successfully</p>
          <p>Posts processed: {{ postsProcessed() }}</p>
          <p>Total views synced: {{ totalViews() }}</p>
        </div>
      </mat-card-content>
      <mat-card-actions>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="syncViewCounts()" 
          [disabled]="syncing()">
          {{ syncing() ? 'Syncing...' : 'Sync View Counts' }}
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .progress-container {
      margin: 20px 0;
    }
    
    .stats-container {
      margin: 20px 0;
      padding: 10px;
      background-color: #f0f0f0;
      border-radius: 4px;
    }
  `]
})
export class AdminViewCountSyncComponent {
  private firestore = inject(Firestore);
  private snackBar = inject(MatSnackBar);
  
  syncing = signal<boolean>(false);
  syncProgress = signal<number>(0);
  syncComplete = signal<boolean>(false);
  postsProcessed = signal<number>(0);
  totalViews = signal<number>(0);
  
  async syncViewCounts() {
    if (this.syncing()) return;
    
    this.syncing.set(true);
    this.syncProgress.set(0);
    this.syncComplete.set(false);
    
    try {
      // Get all unique postIds from the postViews collection
      const viewsRef = collection(this.firestore, 'postViews');
      const viewsSnap = await getDocs(viewsRef);
      
      const postViewsMap = new Map<string, number>();
      
      // Count views per post
      viewsSnap.forEach(doc => {
        const data = doc.data();
        const postId = data['postId'];
        
        if (postId) {
          postViewsMap.set(postId, (postViewsMap.get(postId) || 0) + 1);
        }
      });
      
      const postIds = Array.from(postViewsMap.keys());
      let processed = 0;
      let totalViewCount = 0;
      
      // Update each post's stats
      for (const postId of postIds) {
        // Verify the post exists
        const postRef = doc(this.firestore, `posts/${postId}`);
        const postSnap = await getDoc(postRef);
        
        if (postSnap.exists()) {
          const viewCount = postViewsMap.get(postId) || 0;
          totalViewCount += viewCount;
          
          // Update the stats document
          const statsRef = doc(this.firestore, `postStats/${postId}`);
          await setDoc(statsRef, {
            viewCount: viewCount,
            lastUpdated: serverTimestamp()
          }, { merge: true });
        }
        
        processed++;
        this.syncProgress.set(Math.round((processed / postIds.length) * 100));
      }
      
      this.postsProcessed.set(postIds.length);
      this.totalViews.set(totalViewCount);
      this.syncComplete.set(true);
      
      this.snackBar.open('View counts synchronized successfully', 'Close', {
        duration: 5000
      });
    } catch (error) {
      console.error('Error syncing view counts:', error);
      this.snackBar.open('Error syncing view counts', 'Close', {
        duration: 5000
      });
    } finally {
      this.syncing.set(false);
    }
  }
}