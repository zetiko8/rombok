import { Observable } from 'rxjs';

export function log(sourceName: string) {
  return function<T>(source: Observable<T>): Observable<T> {
    return new Observable(subscriber => {
      source.subscribe({
        next(value) {
          console.log(sourceName, value);
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

export function logObject(sourceName: string, properties: string[]) {
  return function<T>(source: Observable<T>): Observable<T> {
    return new Observable(subscriber => {
      source.subscribe({
        next(value) {
          console.log(sourceName, value);
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