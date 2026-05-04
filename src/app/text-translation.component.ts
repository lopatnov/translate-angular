import { Component } from '@angular/core';

@Component({
  selector: 'app-text-translation',
  standalone: true,
  template: `
    <section class="mb-4">
      <div class="card section-card shadow-sm">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div>
            <h2 class="h5 mb-1">Text translation</h2>
            <p class="text-muted small mb-0">Translate text directly or paste content from your localization files.</p>
          </div>
          <span class="badge bg-success">Realtime</span>
        </div>
        <div class="card-body">
          <div class="row gy-3">
            <div class="col-md-6">
              <label class="form-label">Source language</label>
              <select class="form-select">
                <option>Auto detect</option>
                <option>English</option>
                <option>Russian</option>
                <option>Spanish</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Target language</label>
              <select class="form-select">
                <option>Russian</option>
                <option>English</option>
                <option>French</option>
                <option>Japanese</option>
              </select>
            </div>
          </div>

          <div class="row gy-3 mt-3">
            <div class="col-12">
              <label class="form-label">Source text</label>
              <textarea class="form-control" rows="6" placeholder="Paste text to translate..."></textarea>
            </div>
            <div class="col-12">
              <div class="d-flex flex-column flex-sm-row gap-2 align-items-start align-items-sm-center">
                <button class="btn btn-primary">Translate</button>
                <button class="btn btn-outline-secondary">Clear text</button>
                <span class="badge bg-secondary">Word count: 138</span>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="small text-muted">Translation preview</span>
              <span class="small text-warning">Draft saved</span>
            </div>
            <div class="card card-quiet p-3">
              <p class="mb-1">Это пример перевода, который автоматически заполняется в блоке предварительного просмотра.</p>
              <p class="text-muted small mb-0">Use the text area above to see live output here.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class TextTranslationComponent {}
