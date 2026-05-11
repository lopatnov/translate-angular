import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'app-credits',
	templateUrl: './credits.component.html',
	styleUrl: './credits.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditsComponent {}
