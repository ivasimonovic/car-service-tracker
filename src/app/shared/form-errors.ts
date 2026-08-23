import { AbstractControl } from '@angular/forms';

export function firstFieldError(control: AbstractControl | null): string | null {
  if (!control || !control.errors || !(control.touched || control.dirty)) return null;
  return Object.keys(control.errors)[0];
}
