import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const USER_ROUTES: Routes = [
  {
    path: 'profile',
    loadComponent: () => import('../user/user-profile.component')
      .then(m => m.UserProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('../user/user-profile.component')
      .then(m => m.UserProfileComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('../user/user-settings.component')
      .then(m => m.UserSettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'posts',
    loadComponent: () => import('../user/user-posts.component')
      .then(m => m.UserPostsComponent),
    canActivate: [authGuard]
  }
];