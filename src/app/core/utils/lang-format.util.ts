import { type DestroyRef, type Signal, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { AbstractControl } from '@angular/forms';

/**
 * Composable that tracks a `language_format` form control and returns
 * an `isNative` signal. Also fires `onSwitch` on every format change.
 *
 * Declare after the form group — field initializers run in order:
 *
 * ```ts
 * protected readonly form = this.fb.nonNullable.group({ language_format: ['bcp47'] });
 *
 * protected readonly isNative = useLangFormat(
 *   this.form.controls.language_format,
 *   this.destroyRef,
 *   (native) => { /* set validators + patchValue *\/ },
 * );
 * ```
 */
export function useLangFormat(
	control: AbstractControl<string>,
	destroyRef: DestroyRef,
	onSwitch: (isNative: boolean) => void,
): Signal<boolean> {
	const langFormat = signal(control.value);

	// Fire once immediately so validators / patchValue run on init, not just on change.
	onSwitch(control.value === 'native');

	control.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe((fmt) => {
		langFormat.set(fmt);
		onSwitch(fmt === 'native');
	});

	return computed(() => langFormat() === 'native');
}
