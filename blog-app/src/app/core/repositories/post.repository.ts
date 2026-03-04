import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as limitQuery,
  QueryConstraint,
  startAfter,
  getCountFromServer,
  DocumentData
} from '@angular/fire/firestore';
import { Storage, ref, deleteObject } from '@angular/fire/storage';
import { BlogPost } from '../services/blog.service';

@Injectable({
  providedIn: 'root'
})
export class PostRepository {
  private firestore = inject(Firestore);
  private storage = inject(Storage);

  async getPostsCount(): Promise<number> {
    const postsCollection = collection(this.firestore, 'posts');
    const snapshot = await getCountFromServer(postsCollection);
    return snapshot.data().count;
  }

  async createPost(post: Partial<BlogPost>): Promise<string> {
    const postCollection = collection(this.firestore, 'posts');
    const docRef = await addDoc(postCollection, post);
    return docRef.id;
  }

  async updatePost(postId: string, updates: Partial<BlogPost>): Promise<void> {
    const postRef = doc(this.firestore, 'posts', postId);
    await updateDoc(postRef, updates);
  }

  async getPostById(postId: string): Promise<BlogPost | null> {
    const postRef = doc(this.firestore, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return null;
    return { id: postSnap.id, ...postSnap.data() } as BlogPost;
  }

  async queryPosts(constraints: QueryConstraint[]): Promise<BlogPost[]> {
    const postsCollection = collection(this.firestore, 'posts');
    const q = query(postsCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));
  }

  async queryPostsWithPagination(constraints: QueryConstraint[], limit: number): Promise<{ posts: BlogPost[]; hasMore: boolean }> {
    const postsCollection = collection(this.firestore, 'posts');
    const q = query(postsCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const hasMore = querySnapshot.docs.length > limit;
    const posts = querySnapshot.docs
      .slice(0, limit)
      .map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));

    return { posts, hasMore };
  }

  async deletePost(postId: string): Promise<void> {
    const postDoc = doc(this.firestore, 'posts', postId);
    await deleteDoc(postDoc);
  }

  async deleteImage(publicId: string): Promise<void> {
    const imageRef = ref(this.storage, `posts/${publicId}`);
    await deleteObject(imageRef);
  }

  async addLike(postId: string, userId: string, currentLikes: number): Promise<void> {
    const postDoc = doc(this.firestore, 'posts', postId);
    const likesRef = collection(this.firestore, 'posts', postId, 'likes');
    
    await addDoc(likesRef, {
      userId,
      createdAt: new Date() // Ideally use serverTimestamp from a central util or pass it in
    });

    await updateDoc(postDoc, {
      likes: currentLikes + 1
    });
  }

  async removeLike(postId: string, likeId: string, currentLikes: number): Promise<void> {
    const postDoc = doc(this.firestore, 'posts', postId);
    await deleteDoc(doc(this.firestore, 'posts', postId, 'likes', likeId));

    await updateDoc(postDoc, {
      likes: Math.max(0, currentLikes - 1)
    });
  }

  async getLikeByUserId(postId: string, userId: string): Promise<string | null> {
    const likesRef = collection(this.firestore, 'posts', postId, 'likes');
    const q = query(likesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty ? null : querySnapshot.docs[0].id;
  }
}
