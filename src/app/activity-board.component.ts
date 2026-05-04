import { Component } from '@angular/core';

@Component({
  selector: 'app-activity-board',
  standalone: true,
  template: `
    <section class="mb-4">
      <div class="card section-card shadow-sm">
        <div class="card-header">
          <h2 class="h6 mb-0">Activity board</h2>
        </div>
        <div class="card-body">
          <div class="d-flex justify-content-between mb-3">
            <span class="small text-muted">Active jobs</span>
            <span class="badge bg-success">4 running</span>
          </div>

          <div class="mb-3">
            <div class="d-flex justify-content-between mb-1">
              <small>Translation batch</small>
              <small>72%</small>
            </div>
            <div class="progress" style="height: 0.5rem;">
              <div class="progress-bar bg-warning" style="width: 72%"></div>
            </div>
          </div>
          <div class="mb-3">
            <div class="d-flex justify-content-between mb-1">
              <small>Localization export</small>
              <small>48%</small>
            </div>
            <div class="progress" style="height: 0.5rem;">
              <div class="progress-bar bg-info" style="width: 48%"></div>
            </div>
          </div>
          <div class="mb-3">
            <div class="d-flex justify-content-between mb-1">
              <small>Speech transcription</small>
              <small>92%</small>
            </div>
            <div class="progress" style="height: 0.5rem;">
              <div class="progress-bar bg-success" style="width: 92%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="card section-card shadow-sm mb-4">
        <div class="card-header">
          <h2 class="h6 mb-0">Recent jobs</h2>
        </div>
        <div class="card-body p-0">
          <table class="table table-borderless mb-0">
            <thead class="small text-muted">
              <tr>
                <th>Job</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>UI translation</td>
                <td><span class="badge bg-success">Done</span></td>
              </tr>
              <tr>
                <td>Help docs</td>
                <td><span class="badge bg-warning text-dark">Review</span></td>
              </tr>
              <tr>
                <td>Audio notes</td>
                <td><span class="badge bg-secondary">Queued</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card section-card shadow-sm">
        <div class="card-header">
          <h2 class="h6 mb-0">Tips</h2>
        </div>
        <div class="card-body">
          <ul class="list-unstyled mb-0 small text-muted">
            <li class="mb-2">
              Use text translation for quick phrases and review the preview card.
            </li>
            <li class="mb-2">Upload localization files for batch processing.</li>
            <li>Use speech-to-text to automate meeting notes and voice logs.</li>
          </ul>
        </div>
      </div>
    </section>
  `,
})
export class ActivityBoardComponent {}
