import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { ThemeToggleComponent } from './shared/components/theme-toggle.component';
import { AuthService } from './core/auth/auth.service';
import { NavbarComponent } from './layout/navbar.component';
import { ChatbotComponent } from './shared/components/chatbot.component';
import { ChatService } from './core/services/chat.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    ThemeToggleComponent,
    NavbarComponent,
    ChatbotComponent
  ],
  template: `
    <div class="app-container">
      <app-navbar></app-navbar>

      <main class="app-content">
        <router-outlet></router-outlet>
      </main>
      
      <footer class="footer">
        <div class="container">
          <div class="footer-content">
            <p>&copy; {{ currentYear }} Beau's Blog. All rights reserved.</p>
            <div class="footer-links">
              <a routerLink="/legal/privacy-policy">Privacy Policy</a>
              <a routerLink="/sitemap">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>

      <!-- Chat component with isOpen binding -->
      <app-chatbot *ngIf="isChatVisible" [isOpen]="isChatOpen"></app-chatbot>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .app-content {
      margin-top: 64px; // Toolbar height
      flex: 1;
      padding: 20px;
      max-width: 1200px;
      width: 100%;
      margin-left: auto;
      margin-right: auto;
      box-sizing: border-box;
    }
    
    .footer {
      padding: 1rem;
      background-color: var(--surface-color);
      border-top: 1px solid var(--border-color);
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .footer-links {
      display: flex;
      gap: 1rem;
    }
    
    .footer-links a {
      color: var(--primary-color);
      text-decoration: none;
      transition: opacity 0.2s ease;
    }
    
    .footer-links a:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
    
    @media (max-width: 600px) {
      .footer-content {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);
  private chatService = inject(ChatService);
  
  currentYear = new Date().getFullYear();
  
  // Chat state properties
  isChatVisible = true; // Always show the chat component
  isChatOpen = false;   // But initially closed
  
  ngOnInit() {
    // Subscribe to chat open/close state
    this.chatService.chatOpen$.subscribe(isOpen => {
      this.isChatOpen = isOpen;
      console.log('Chat state changed:', isOpen);
    });
  }
}