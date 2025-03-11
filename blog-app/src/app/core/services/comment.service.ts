// src/app/core/services/comment.service.ts
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  deleteDoc,
  serverTimestamp,
  increment,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  QueryConstraint,
  QueryDocumentSnapshot,
  getCountFromServer
} from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import { Observable, BehaviorSubject, from, of, throwError, Subject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export type CommentStatus = 'pending' | 'approved' | 'flagged' | 'deleted';

export interface Comment {
  id?: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  parentId?: string; // For threaded/nested replies
  depth: number; // Track nesting depth (0 for top-level, increments for replies)
  status: CommentStatus;
  createdAt?: any;
  updatedAt?: any;
  likes?: number;
  replyCount?: number; // Track number of direct replies
  flagReason?: string; // The reason for flagging (if status is 'flagged')
  flaggedBy?: string;
}

export interface Flag {
  commentId: string;
  userId: string;
  reason: string;
  createdAt: any;
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  
  // Constants
  private readonly BATCH_SIZE = 10; // Number of comments to load per batch
  private readonly MAX_DEPTH = 10; // Maximum reply depth allowed

  // For real-time updates (simplified approach)
  private commentsSubject = new BehaviorSubject<Comment[]>([]);
  public comments$ = this.commentsSubject.asObservable();
  
  // For moderation updates
  private pendingCommentsSubject = new Subject<void>();
  public pendingCommentsChanged$ = this.pendingCommentsSubject.asObservable();
  
  private loadedPostId: string | null = null;

  /**
   * Add a new comment
   */
  async addComment(comment: Partial<Comment>): Promise<string> {
    const user = this.authService.currentUser();
    
    if (!user) {
      throw new Error('You must be logged in to add a comment');
    }
  
    const profile = this.authService.profile();
    if (!profile) {
      throw new Error('User profile not found');
    }
  
    try {
      // Determine the comment depth
      let depth = 0;
      
      // If it's a reply, get parent comment and increment depth
      if (comment.parentId) {
        const parentComment = await this.getCommentById(comment.parentId);
        if (parentComment) {
          depth = Math.min(parentComment.depth + 1, this.MAX_DEPTH);
          
          // Increment reply count on parent
          await this.incrementReplyCount(comment.parentId);
        }
      }
      
      // Auto-approve comments from admin or author roles
      const isAutoApprove = profile.role === 'admin' || profile.role === 'author';
      
      const commentsCollection = collection(this.firestore, 'comments');
      
      // Create a clean comment object without undefined values
      const newComment: any = {
        postId: comment.postId!,
        content: comment.content!,
        authorId: user.uid,
        authorName: profile.displayName || user.displayName || 'Anonymous',
        depth: depth,
        status: isAutoApprove ? 'approved' : 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        replyCount: 0
      };
      
      // Only add parentId if it exists
      if (comment.parentId) {
        newComment.parentId = comment.parentId;
      }
      
      // Only add authorPhotoURL if it exists
      if (profile.photoURL || user.photoURL) {
        newComment.authorPhotoURL = profile.photoURL || user.photoURL;
      }
      
      const docRef = await addDoc(commentsCollection, newComment);
      
      // Notify about pending comment if applicable
      if (!isAutoApprove) {
        this.pendingCommentsSubject.next();
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }
  
  /**
   * Get a single comment by ID
   */
  async getCommentById(commentId: string): Promise<Comment | null> {
    try {
      const commentRef = doc(this.firestore, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        return null;
      }
      
      return {
        id: commentSnap.id,
        ...commentSnap.data()
      } as Comment;
    } catch (error) {
      console.error('Error getting comment:', error);
      return null;
    }
  }

  /**
   * Get top-level comments for a post with pagination
   */
  async getTopLevelComments(postId: string, lastComment?: DocumentSnapshot<DocumentData>): Promise<{comments: Comment[], lastVisible: DocumentSnapshot<DocumentData> | null}> {
    try {
      const commentsCollection = collection(this.firestore, 'comments');
      
      // Build query with proper typing
      let queryConstraints: QueryConstraint[] = [
        where('postId', '==', postId),
        where('parentId', '==', null), // Top level comments only (no parent)
        where('status', '==', 'approved'), // Only show approved comments
        orderBy('createdAt', 'desc')
      ];
      
      // Add pagination if we have a last comment
      if (lastComment) {
        queryConstraints.push(startAfter(lastComment));
      }
      
      queryConstraints.push(limit(this.BATCH_SIZE));
      
      const q = query(commentsCollection, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const comments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      
      // Get the last visible document for pagination
      const lastVisible = querySnapshot.docs.length > 0 ? 
        querySnapshot.docs[querySnapshot.docs.length - 1] : null;
      
      return { comments, lastVisible };
    } catch (error) {
      console.error('Error getting comments:', error);
      return { comments: [], lastVisible: null };
    }
  }

  /**
   * Get all comments for a post with real-time updates (simplified approach)
   * This loads all approved comments for a post and subscribes for updates
   */
  async loadCommentsForPost(postId: string): Promise<Comment[]> {
    try {
      this.loadedPostId = postId;
      
      const commentsCollection = collection(this.firestore, 'comments');
      const q = query(
        commentsCollection,
        where('postId', '==', postId),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const comments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      
      // Update the subject
      this.commentsSubject.next(comments);
      
      return comments;
    } catch (error) {
      console.error('Error loading comments for post:', error);
      return [];
    }
  }

  /**
   * Get replies for a specific comment
   */
  async getRepliesByCommentId(commentId: string, lastComment?: DocumentSnapshot<DocumentData>): Promise<{replies: Comment[], lastVisible: DocumentSnapshot<DocumentData> | null}> {
    try {
      const commentsCollection = collection(this.firestore, 'comments');
      
      // Build query with proper typing
      let queryConstraints: QueryConstraint[] = [
        where('parentId', '==', commentId),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'asc') // Show oldest replies first
      ];
      
      // Add pagination if we have a last comment
      if (lastComment) {
        queryConstraints.push(startAfter(lastComment));
      }
      
      queryConstraints.push(limit(this.BATCH_SIZE));
      
      const q = query(commentsCollection, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const replies = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      
      // Get the last visible document for pagination
      const lastVisible = querySnapshot.docs.length > 0 ? 
        querySnapshot.docs[querySnapshot.docs.length - 1] : null;
      
      return { replies, lastVisible };
    } catch (error) {
      console.error('Error getting replies:', error);
      return { replies: [], lastVisible: null };
    }
  }

  /**
   * Update a comment
   */
  async updateComment(commentId: string, updates: Partial<Comment>): Promise<void> {
    const user = this.authService.currentUser();
    
    if (!user) {
      throw new Error('You must be logged in to update a comment');
    }
    
    try {
      // First check if user is the author or an admin
      const commentRef = doc(this.firestore, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }
      
      const comment = commentSnap.data() as Comment;
      const profile = this.authService.profile();
      
      // Check if user is the author or admin
      if (comment.authorId !== user.uid && profile?.role !== 'admin') {
        throw new Error('You do not have permission to update this comment');
      }
      
      // Prepare the update data
      const updateData: Partial<Comment> = {
        ...updates,
        updatedAt: serverTimestamp(),
      };
      
      // If content was updated, set status back to pending for non-admins
      if (updates.content && profile?.role !== 'admin') {
        updateData.status = 'pending';
        
        // Notify about pending comment
        this.pendingCommentsSubject.next();
      }
      
      await updateDoc(commentRef, updateData);
      
      // Update local cache for real-time updates
      if (this.loadedPostId === comment.postId) {
        const currentComments = this.commentsSubject.value;
        
        // Create a properly typed updated comment object
        const updatedComment: Comment = { 
          ...comment,
          ...updates,
          updatedAt: new Date(),
          id: commentId,
          status: updateData.status || comment.status
        };
        
        const updatedComments = currentComments.map(c => 
          c.id === commentId ? updatedComment : c
        );
        
        this.commentsSubject.next(updatedComments);
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    const user = this.authService.currentUser();
    
    if (!user) {
      throw new Error('You must be logged in to delete a comment');
    }
    
    try {
      const commentRef = doc(this.firestore, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }
      
      const comment = commentSnap.data() as Comment;
      const profile = this.authService.profile();
      
      // Check if user is the author or admin
      if (comment.authorId !== user.uid && profile?.role !== 'admin') {
        throw new Error('You do not have permission to delete this comment');
      }
      
      // For comments with replies, mark as deleted but don't actually delete
      if (comment.replyCount && comment.replyCount > 0) {
        await updateDoc(commentRef, {
          content: '[This comment has been deleted]',
          status: 'deleted',
          updatedAt: serverTimestamp()
        });
      } else {
        // For comments with no replies, truly delete
        await deleteDoc(commentRef);
        
        // If this is a reply, decrement the parent's reply count
        if (comment.parentId) {
          await this.decrementReplyCount(comment.parentId);
        }
      }
      
      // Update local cache for real-time updates
      if (this.loadedPostId === comment.postId) {
        const currentComments = this.commentsSubject.value;
        
        if (comment.replyCount && comment.replyCount > 0) {
          // Mark as deleted in local cache
          const updatedComments = currentComments.map(c => 
            c.id === commentId ? { 
              ...c, 
              content: '[This comment has been deleted]', 
              status: 'deleted' as CommentStatus,
              updatedAt: new Date() 
            } : c
          );
          this.commentsSubject.next(updatedComments);
        } else {
          // Remove from local cache
          const filteredComments = currentComments.filter(c => c.id !== commentId);
          this.commentsSubject.next(filteredComments);
        }
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Moderate a comment (approve/flag)
   */
  async moderateComment(commentId: string, status: 'approved' | 'flagged'): Promise<void> {
    const profile = this.authService.profile();
    
    // Only admins can moderate comments
    if (profile?.role !== 'admin') {
      throw new Error('Only admins can moderate comments');
    }
    
    try {
      const commentRef = doc(this.firestore, 'comments', commentId);
      
      await updateDoc(commentRef, {
        status,
        updatedAt: serverTimestamp()
      });
      
      // Update local cache for real-time updates
      const commentSnap = await getDoc(commentRef);
      if (commentSnap.exists()) {
        const commentData = commentSnap.data();
        if (this.loadedPostId === commentData['postId']) {
          const currentComments = this.commentsSubject.value;
          const updatedComments = currentComments.map(c => 
            c.id === commentId ? { ...c, status, updatedAt: new Date() } : c
          );
          this.commentsSubject.next(updatedComments);
        }
      }
      
      // Notify for comment status change
      this.pendingCommentsSubject.next();
    } catch (error) {
      console.error('Error moderating comment:', error);
      throw error;
    }
  }

  /**
   * Like a comment
   */
  async likeComment(commentId: string): Promise<void> {
    const user = this.authService.currentUser();
    
    if (!user) {
      throw new Error('You must be logged in to like a comment');
    }
    
    try {
      // In a real implementation, you'd need to check if the user has already liked the comment
      // and maintain a collection of likes per comment
      
      const commentRef = doc(this.firestore, 'comments', commentId);
      
      // Increment likes counter
      await updateDoc(commentRef, {
        likes: increment(1)
      });
      
      // Update local cache for real-time updates
      const commentSnap = await getDoc(commentRef);
      if (commentSnap.exists()) {
        const commentData = commentSnap.data();
        if (this.loadedPostId === commentData['postId']) {
          const currentComments = this.commentsSubject.value;
          const updatedComments = currentComments.map(c => 
            c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
          );
          this.commentsSubject.next(updatedComments);
        }
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  }

  /**
   * Get pending comments for moderation
   */
  async getPendingComments(lastComment?: DocumentSnapshot<DocumentData>): Promise<{comments: Comment[], lastVisible: DocumentSnapshot<DocumentData> | null}> {
    const profile = this.authService.profile();
    
    // Only admins can view pending comments
    if (profile?.role !== 'admin') {
      throw new Error('Only admins can view pending comments');
    }
    
    try {
      const commentsCollection = collection(this.firestore, 'comments');
      
      // Build query with proper typing
      let queryConstraints: QueryConstraint[] = [
        where('status', '==', 'pending'),
        orderBy('createdAt', 'asc') // Oldest first
      ];
      
      // Add pagination if we have a last comment
      if (lastComment) {
        queryConstraints.push(startAfter(lastComment));
      }
      
      queryConstraints.push(limit(this.BATCH_SIZE));
      
      const q = query(commentsCollection, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const comments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      
      // Get the last visible document for pagination
      const lastVisible = querySnapshot.docs.length > 0 ? 
        querySnapshot.docs[querySnapshot.docs.length - 1] : null;
      
      return { comments, lastVisible };
    } catch (error) {
      console.error('Error getting pending comments:', error);
      return { comments: [], lastVisible: null };
    }
  }
  
  /**
   * Get pending comments with count
   */
  async getPendingCommentsWithCount(): Promise<{comments: Comment[], lastVisible: DocumentSnapshot<DocumentData> | null, count: number}> {
    try {
      const { comments, lastVisible } = await this.getPendingComments();
      
      // Get count of pending comments
      const commentsCollection = collection(this.firestore, 'comments');
      const countQuery = query(commentsCollection, where('status', '==', 'pending'));
      const countSnapshot = await getCountFromServer(countQuery);
      const count = countSnapshot.data().count;
      
      return { comments, lastVisible, count };
    } catch (error) {
      console.error('Error getting pending comments with count:', error);
      return { comments: [], lastVisible: null, count: 0 };
    }
  }

  /**
   * Get flagged comments for moderation
   */
  async getFlaggedComments(lastComment?: DocumentSnapshot<DocumentData>): Promise<{comments: Comment[], lastVisible: DocumentSnapshot<DocumentData> | null}> {
    const profile = this.authService.profile();
    
    // Only admins can view flagged comments
    if (profile?.role !== 'admin') {
      throw new Error('Only admins can view flagged comments');
    }
    
    try {
      const commentsCollection = collection(this.firestore, 'comments');
      
      // Build query with proper typing
      let queryConstraints: QueryConstraint[] = [
        where('status', '==', 'flagged'),
        orderBy('updatedAt', 'desc') // Most recently flagged first
      ];
      
      // Add pagination if we have a last comment
      if (lastComment) {
        queryConstraints.push(startAfter(lastComment));
      }
      
      queryConstraints.push(limit(this.BATCH_SIZE));
      
      const q = query(commentsCollection, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const comments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      
      // Get the last visible document for pagination
      const lastVisible = querySnapshot.docs.length > 0 ? 
        querySnapshot.docs[querySnapshot.docs.length - 1] : null;
      
      return { comments, lastVisible };
    } catch (error) {
      console.error('Error getting flagged comments:', error);
      return { comments: [], lastVisible: null };
    }
  }
  
  /**
   * Get flagged comments with count
   */
  async getFlaggedCommentsWithCount(): Promise<{comments: Comment[], lastVisible: DocumentSnapshot<DocumentData> | null, count: number}> {
    try {
      const { comments, lastVisible } = await this.getFlaggedComments();
      
      // Get count of flagged comments
      const commentsCollection = collection(this.firestore, 'comments');
      const countQuery = query(commentsCollection, where('status', '==', 'flagged'));
      const countSnapshot = await getCountFromServer(countQuery);
      const count = countSnapshot.data().count;
      
      return { comments, lastVisible, count };
    } catch (error) {
      console.error('Error getting flagged comments with count:', error);
      return { comments: [], lastVisible: null, count: 0 };
    }
  }
  
  /**
   * Get recently approved comments
   */
  async getRecentlyApprovedComments(lastComment?: DocumentSnapshot<DocumentData>): Promise<{comments: Comment[], lastVisible: DocumentSnapshot<DocumentData> | null}> {
    const profile = this.authService.profile();
    
    // Only admins can view this list
    if (profile?.role !== 'admin') {
      throw new Error('Only admins can view this list');
    }
    
    try {
      const commentsCollection = collection(this.firestore, 'comments');
      
      // Build query with proper typing
      let queryConstraints: QueryConstraint[] = [
        where('status', '==', 'approved'),
        orderBy('updatedAt', 'desc') // Most recently approved first
      ];
      
      // Add pagination if we have a last comment
      if (lastComment) {
        queryConstraints.push(startAfter(lastComment));
      }
      
      queryConstraints.push(limit(this.BATCH_SIZE));
      
      const q = query(commentsCollection, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const comments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      
      // Get the last visible document for pagination
      const lastVisible = querySnapshot.docs.length > 0 ? 
        querySnapshot.docs[querySnapshot.docs.length - 1] : null;
      
      return { comments, lastVisible };
    } catch (error) {
      console.error('Error getting recently approved comments:', error);
      return { comments: [], lastVisible: null };
    }
  }
  
  /**
   * Get recently approved comments with count
   */
  async getRecentlyApprovedCommentsWithCount(): Promise<{comments: Comment[], lastVisible: DocumentSnapshot<DocumentData> | null, count: number}> {
    try {
      const { comments, lastVisible } = await this.getRecentlyApprovedComments();
      
      // Get count of recently approved comments (last 7 days)
      const commentsCollection = collection(this.firestore, 'comments');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const countQuery = query(
        commentsCollection, 
        where('status', '==', 'approved'),
        where('updatedAt', '>=', sevenDaysAgo)
      );
      
      const countSnapshot = await getCountFromServer(countQuery);
      const count = countSnapshot.data().count;
      
      return { comments, lastVisible, count };
    } catch (error) {
      console.error('Error getting recently approved comments with count:', error);
      return { comments: [], lastVisible: null, count: 0 };
    }
  }

  /**
   * Flag a comment by a user
   */
  async flagCommentByUser(commentId: string, reason: string): Promise<void> {
    const user = this.authService.currentUser();
    
    if (!user) {
      throw new Error('You must be logged in to flag a comment');
    }
    
    try {
      const commentRef = doc(this.firestore, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }
      
      // Create a flag record
      // const flagsCollection = collection(this.firestore, 'comment_flags');
      // await addDoc(flagsCollection, {
      //   commentId,
      //   flaggedBy: user.uid,
      //   reason,
      //   createdAt: serverTimestamp()
      // });
      
      // Mark the comment as flagged
      await updateDoc(commentRef, {
        status: 'flagged' as CommentStatus,
        flagReason: reason,
        flaggedBy: user.uid,
        updatedAt: serverTimestamp()
      });
      
      // Notify for status change
      this.pendingCommentsSubject.next();
      
      // Update local cache for real-time updates
      const comment = commentSnap.data() as Comment;
      if (this.loadedPostId === comment.postId) {
        const currentComments = this.commentsSubject.value;
        const updatedComments = currentComments.map(c => 
          c.id === commentId ? { 
            ...c, 
            status: 'flagged' as CommentStatus, 
            flagReason: reason, 
            updatedAt: new Date() 
          } : c
        );
        this.commentsSubject.next(updatedComments);
      }
    } catch (error) {
      console.error('Error flagging comment:', error);
      throw error;
    }
  }

  /**
   * Helper method to increment reply count on a parent comment
   */
  private async incrementReplyCount(commentId: string): Promise<void> {
    try {
      const commentRef = doc(this.firestore, 'comments', commentId);
      await updateDoc(commentRef, {
        replyCount: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing reply count:', error);
    }
  }

  /**
   * Helper method to decrement reply count on a parent comment
   */
  private async decrementReplyCount(commentId: string): Promise<void> {
    try {
      const commentRef = doc(this.firestore, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (commentSnap.exists()) {
        const comment = commentSnap.data() as Comment;
        const currentCount = comment.replyCount || 0;
        
        // Ensure we don't go below zero
        await updateDoc(commentRef, {
          replyCount: Math.max(0, currentCount - 1)
        });
      }
    } catch (error) {
      console.error('Error decrementing reply count:', error);
    }
  }

  /**
   * Clear comment cache when navigating away
   */
  clearCache(): void {
    this.loadedPostId = null;
    this.commentsSubject.next([]);
  }
}