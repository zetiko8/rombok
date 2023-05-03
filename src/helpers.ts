import { OperatorFunction, pipe } from 'rxjs';
import { tap } from 'rxjs';

export function registerLoadingStartEvent<T>(
  registerLoadingStart: () => void): OperatorFunction<T, T> {
  return  pipe(tap(() => {
    return registerLoadingStart();
  }));
}

export function registerLoadingEndEvent<T>(
  registerLoadingEnd: () => void): OperatorFunction<T, T> {
  return  pipe(tap(() => {
    return registerLoadingEnd();
  }));
}


