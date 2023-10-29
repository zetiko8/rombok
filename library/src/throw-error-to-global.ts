import { Observable, of, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { ErrorFirst } from './error-first';

/**
 * @internal
 */
export const _throwToGlobalFn = (error: Error): void => {
  of('').subscribe(() => {
    throw error;
  });
};

export const throwErrorToGlobal
= <T>(): (source$: Observable<T>) => Observable<T> => {
  return (
    source$: Observable<T>,
  ): Observable<T> => source$.pipe(
    catchError(error => {
      _throwToGlobalFn(error);
      return throwError(() => error);
    }),
  );
};

export const throwErrorFirstToGlobal
= <T>(): (
  source$: Observable<ErrorFirst<T>>
) => Observable<ErrorFirst<T>> => {
  return (
    source$: Observable<ErrorFirst<T>>,
  ): Observable<ErrorFirst<T>> => source$.pipe(
    mergeMap(([ error, result ]) => {
      if (error) _throwToGlobalFn(error);
      return of([ error, result ] as ErrorFirst<T>);
    }),
  );
};