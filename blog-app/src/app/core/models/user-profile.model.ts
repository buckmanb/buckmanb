import { Timestamp } from '@angular/fire/firestore';

export type UserRole = 'user' | 'author' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
}

export interface RoleChangeEvent {
  uid: string;
  previousRole: UserRole;
  newRole: UserRole;
  changedBy: string;
  timestamp: Date;
}
