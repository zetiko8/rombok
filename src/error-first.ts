import { EMPTY, Observable, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';

export type ErrorFirst<T> = [
  error: null,
  result: T | null
];

export const errorFirst
= <T>(): (source$: Observable<T>) => Observable<ErrorFirst<T>> => {
  return (
    source$: Observable<T>,
  ): Observable<ErrorFirst<T>> => source$.pipe(
    map(result => {
      const ef: ErrorFirst<T> = [ null, result ];
      return ef;
    }),
    catchError(error => {
      const ef: ErrorFirst<T> = [ error, null ];
      return of(ef);
    }),
  );
};

export const errorFirstToResult
= <T>(): (source$: Observable<ErrorFirst<T>>)
  => Observable<T> => {
  return (
    source$: Observable<ErrorFirst<T>>,
  ): Observable<T> => source$.pipe(
    mergeMap(([error, result]) => {
      if (error) return EMPTY;
      return of(result as T);
    }),
  );
};

export const errorFirstToError
= <T>(): (source$: Observable<ErrorFirst<T>>)
  => Observable<Error | null> => {
  return (
    source$: Observable<ErrorFirst<T>>,
  ): Observable<Error | null> => source$.pipe(
    mergeMap(([error]) => {
      if (error === null) return EMPTY;
      return of(error);
    }),
  );
};