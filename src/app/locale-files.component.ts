import { Component } from '@angular/core';

@Component({
	selector: 'app-locale-files',
	standalone: true,
	template: `
    <section class="mb-4">
      <div class="card section-card shadow-sm">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div>
            <h2 class="h5 mb-1">Localization files</h2>
            <p class="text-muted small mb-0">
              Upload JSON, YAML, or PO files and review translation status.
            </p>
          </div>
          <span class="badge bg-info text-dark">Batch</span>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <label class="form-label">Upload localization bundle</label>
            <input class="form-control" type="file" />
          </div>

          <div class="list-group mb-3">
            <a
              class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              href="#"
            >
              <div>
                <div class="fw-semibold">app.en.json</div>
                <div class="small text-muted">English UI strings · 2.4k keys</div>
              </div>
              <span class="badge bg-success">Ready</span>
            </a>
            <a
              class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              href="#"
            >
              <div>
                <div class="fw-semibold">notifications.ru.yml</div>
                <div class="small text-muted">Russian notifications · 1.1k keys</div>
              </div>
              <span class="badge bg-warning text-dark">Review</span>
            </a>
          </div>

          <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-primary">Translate files</button>
            <button class="btn btn-outline-secondary">Export package</button>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class LocaleFilesComponent {}
