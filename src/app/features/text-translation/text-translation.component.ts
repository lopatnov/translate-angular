import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CopyButtonComponent } from '@app/shared/components/copy-button/copy-button.component';
import { ErrorAlertComponent } from '@app/shared/components/error-alert/error-alert.component';
import { LanguageSelectComponent } from '@app/shared/components/language-select/language-select.component';
import { PageHeaderComponent } from '@app/shared/components/page-header/page-header.component';
import { SubmitButtonComponent } from '@app/shared/components/submit-button/submit-button.component';
import { CapabilitiesService } from '@core/services/capabilities.service';
import { TranslateApiService } from '@core/services/translate-api.service';
import { apiErrorMessage } from '@core/utils/api-error.util';
import { useLangFormat } from '@core/utils/lang-format.util';
import { LANGUAGE_FORMATS } from '@core/utils/languages';
import type { TranslateResponse } from '@shared/api.types';

@Component({
  selector: 'app-text-translation',
  imports: [
    ReactiveFormsModule,
    LanguageSelectComponent,
    SubmitButtonComponent,
    ErrorAlertComponent,
    PageHeaderComponent,
    CopyButtonComponent,
  ],
  templateUrl: './text-translation.component.html',
  styleUrl: './text-translation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextTranslationComponent {
  private readonly api = inject(TranslateApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly caps = inject(CapabilitiesService);

  protected readonly formats = LANGUAGE_FORMATS;
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<TranslateResponse | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    text: ['', Validators.required],
    source_language: ['auto'],
    target_language: ['en'],
    model: [''],
    context: [''],
    language_format: ['bcp47'],
  });

  protected readonly isNative = useLangFormat(
    this.form.controls.language_format,
    this.destroyRef,
    (native) => {
      const ctrl = this.form.controls.target_language;
      native
        ? ctrl.setValidators([Validators.required])
        : ctrl.clearValidators();
      ctrl.updateValueAndValidity({ emitEvent: false });
      this.form.patchValue(
        native
          ? { source_language: '', target_language: '' }
          : { source_language: 'auto', target_language: 'en' },
        { emitEvent: false },
      );
    },
  );

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    const { text, source_language, target_language, model, context, language_format } =
      this.form.getRawValue();

    this.api
      .translate({
        text,
        source_language,
        target_language,
        model: model || undefined,
        context: context || undefined,
        language_format,
      })
      .subscribe({
        next: (data) => {
          this.result.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Translation failed'));
          this.loading.set(false);
        },
      });
  }

  clear(): void {
    this.form.reset({
      source_language: this.isNative() ? '' : 'auto',
      target_language: this.isNative() ? '' : 'en',
      language_format: this.form.controls.language_format.value,
    });
    this.result.set(null);
    this.error.set(null);
  }
}
