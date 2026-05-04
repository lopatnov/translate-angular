import { Component, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('translate-angular');
  private platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => {
      // Initialize scroll-to-top button behavior only in browser
      if (isPlatformBrowser(this.platformId)) {
        this.setupScrollToTopButton();
      }
    });
  }

  private setupScrollToTopButton(): void {
    const scrollTopBtn = document.getElementById('scroll-to-top');
    if (!scrollTopBtn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        scrollTopBtn.classList.add('show');
      } else {
        scrollTopBtn.classList.remove('show');
      }
    });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}
