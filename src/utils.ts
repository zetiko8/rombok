import { Observable, OperatorFunction, of } from 'rxjs';

export function log(sourceName: string | number) {
  return function<T>(source: Observable<T>): Observable<T> {
    return new Observable(subscriber => {
      source.subscribe({
        next(value) {
          console.log(sourceName, value);
          subscriber.next(value);
        },
        error(error) {
          console.log(sourceName, 'ERROR', error.message);
          subscriber.error(error);
        },
        complete() {
          subscriber.complete();
        },
      });
    });
  };
}

export function pipeContext<T, O>(operatorFunction: OperatorFunction<T, O>) {
  return function(source: Observable<T>): Observable<O> {
    return new Observable(subscriber => {
      source.pipe(operatorFunction).subscribe({
        next(value) {
          subscriber.next(value);
        },
        error(error) {
          subscriber.error(error);
        },
        complete() {
          subscriber.complete();
        },
      });
    });
  };
}

export const immediate$ = (): Observable<string> => of('immediate');