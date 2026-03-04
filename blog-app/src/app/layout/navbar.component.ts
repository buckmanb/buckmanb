import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from '../core/auth/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { ChatService } from '../core/services/chat.service';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { SearchDialogComponent } from '../shared/components/search-dialog/search-dialog.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  // Injected services
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private chatService = inject(ChatService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  // Reactive properties
  isChatOpen = signal<boolean>(false);
  unreadChatMessages = signal<number>(0);
  userPhotoUrl = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.isChatOpen.set(this.chatService.chatOpen());
    });

    effect(() => {
      this.unreadChatMessages.set(this.chatService.unreadCount());
    });
  }

  ngOnInit() {

    // Get user photo if available
    const user = this.authService.currentUser();
    if (user && user.photoURL) {
      this.userPhotoUrl.set(user.photoURL);
    } else {
      this.userPhotoUrl.set(null);
    }
  }

  toggleChat(): void {
    this.chatService.setChatOpen(!this.isChatOpen());
  }

  openMobileSearch(): void {
    this.dialog.open(SearchDialogComponent, {
      width: '100%',
      maxWidth: '600px',
      panelClass: 'search-dialog'
    });
  }

  login() {
    this.authService.googleLogin();
  }

  logout() {
    this.authService.signOut().then(() => {
      this.router.navigate(['/']);
    });
  }
}