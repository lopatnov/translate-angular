import { computed, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { AbstractControl } from '@angular/forms';

/**
 * Composable that tracks a `language_format` form control as a signal
 * and fires `onSwitch` whenever the value changes.
 *
 * Declare the result field **after** the form group so that the
 * field-initializer can reference `this.form.controls.*`:
 *
 * ```ts
 * protected readonly form = this.fb.nonNullable.group({ language_format: ['bcp47'] });
 *
 * private readonly _lf = useLangFormat(
 *   this.form.controls.language_format,
 *   this.destroyRef,
 *   (native) => { // set validators + patchValue per component },
 * );
 * protected readonly isNative = this._lf.isNative;
 * ```
 */
export function useLangFormat(
	control: AbstractControl<string>,
	destroyRef: DestroyRef,
	onSwitch: (isNative: boolean) => void,
) {
	const langFormat = signal(control.value);
	const isNative = computed(() => langFormat() === 'native');

	control.valueChanges
		.pipe(takeUntilDestroyed(destroyRef))
		.subscribe((fmt) => {
			langFormat.set(fmt);
			onSwitch(fmt === 'native');
		});

	return { langFormat, isNative } as const;
}
