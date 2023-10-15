import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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