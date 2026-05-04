import { Component } from '@angular/core';

@Component({
  selector: 'app-speech-to-text',
  standalone: true,
  template: `
    <section class="mb-4">
      <div class="card section-card shadow-sm">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div>
            <h2 class="h5 mb-1">Speech-to-text</h2>
            <p class="text-muted small mb-0">
              Record audio or upload a file to convert speech into text.
            </p>
          </div>
          <span class="badge bg-primary">Voice</span>
        </div>
        <div class="card-body">
          <div class="row gy-3">
            <div class="col-md-6">
              <label class="form-label">Audio input</label>
              <input class="form-control" type="file" accept="audio/*" />
            </div>
            <div class="col-md-6 d-flex align-items-end justify-content-end">
              <button class="btn btn-outline-warning w-100">Start recording</button>
            </div>
          </div>

          <div class="border rounded-3 p-3 mt-4 bg-black-05">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <strong>Transcript preview</strong>
              <span class="badge bg-secondary">Updated 3 min ago</span>
            </div>
            <pre class="transcript-preview">
Сегодня мы тестируем новую страницу перевода речи в текст с помощью Bootstrap-компонентов.</pre
            >
          </div>

          <div class="accordion mt-4" id="speechAccordion">
            <div class="accordion-item">
              <h2 class="accordion-header" id="headingOne">
                <button
                  class="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseOne"
                  aria-expanded="false"
                  aria-controls="collapseOne"
                >
                  Recognition settings
                </button>
              </h2>
              <div
                id="collapseOne"
                class="accordion-collapse collapse"
                aria-labelledby="headingOne"
                data-bs-parent="#speechAccordion"
              >
                <div class="accordion-body text-muted">
                  Выберите языковую модель, включите шумоподавление и увидьте транскрипт в реальном
                  времени.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class SpeechToTextComponent {}
