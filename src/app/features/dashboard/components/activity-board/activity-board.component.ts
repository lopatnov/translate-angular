import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'app-activity-board',
	templateUrl: './activity-board.component.html',
	styleUrl: './activity-board.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityBoardComponent {}
