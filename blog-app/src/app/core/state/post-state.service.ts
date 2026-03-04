import { Injectable, inject, signal, computed } from '@angular/core';
import { BlogService, BlogPost } from '../services/blog.service';

export interface FilteredPostsOptions {
    tag?: string;
    search?: string;
    authorId?: string;
    status?: 'published' | 'draft';
    sort?: 'latest' | 'oldest' | 'popular';
    limit?: number;
}

@Injectable({
    providedIn: 'root'
})
export class PostStateService {
    private blogService = inject(BlogService);

    // ── Core state signals ──────────────────────────────────────────────────────

    readonly posts = signal<BlogPost[]>([]);
    readonly featuredPosts = signal<BlogPost[]>([]);
    readonly loading = signal<boolean>(false);
    readonly error = signal<string | null>(null);
    readonly hasMore = signal<boolean>(false);

    // Pagination cursor — tracks the last fetched set for "load more"
    private _currentOptions = signal<FilteredPostsOptions>({});

    // ── Computed signals ────────────────────────────────────────────────────────

    readonly hasPosts = computed(() => this.posts().length > 0);
    readonly hasFeaturedPosts = computed(() => this.featuredPosts().length > 0);
    readonly postCount = computed(() => this.posts().length);

    // ── Load actions ────────────────────────────────────────────────────────────

    async loadPublishedPosts(limit = 10): Promise<void> {
        this.loading.set(true);
        this.error.set(null);

        try {
            const result = await this.blogService.getPublishedPosts(limit);
            this.posts.set(result);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load posts';
            this.error.set(message);
            console.error('[PostStateService] loadPublishedPosts:', err);
        } finally {
            this.loading.set(false);
        }
    }

    async loadFeaturedPosts(limit = 5): Promise<void> {
        this.error.set(null);

        try {
            const result = await this.blogService.getFeaturedPosts(limit);
            this.featuredPosts.set(result);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load featured posts';
            this.error.set(message);
            console.error('[PostStateService] loadFeaturedPosts:', err);
        }
    }

    async loadFilteredPosts(options: FilteredPostsOptions): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        this._currentOptions.set(options);

        try {
            const { posts, hasMore } = await this.blogService.getFilteredPosts(options);
            this.posts.set(posts);
            this.hasMore.set(hasMore);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load posts';
            this.error.set(message);
            console.error('[PostStateService] loadFilteredPosts:', err);
        } finally {
            this.loading.set(false);
        }
    }

    /**
     * Append the next page of results to the existing posts list.
     * Keeps the current filter options, only adjusting the limit by
     * the page size to fetch the next batch.
     */
    async loadMorePosts(pageSize = 10): Promise<void> {
        if (this.loading() || !this.hasMore()) return;

        this.loading.set(true);
        this.error.set(null);

        try {
            const currentCount = this.posts().length;
            const opts = this._currentOptions();

            const { posts, hasMore } = await this.blogService.getFilteredPosts({
                ...opts,
                limit: currentCount + pageSize
            });

            this.posts.set(posts);
            this.hasMore.set(hasMore);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load more posts';
            this.error.set(message);
            console.error('[PostStateService] loadMorePosts:', err);
        } finally {
            this.loading.set(false);
        }
    }

    /** Reset all state — call when navigating away to avoid stale data in other contexts. */
    reset(): void {
        this.posts.set([]);
        this.featuredPosts.set([]);
        this.loading.set(false);
        this.error.set(null);
        this.hasMore.set(false);
    }
}
