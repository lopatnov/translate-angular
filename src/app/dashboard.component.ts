import {
	ChangeDetectionStrategy,
	Component,
	inject,
	OnInit,
	signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
	type CapabilitiesResponse,
	TranslateApiService,
} from './translate-api.service';

@Component({
	selector: 'app-dashboard',
	imports: [RouterLink],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
    <div class="mb-4">
      <h2 class="page-title mb-1">Dashboard</h2>
      <p class="lead text-muted mb-0">Service status and available capabilities.</p>
    </div>

    @if (loading()) {
      <div class="d-flex align-items-center gap-2 text-muted">
        <div class="spinner-border spinner-border-sm" role="status" aria-label="Loading"></div>
        <span>Connecting to gRPC service…</span>
      </div>
    }

    @if (error()) {
      <div class="alert alert-danger" role="alert">
        <strong>Cannot reach gRPC service.</strong> {{ error() }}<br>
        <small class="text-muted">Make sure the service is running on <code>localhost:5100</code> and try refreshing.</small>
      </div>
    }

    @if (caps()) {
      <div class="row g-4">
        <!-- Status card -->
        <div class="col-md-6">
          <div class="card section-card h-100">
            <div class="card-header">
              <h3 class="h6 mb-0">Service status</h3>
            </div>
            <div class="card-body">
              <dl class="row mb-0">
                <dt class="col-6 fw-normal text-muted">Speech-to-text</dt>
                <dd class="col-6">
                  @if (caps()!.sttAvailable) {
                    <span class="badge bg-success">✓ enabled</span>
                  } @else {
                    <span class="badge bg-secondary">disabled</span>
                  }
                </dd>

                <dt class="col-6 fw-normal text-muted">Text-to-speech</dt>
                <dd class="col-6">
                  @if (caps()!.ttsAvailable) {
                    <span class="badge bg-success">✓ enabled</span>
                  } @else {
                    <span class="badge bg-secondary">disabled</span>
                  }
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <!-- Models card -->
        <div class="col-md-6">
          <div class="card section-card h-100">
            <div class="card-header">
              <h3 class="h6 mb-0">Available translation models</h3>
            </div>
            <div class="card-body d-flex flex-wrap gap-2 align-items-start">
              @for (model of caps()!.availableModels; track model) {
                <span class="badge bg-warning text-dark fs-6">{{ model }}</span>
              } @empty {
                <span class="text-muted small">No models configured</span>
              }
            </div>
          </div>
        </div>

        <!-- Quick links -->
        <div class="col-12">
          <div class="card section-card">
            <div class="card-header">
              <h3 class="h6 mb-0">Quick start</h3>
            </div>
            <div class="card-body d-flex flex-wrap gap-2">
              <a routerLink="/translate" class="btn btn-primary">Text translation</a>
              <a routerLink="/detect" class="btn btn-outline-secondary">Language detection</a>
              <a routerLink="/localize" class="btn btn-outline-secondary">Localization files</a>
              @if (caps()!.sttAvailable) {
                <a routerLink="/transcribe" class="btn btn-outline-secondary">Speech to text</a>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class DashboardComponent implements OnInit {
	private readonly api = inject(TranslateApiService);

	protected readonly loading = signal(true);
	protected readonly error = signal<string | null>(null);
	protected readonly caps = signal<CapabilitiesResponse | null>(null);

	ngOnInit(): void {
		this.api.getCapabilities().subscribe({
			next: (data) => {
				this.caps.set(data);
				this.loading.set(false);
			},
			error: (err) => {
				this.error.set(err?.error?.error ?? err?.message ?? 'Unknown error');
				this.loading.set(false);
			},
		});
	}
}
