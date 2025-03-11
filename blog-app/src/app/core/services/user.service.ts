import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  doc, 
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  serverTimestamp,
  setDoc
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable, from, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserProfile } from '../models/user-profile.model';
import { AuthService } from '../auth/auth.service';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore = inject(Firestore);
  private functions = inject(Functions);
  private authService = inject(AuthService);
  private errorService = inject(ErrorService);

  getUsers(pageSize: number = 100): Observable<UserProfile[]> {
    const usersCollection = collection(this.firestore, 'users');
    const q = query(
      usersCollection,
      orderBy('displayName'),
      limit(pageSize)
    );

    return from(getDocs(q)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
          isActive: doc.data()['isActive'] ?? true, // Add default value
          createdAt: doc.data()['createdAt']?.toDate(),
          updatedAt: doc.data()['updatedAt']?.toDate()
        }) as UserProfile)
      ),
      catchError(error => {
        this.errorService.showError('Error loading users');
        return throwError(() => new Error(error));
      })
    );
  }

  getUserById(uid: string): Observable<UserProfile | null> {
    const userDoc = getDoc(doc(this.firestore, 'users', uid));
    return from(userDoc).pipe(
      map(doc => doc.exists() ? {        
        uid: doc.id,
        ...doc.data(),
        isActive: doc.data()['isActive'] ?? true, // Match the same default
        createdAt: doc.data()['createdAt']?.toDate(),
        updatedAt: doc.data()['updatedAt']?.toDate()
      } as UserProfile : null),
      catchError(error => {
        this.errorService.showError('Error loading user details');
        return throwError(() => new Error(error));
      })
    );
  }

  // Rest of the file remains unchanged...
  updateUserRole(uid: string, newRole: string): Observable<void> {
    return this.authService.profile$.pipe(
      switchMap(profile => {
        if (!profile || profile.role !== 'admin') {
          this.errorService.showError('Permission denied: Only admins can change roles');
          return throwError(() => new Error('Permission denied'));
        }

        const userRef = doc(this.firestore, 'users', uid);
        const updatePromise = updateDoc(userRef, {
          role: newRole,
          updatedAt: serverTimestamp()
        });

        const setClaims = httpsCallable(this.functions, 'setCustomUserClaims');
        const claimsPromise = setClaims({ 
          uid,
          claims: this.getRoleClaims(newRole)
        });

        return from(Promise.all([updatePromise, claimsPromise])).pipe(
          map(() => {}),
          catchError(error => {
            this.errorService.showError('Failed to update role');
            return throwError(() => new Error(error));
          })
        );
      })
    );
  }

  activateUser(uid: string): Observable<void> {
    return this.validateAdmin().pipe(
      switchMap(() => {
        const userRef = doc(this.firestore, 'users', uid);
        return from(updateDoc(userRef, {
          isActive: true,
          updatedAt: serverTimestamp()
        }));
      }),
      catchError(error => {
        this.errorService.showError('Failed to activate user');
        return throwError(() => new Error(error));
      })
    );
  }

  deactivateUser(uid: string): Observable<void> {
    return this.validateAdmin().pipe(
      switchMap(() => {
        const userRef = doc(this.firestore, 'users', uid);
        return from(updateDoc(userRef, {
          isActive: false,
          updatedAt: serverTimestamp()
        }));
      }),
      catchError(error => {
        this.errorService.showError('Failed to deactivate user');
        return throwError(() => new Error(error));
      })
    );
  }

  private validateAdmin(): Observable<void> {
    return this.authService.profile$.pipe(
      switchMap(profile => {
        if (!profile || profile.role !== 'admin') {
          return throwError(() => new Error('Admin privileges required'));
        }
        return of(undefined);
      })
    );
  }

  private getRoleClaims(role: string): { admin: boolean, author: boolean } {
    return {
      admin: role === 'admin',
      author: role === 'author' || role === 'admin'
    };
  }
}
