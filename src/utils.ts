import { Observable, OperatorFunction, of, pipe, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';

export function log<T>(sourceName: string):
OperatorFunction<T, T> {
  return  pipe(
    tap(value => console.log(sourceName, value)),
    catchError(error => {
      console.log(sourceName, 'ERROR', error.message);
      return throwError(error);
    }),
    finalize(() => console.log(sourceName, 'COMPLETED')),
  );
}

export const immediate$
 = (): Observable<string> => of('immediate');