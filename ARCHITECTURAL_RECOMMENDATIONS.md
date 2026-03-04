# Architectural Review & Recommendations

Based on a review of the current Angular 19 codebase (specifically the structure, `BlogService`, `AuthService`, and general project direction), here are key architectural observations and recommendations for improving code elegance, maintainability, and scalability.

## 1. State Management & Data Flow

**Current State:**
With the completion of Phase 1-3 of the state management implementation, the app is now fully zoneless-compatible:
- `AuthService` exposes `currentUser` and `profile` as Signals via `toSignal()`. All `ApplicationRef.tick()` workaround calls have been removed.
- `PostStateService` (`core/state/post-state.service.ts`) centralizes post list state via `WritableSignal`s (`posts`, `featuredPosts`, `loading`, `error`, `hasMore`) and exposes computed signals (`hasPosts`, `hasFeaturedPosts`, `postCount`).
- `HomeComponent` and `PostListComponent` now bind directly to `PostStateService` signals — no local async/promise patterns.

> **Status: ✅ Implemented**
> - ✅ `AuthService`: `currentUser` and `profile` exposed as Signals via `toSignal()`.
> - ✅ `AuthService`: All `app.tick()` calls removed. `ApplicationRef` no longer injected.
> - ✅ `PostStateService`: Signal-based centralized state service created.
> - ✅ `HomeComponent`: Delegates to `PostStateService` signals.
> - ✅ `PostListComponent`: Delegates to `PostStateService` signals, `loadMore()` wired to `PostStateService.loadMorePosts()`.

**Recommendations:**
*   **State Hydration:** For large lists (like `getFilteredPosts`), consider a lightweight NgRx SignalStore to prevent redundant network requests when switching between routes.


---

## 2. Repository Pattern for Firebase

> **Status: ✅ Implemented**
> - `PostRepository` (`core/repositories/post.repository.ts`) now encapsulates all direct `Firestore` and `Storage` calls: `createPost`, `updatePost`, `deletePost`, `queryPosts`, `queryPostsWithPagination`, `getPostById`, `addLike`, `removeLike`, `getLikeByUserId`, and `deleteImage`.
> - `BlogService` has been successfully refactored to inject `PostRepository` and contains zero direct Firestore/Storage imports — it is now responsible only for business rules (authorization checks, data enrichment, timestamp management) and delegates all persistence mechanics to the repository.

**Remaining Consideration:**
*   `AuthService` still performs Firestore operations directly (user profile reads/writes via `setDoc`, `updateDoc`, `getDoc`, `docData`). Consider a `UserRepository` to keep the pattern consistent across the codebase, though this is lower priority given the bounded scope of auth data.

---

## 3. Service Layer Boundaries (The "Fat Service" Problem)

**Current State:**
`BlogService` has been significantly slimmed down since the Repository Pattern refactor. Direct infrastructure code has been extracted and business logic is now the primary concern. The file is currently ~575 lines.

**Recommendations:**
*   **Segregation of Duties:** `BlogService` still handles creating posts, updating posts, querying by tags, querying by author, searching logic, incrementing views, and managing likes. Consider further splitting into focused services:
    *   `PostQueryService`: Handles all read operations, pagination, and searching.
    *   `PostCommandService` or `PostMutatorService`: Handles creation, updates, and deletions.
    *   `PostEngagementService`: Handles likes, views, and interactions.
*   **Decoupling Auth from Domain Logic:** `BlogService` directly injects `AuthService` to check permissions (e.g., `this.authService.currentUser()`). Consider passing the user ID as a parameter to these methods from the Component/Facade layer, or using an interceptor/guard approach. This makes `BlogService` easier to unit test without mocking the entire Auth ecosystem.

## 4. Database Querying & Scalability

**Current State:**
*   **Client-Side Search:** The `searchPosts` method fetches a large batch of documents (`limitQuery(100)`) and filters them in memory on the client side using `.includes()`. A note in the code acknowledges this limitation.
*   **Tag Aggregation:** `getAvailableTags` fetches 100 posts and parses them to find unique tags.

**Recommendations:**
*   **Server-Side Search:** Client-side text searching is a major scalability bottleneck. As the blog grows, fetching 100 documents specifically to search strings will crush performance and inflate Firestore read costs. Migrate text search to **Algolia**, **Meilisearch**, or use a Firebase Extension to mirror Firestore data to a search-optimized database.
*   **Metadata Aggregation:** For `getAvailableTags`, do not query primary documents. Maintain a single `metadata/tags` document in Firestore that is updated via a Firebase Cloud Function whenever a post is created/updated. Fetching exactly *one* document is infinitely more scalable than fetching *N* documents to parse tags.

## 5. Error Handling & Resilience

**Current State:**
Errors are caught in `catch (error)` blocks within the services, console logged, and often re-thrown. UI handling of these errors relies on the component layer explicitly catching them or utilizing a scattered `ErrorService`.

**Recommendations:**
*   **Global Error Handler:** Implement Angular's `ErrorHandler` interface globally to catch unhandled exceptions, log them to a monitoring service (like Sentry), and present a unified toast/snackbar to the user via the `ErrorService`.
*   **Result Pattern:** Instead of throwing exceptions for expected business failures (e.g., "User not authorized"), return a explicit Result object (e.g., `{ success: false, reason: 'unauthorized' }`). Reserve `throw` for actual catastrophic failures.

## 6. Security & Validation

**Current State:**
Validation logic is somewhat duplicated between the client services and (presumably) Firestore rules.

**Recommendations:**
*   **Shared Validation Models:** If using a monorepo approach (or just organizing `core/models`), define strict validation schemas (e.g., using Zod) that can be shared between Angular forms and potential Firebase Cloud Functions.
*   **Cloud Functions for Complex Writes:** Operations like `deletePost` currently involve a complex client-side dance of checking permissions, deleting records, and deleting associated images. This is brittle. Move complex mutations to Firebase Callable Functions. The client simply calls `deletePost(id)`, and the secure server environment performs the transaction atomically.

## Summary

| Recommendation | Status |
|---|---|
| Repository Pattern for Firebase (`PostRepository`) | ✅ Implemented |
| Signals in `AuthService` (`currentUser`, `profile`) | ✅ Implemented |
| Remove `NgZone` / `ApplicationRef.tick()` boilerplate | ✅ Implemented — all `app.tick()` calls removed |
| `PostStateService` — centralized signal-based post state | ✅ Implemented |
| `HomeComponent` / `PostListComponent` use service signals | ✅ Implemented |
| Split `BlogService` into focused services | ❌ Not yet implemented |
| Server-Side Search (Algolia / Firebase Extension) | ❌ Not yet implemented |
| Tag Metadata Aggregation via Cloud Function | ❌ Not yet implemented |
| Global Angular `ErrorHandler` | ❌ Not yet implemented |
| Cloud Functions for complex mutations (`deletePost`) | ❌ Not yet implemented |
