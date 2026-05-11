import { isPlatformBrowser } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	effect,
	inject,
	PLATFORM_ID,
	signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CreditsComponent } from '@app/shared/components/credits/credits.component';

@Component({
	selector: 'app-root',
	imports: [RouterOutlet, RouterLink, RouterLinkActive, CreditsComponent],
	templateUrl: './app.html',
	styleUrl: './app.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
	protected readonly title = signal('Translate Studio');
	private readonly platformId = inject(PLATFORM_ID);

	constructor() {
		effect(() => {
			if (isPlatformBrowser(this.platformId)) {
				this.setupScrollToTopButton();
			}
		});
	}

	private setupScrollToTopButton(): void {
		const btn = document.getElementById('scroll-to-top');
		if (!btn) return;

		window.addEventListener('scroll', () => {
			btn.classList.toggle('show', window.scrollY > 300);
		});

		btn.addEventListener('click', () => {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}
}
