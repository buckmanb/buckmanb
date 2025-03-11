// src/app/features/admin/services/admin-stats.service.ts
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  getCountFromServer
} from '@angular/fire/firestore';

export interface AdminStats {
  totalPosts: number;
  totalUsers: number;
  totalComments: number;
  totalViews: number;
  postsLastMonth: number;
  postsGrowth: number; // Percentage growth from previous month
  viewsLastMonth: number;
  viewsGrowth: number; // Percentage growth from previous month
  usersLastMonth: number;
  usersGrowth: number; // Percentage growth from previous month
  commentsLastMonth: number;
  commentsGrowth: number; // Percentage growth from previous month
  topPosts: Array<{id: string; title: string; views: number}>;
  mostActiveUsers: Array<{id: string; name: string; postCount: number}>;
  popularTags: Array<{tag: string; count: number}>;
}

@Injectable({
  providedIn: 'root'
})
export class AdminStatsService {
  private firestore = inject(Firestore);
  
  /**
   * Get dashboard statistics
   */
  async getAdminStats(): Promise<AdminStats> {
    try {
      // Fetch total counts
      const totalPosts = await this.getTotalPosts();
      const totalUsers = await this.getTotalUsers();
      const totalComments = await this.getTotalComments();
      const totalViews = await this.getTotalViews();
      
      // Fetch monthly data
      const currentDate = new Date();
      const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
      const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
      
      // Posts data
      const postsLastMonth = await this.getPostsInDateRange(lastMonthStart, lastMonthEnd);
      const postsPreviousMonth = await this.getPostsInDateRange(previousMonthStart, previousMonthEnd);
      const postsGrowth = this.calculateGrowthPercentage(postsPreviousMonth, postsLastMonth);
      
      // Users data
      const usersLastMonth = await this.getUsersInDateRange(lastMonthStart, lastMonthEnd);
      const usersPreviousMonth = await this.getUsersInDateRange(previousMonthStart, previousMonthEnd);
      const usersGrowth = this.calculateGrowthPercentage(usersPreviousMonth, usersLastMonth);
      
      // Views data (estimate)
      const viewsLastMonth = totalViews * 0.2; // Placeholder for now
      const viewsPreviousMonth = totalViews * 0.15; // Placeholder for now
      const viewsGrowth = this.calculateGrowthPercentage(viewsPreviousMonth, viewsLastMonth);
      
      // Comments data
      const commentsLastMonth = await this.getCommentsInDateRange(lastMonthStart, lastMonthEnd);
      const commentsPreviousMonth = await this.getCommentsInDateRange(previousMonthStart, previousMonthEnd);
      const commentsGrowth = this.calculateGrowthPercentage(commentsPreviousMonth, commentsLastMonth);
      
      // Top content
      const topPosts = await this.getTopPosts();
      const mostActiveUsers = await this.getMostActiveUsers();
      const popularTags = await this.getPopularTags();
      
      return {
        totalPosts,
        totalUsers,
        totalComments,
        totalViews,
        postsLastMonth,
        postsGrowth,
        viewsLastMonth,
        viewsGrowth,
        usersLastMonth,
        usersGrowth,
        commentsLastMonth,
        commentsGrowth,
        topPosts,
        mostActiveUsers,
        popularTags
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      throw error;
    }
  }
  
  // Helper functions for fetching data
  
  private async getTotalPosts(): Promise<number> {
    // TODO: Implement this function to get the total number of posts
    return 42; // Placeholder
  }
  
  private async getTotalUsers(): Promise<number> {
    // TODO: Implement this function to get the total number of users
    return 18; // Placeholder
  }
  
  private async getTotalComments(): Promise<number> {
    // TODO: Implement this function to get the total number of comments
    return 256; // Placeholder
  }
  
  private async getTotalViews(): Promise<number> {
    // TODO: Implement this function to get the total number of views
    return 1024; // Placeholder
  }
  
  private async getPostsInDateRange(startDate: Date, endDate: Date): Promise<number> {
    // TODO: Implement this function to get the number of posts in a date range
    return 12; // Placeholder
  }
  
  private async getUsersInDateRange(startDate: Date, endDate: Date): Promise<number> {
    // TODO: Implement this function to get the number of users in a date range
    return 5; // Placeholder
  }
  
  private async getCommentsInDateRange(startDate: Date, endDate: Date): Promise<number> {
    // TODO: Implement this function to get the number of comments in a date range
    return 45; // Placeholder
  }
  
  private async getTopPosts(limit: number = 5): Promise<Array<{id: string; title: string; views: number}>> {
    // TODO: Implement this function to get the top posts by views
    return [
      { id: 'post1', title: 'Getting Started with Angular', views: 245 },
      { id: 'post2', title: 'Firebase Authentication', views: 189 },
      { id: 'post3', title: 'Material Design Tips', views: 156 },
      { id: 'post4', title: 'TypeScript Best Practices', views: 132 },
      { id: 'post5', title: 'Building a Blog with Angular', views: 98 }
    ]; // Placeholder
  }
  
  private async getMostActiveUsers(limit: number = 5): Promise<Array<{id: string; name: string; postCount: number}>> {
    // TODO: Implement this function to get the most active users by post count
    return [
      { id: 'user1', name: 'Jane Smith', postCount: 12 },
      { id: 'user2', name: 'John Doe', postCount: 8 },
      { id: 'user3', name: 'Alice Johnson', postCount: 6 },
      { id: 'user4', name: 'Bob Wilson', postCount: 4 },
      { id: 'user5', name: 'Emma Brown', postCount: 3 }
    ]; // Placeholder
  }
  
  private async getPopularTags(limit: number = 5): Promise<Array<{tag: string; count: number}>> {
    // TODO: Implement this function to get the most popular tags
    return [
      { tag: 'Angular', count: 15 },
      { tag: 'TypeScript', count: 12 },
      { tag: 'Firebase', count: 10 },
      { tag: 'Material', count: 8 },
      { tag: 'JavaScript', count: 7 }
    ]; // Placeholder
  }
  
  private calculateGrowthPercentage(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
}