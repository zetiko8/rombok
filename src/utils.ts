import { Observable, OperatorFunction, of, pipe, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';

export function log<T>(
  sourceName: string, prop: string | null = null):
OperatorFunction<T, T> {
  return  pipe(
    tap(value => {
      if (prop === null)
        console.log(sourceName, value);
      else {
        const obj = value as { [key: string]: any };
        try {
          console.log(sourceName, obj[prop]);
        } catch (error) {
          console.log(sourceName, value);
        }
      }
    }),
    catchError(error => {
      console.log(sourceName, 'ERROR', error.message);
      return throwError(error);
    }),
    finalize(() => console.log(sourceName, 'COMPLETED')),
  );
}

export const immediate$
 = (): Observable<string> => of('immediate');