import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CapabilitiesService } from '@core/services/capabilities.service';

@Component({
	selector: 'app-dashboard',
	imports: [RouterLink],
	templateUrl: './dashboard.component.html',
	styleUrl: './dashboard.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
	protected readonly caps = inject(CapabilitiesService);
}
