import { inject, Injectable, NgZone } from '@angular/core';
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
  limit as limitQuery, // Renamed to avoid naming conflicts
  serverTimestamp,
  DocumentData,
  QueryConstraint,
  startAfter,
  getCountFromServer
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { AuthService } from '../auth/auth.service';

export interface BlogPost {
  id?: string;
  title: string;
  content: string;
  excerpt?: string;
  authorId?: string;
  authorName?: string;
  authorPhotoURL?: string;
  status: 'draft' | 'published' | 'archived';
  featured?: boolean;
  tags: string[];
  imageUrl?: string;
  image?: {
    publicId: string;
    url: string;
    width: number;
    height: number;
  };
  likes?: number;
  views?: number;
  createdAt?: any;
  updatedAt?: any;
  publishedAt?: any;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private firestore = inject(Firestore);
  private ngZone = inject(NgZone);
  private authService = inject(AuthService);
  private storage = inject(Storage);


  // Add this method to get total post count
  async getPostsCount(): Promise<number> {
    try {
      const postsCollection = collection(this.firestore, 'posts');
      const snapshot = await getCountFromServer(postsCollection);
      return snapshot.data().count;
    } catch (error) {
      console.error('Error getting posts count:', error);
      return 0;
    }
  }

  /**
   * Create a new blog post
   */
  async createPost(post: Partial<BlogPost>): Promise<string> {
    const user = this.authService.currentUser();

    if (!user) {
      throw new Error('You must be logged in to create a post');
    }

    // Get the current user profile
    const profile = this.authService.profile();

    if (!profile) {
      throw new Error('User profile not found');
    }

    try {
      const postCollection = collection(this.firestore, 'posts');

      // Prepare the post data with author information
      const newPost: Partial<BlogPost> = {
        ...post,
        authorId: user.uid,
        authorName: profile.displayName || user.displayName || 'Anonymous',
        authorPhotoURL: profile.photoURL || user.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: post.status === 'published' ? serverTimestamp() : null,
        likes: 0,
        views: 0
      };

      console.log('Creating new post with data:', JSON.stringify(newPost, null, 2));

      const docRef = await addDoc(postCollection, newPost);
      console.log('Post created with ID:', docRef.id);

      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Update an existing blog post
   */
  async updatePost(postId: string, updates: Partial<BlogPost>): Promise<void> {
    const user = this.authService.currentUser();

    if (!user) {
      throw new Error('You must be logged in to update a post');
    }

    try {
      // First check if the user is the author of the post
      const postRef = doc(this.firestore, 'posts', postId);

      // Prepare the update data
      const updateData: Partial<BlogPost> = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // If the status is changing to published, set the publishedAt timestamp
      if (updates.status === 'published') {
        updateData.publishedAt = serverTimestamp();
      }

      await updateDoc(postRef, updateData);
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  /**
   * Get all published posts
   */
  async getPublishedPosts(limitCount = 10): Promise<BlogPost[]> {
    try {
      const postsCollection = collection(this.firestore, 'posts');
      const q = query(
        postsCollection,
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limitQuery(limitCount)
      );

      // Use NgZone to ensure we're in the Angular context
      return this.ngZone.runOutsideAngular(async () => {
        const querySnapshot = await getDocs(q);

        return this.ngZone.run(() => {
          return querySnapshot.docs.map(doc => {
            const data = doc.data() as DocumentData;
            return {
              id: doc.id,
              ...data
            } as BlogPost;
          });
        });
      });
    } catch (error)
     {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }


  /**
   * Get posts for the current user
   */
  async getUserPosts(): Promise<BlogPost[]> {
    const user = this.authService.currentUser();

    if (!user) {
      throw new Error('You must be logged in to view your posts');
    }

    try {
      const postsCollection = collection(this.firestore, 'posts');
      const q = query(
        postsCollection,
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          ...data
        } as BlogPost;
      });
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw error;
    }
  }

  /**
   * Get a single post by ID with optimized loading
   */
  async getPostById(postId: string): Promise<BlogPost | null> {
    try {
      const postRef = doc(this.firestore, 'posts', postId);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) {
        return null;
      }

      // Get the post data
      const post = {
        id: postSnap.id,
        ...postSnap.data()
      } as BlogPost;

      // Increment view count asynchronously (don't wait for it)
      this.incrementViewCount(postId).catch(err =>
        console.error('Error incrementing view count:', err)
      );

      return post;
    } catch (error) {
      console.error('Error fetching post by ID:', error);
      throw error;
    }
  }
  /**
   * Get posts by tag
   */
  async getPostsByTag(tag: string, limitCount = 10): Promise<BlogPost[]> {
    try {
      const postsCollection = collection(this.firestore, 'posts');
      const q = query(
        postsCollection,
        where('status', '==', 'published'),
        where('tags', 'array-contains', tag),
        orderBy('publishedAt', 'desc'),
        limitQuery(limitCount)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        return {
          id: doc.id,
          ...doc.data()
        } as BlogPost;
      });
    } catch (error) {
      console.error('Error fetching posts by tag:', error);
      throw error;
    }
  }

  /**
   * Get featured posts
   */
  async getFeaturedPosts(limitCount = 5): Promise<BlogPost[]> {
    try {
      const postsCollection = collection(this.firestore, 'posts');
      const q = query(
        postsCollection,
        where('status', '==', 'published'),
        where('featured', '==', true),
        orderBy('publishedAt', 'desc'),
        limitQuery(limitCount)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        return {
          id: doc.id,
          ...doc.data()
        } as BlogPost;
      });
    } catch (error) {
      console.error('Error fetching featured posts:', error);
      throw error;
    }
  }

  /**
   * Get filtered posts with pagination
   */
  async getFilteredPosts(options: {
    tag?: string;
    search?: string;
    authorId?: string;
    status?: 'published' | 'draft';
    sort?: 'latest' | 'oldest' | 'popular';
    startAfter?: any;
    limit?: number;
  }): Promise<{ posts: BlogPost[]; hasMore: boolean }> {
    try {
      const {
        tag,
        search,
        authorId,
        status = 'published',
        sort = 'latest',
        startAfter,
        limit = 10
      } = options;

      // Start building the query
      let postsQuery = collection(this.firestore, 'posts');
      let constraints: QueryConstraint[] = [
        where('status', '==', status)
      ];

      // Add author filter if specified
      if (authorId) {
        constraints.push(where('authorId', '==', authorId));
      }

      // Add tag filter if specified
      if (tag) {
        constraints.push(where('tags', 'array-contains', tag));
      }

      // Add sorting
      switch (sort) {
        case 'latest':
          constraints.push(orderBy('publishedAt', 'desc'));
          break;
        case 'oldest':
          constraints.push(orderBy('publishedAt', 'asc'));
          break;
        case 'popular':
          constraints.push(orderBy('views', 'desc'));
          break;
      }

      // Add pagination if startAfter is provided
      if (startAfter) {
        constraints.push(startAfter(startAfter));
      }

      // Add limit to query (using limitCount to avoid name collision)
      const limitCount = limit + 1; // Get one extra to check if there are more
      constraints.push(limitQuery(limitCount));

      // Create the query
      const q = query(postsQuery, ...constraints);

      // Execute the query
      const querySnapshot = await getDocs(q);

      // Check if there are more results
      const hasMore = querySnapshot.docs.length > limit;

      // Convert the query snapshot to posts
      const posts = querySnapshot.docs
        .slice(0, limit) // Remove the extra document we fetched to check for more
        .map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));

      // If search is specified, filter the results client-side
      // Note: In a real app, you might want to use a search service like Algolia for this
      let filteredPosts = posts;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredPosts = posts.filter(post =>
          post.title.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower) ||
          (post.excerpt && post.excerpt.toLowerCase().includes(searchLower))
        );
      }

      return { posts: filteredPosts, hasMore };
    } catch (error) {
      console.error('Error fetching filtered posts:', error);
      throw error;
    }
  }

  /**
   * Get all unique tags used in posts
   */
  async getAvailableTags(): Promise<string[]> {
    try {
      // This would be more efficient with a dedicated tags collection
      // For now, we'll fetch all published posts and extract tags
      const postsRef = collection(this.firestore, 'posts');
      const q = query(
        postsRef,
        where('status', '==', 'published'),
        limitQuery(100) // Limit to a reasonable number
      );

      const querySnapshot = await getDocs(q);

      // Extract tags from all posts and create a unique set
      const tagSet = new Set<string>();
      querySnapshot.docs.forEach(doc => {
        const post = doc.data() as BlogPost;
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach(tag => tagSet.add(tag));
        }
      });

      // Convert set to array and sort alphabetically
      return Array.from(tagSet).sort();
    } catch (error) {
      console.error('Error fetching available tags:', error);
      throw error;
    }
  }

  /**
   * Get related posts based on tags
   */
  async getRelatedPosts(postId: string, tags: string[], maxLimit: number = 3): Promise<BlogPost[]> {
    try {
      if (!tags.length) return [];
  
      // First, create a query to get posts with matching tags
      const postsRef = collection(this.firestore, 'posts');
      
      // We need to restructure our query to avoid the ordering issue
      // When using "!=" with a document ID, we can't have additional orderBy clauses
      // after ordering by document ID
      
      // Solution 1: Use two separate queries and merge results
      // First query: Get posts with matching tags, ordered by publishedAt
      const q1 = query(
        postsRef,
        where('status', '==', 'published'),
        where('tags', 'array-contains-any', tags),
        orderBy('publishedAt', 'desc'),
        limitQuery(maxLimit + 1) // Get one extra to account for potential current post
      );
  
      const querySnapshot = await getDocs(q1);
      
      // Filter out the current post from results
      const relatedPosts = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as BlogPost))
        .filter(post => post.id !== postId)
        .slice(0, maxLimit);
  
      return relatedPosts;
    } catch (error) {
      console.error('Error fetching related posts:', error);
      // Return empty array on error rather than throwing
      return [];
    }
  }

  /**
   * Search posts by title or content
   */
  async searchPosts(searchTerm: string, maxResults: number = 10): Promise<BlogPost[]> {
    try {
      // Note: This is a simple implementation that won't scale well
      // For production, consider using a dedicated search service like Algolia
      const postsRef = collection(this.firestore, 'posts');
      const q = query(
        postsRef,
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limitQuery(100) // Fetch a larger set to filter client-side
      );

      const querySnapshot = await getDocs(q);

      const searchLower = searchTerm.toLowerCase();

      // Filter posts that match the search term
      const matchingPosts = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as BlogPost))
        .filter(post =>
          post.title.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower) ||
          (post.excerpt && post.excerpt.toLowerCase().includes(searchLower))
        )
        .slice(0, maxResults);

      return matchingPosts;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  }

  /**
   * Like a post
   */
  async likePost(postId: string): Promise<void> {
    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser) {
        throw new Error('User must be logged in to like a post');
      }
      
      const postDoc = doc(this.firestore, 'posts', postId);
      const postSnapshot = await getDoc(postDoc);
      
      if (!postSnapshot.exists()) {
        throw new Error('Post not found');
      }
      
      // Check if user has already liked the post
      const likesRef = collection(this.firestore, 'posts', postId, 'likes');
      const userLikeQuery = query(likesRef, where('userId', '==', currentUser.uid));
      const userLikeSnapshot = await getDocs(userLikeQuery);
      
      if (userLikeSnapshot.empty) {
        // User hasn't liked the post yet, add a like
        await addDoc(likesRef, {
          userId: currentUser.uid,
          createdAt: serverTimestamp()
        });
        
        // Increment the post's like count
        const post = postSnapshot.data() as BlogPost;
        await updateDoc(postDoc, {
          likes: (post.likes || 0) + 1
        });
      } else {
        // User already liked the post, remove the like
        const likeDoc = userLikeSnapshot.docs[0];
        await deleteDoc(doc(this.firestore, 'posts', postId, 'likes', likeDoc.id));

        // Decrement the post's like count
        const post = postSnapshot.data() as BlogPost;
        await updateDoc(postDoc, {
          likes: Math.max(0, (post.likes || 0) - 1)
        });
      }
    } catch (error) {
      console.error(`Error liking post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Increment view count for a post
   */
  async incrementViewCount(postId: string): Promise<void> {
    try {
      const postRef = doc(this.firestore, 'posts', postId);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) {
        throw new Error('Post not found');
      }

      const post = postSnap.data() as BlogPost;
      const currentViews = post.views || 0;

      await updateDoc(postRef, {
        views: currentViews + 1
      });
    } catch (error) {
      console.error('Error incrementing view count:', error);
      // Don't throw this error as it's not critical
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<void> {
    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser) {
        throw new Error('User must be logged in to delete a post');
      }
      
      const postDoc = doc(this.firestore, 'posts', postId);
      const postSnapshot = await getDoc(postDoc);
      
      if (!postSnapshot.exists()) {
        throw new Error('Post not found');
      }
      
      // Check if the user is the author or an admin
      const existingPost = postSnapshot.data() as BlogPost;
      const isAuthor = existingPost.authorId === currentUser.uid;
      const isAdmin = this.authService.profile()?.role === 'admin';
      
      if (!isAuthor && !isAdmin) {
        throw new Error('You do not have permission to delete this post');
      }
      
      // Delete the post's image if it has one
      if (existingPost.image?.publicId) {
        try {
          const imageRef = ref(this.storage, `posts/${existingPost.image.publicId}`);
          await deleteObject(imageRef);
        } catch (imageError) {
          console.error('Error deleting post image:', imageError);
          // Continue with post deletion even if image deletion fails
        }
      }
      
      // Delete the post
      await deleteDoc(postDoc);
    } catch (error) {
      console.error(`Error deleting post ${postId}:`, error);
      throw error;
    }

  }
  // Get posts by a specific author
  async getPostsByAuthor(authorId: string, includeNonPublished: boolean = false): Promise<BlogPost[]> {
    try {
      const postsCollection = collection(this.firestore, 'posts');
      
      // Determine if we should include drafts and archived posts
      // Only allow this for the author themselves or admins
      const canSeeAllPosts = await this.canUserAccessAllPosts(authorId);
      
      let q;
      if (includeNonPublished && canSeeAllPosts) {
        // Get all posts by the author
        q = query(
          postsCollection,
          where('authorId', '==', authorId),
          orderBy('updatedAt', 'desc')
        );
      } else {
        // Only get published posts
        q = query(
          postsCollection,
          where('authorId', '==', authorId),
          where('status', '==', 'published'),
          orderBy('publishedAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BlogPost));
    } catch (error) {
      console.error(`Error getting posts for author ${authorId}:`, error);
      throw error;
    }
  }

   // Helper method to check if current user can access all posts of an author
   private async canUserAccessAllPosts(authorId: string): Promise<boolean> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;
    
    // User can see their own posts
    if (currentUser.uid === authorId) return true;
    
    // Admins can see all posts
    const profile = this.authService.profile();
    return profile?.role === 'admin';
  }
  

}