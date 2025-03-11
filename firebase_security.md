// blog-app/firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function hasRole(role) {
      return isAuthenticated() && exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    function isAdmin() {
      return hasRole('admin');
    }
    
    function isAuthor() {
      return hasRole('admin') || hasRole('author');
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone can read public user profiles
      allow read: if true;
      
      // Users can create their own profiles on signup
      allow create: if isOwner(userId);
      
      // Only the user or an admin can update the profile
      allow update: if isOwner(userId) || isAdmin();
      
      // Only admins can delete user profiles
      allow delete: if isAdmin();
    }
    
    // Posts collection
    match /posts/{postId} {
      // Anyone can read published posts
      allow read: if resource.data.status == 'published';
      
      // Authors and admins can read all posts
      allow read: if isAuthor();
      
      // Authors and admins can create posts
      allow create: if isAuthor() && request.resource.data.authorId == request.auth.uid;
      
      // Authors can only update their own posts, admins can update any post
      allow update: if isAdmin() || (isAuthor() && resource.data.authorId == request.auth.uid);
      
      // Only admins can delete posts
      allow delete: if isAdmin();
    }
    
    // Comments collection
    match /comments/{commentId} {
      // Anyone can read approved comments
      allow read: if resource.data.status == 'approved';
      
      // Admins can read all comments
      allow read: if isAdmin();
      
      // Authenticated users can create comments
      allow create: if isAuthenticated() && request.resource.data.authorId == request.auth.uid;
      
      // Users can only update their own comments, admins can update any comment
      allow update: if isAdmin() || (isAuthenticated() && resource.data.authorId == request.auth.uid);
      
      // Only admins can delete comments, users can delete their own comments
      allow delete: if isAdmin() || (isAuthenticated() && resource.data.authorId == request.auth.uid);
    }
    
    // Tags collection (for analytics)
    match /tags/{tagId} {
      // Anyone can read tags
      allow read: if true;
      
      // Only admins and authors can create, update, or delete tags
      allow write: if isAuthor();
    }
    
    // Analytics collection
    match /analytics/{docId} {
      // Only admins can read analytics
      allow read: if isAdmin();
      
      // No one can write directly to analytics (should be done via Cloud Functions)
      allow write: if false;
    }
  }
}