import { Observable, ReplaySubject, Subject, combineLatest, throwError } from 'rxjs';
import { catchError, distinctUntilChanged, map, startWith, takeUntil, tap } from 'rxjs/operators';

export function combineLoaders (
  loaders: Observable<boolean>[],
): Observable<boolean> {
  return combineLatest(loaders).pipe(map(all => all.some(l => l)));
}

export class BoundProcess2 <Argument, ReturnType> {
  private mmResourceLoadingCache: number[] = [];
  private loadFn: (data: Argument) => Observable<ReturnType>;
  private _inProgress$ = new ReplaySubject<boolean>(1);
  public inProgress$ = this._inProgress$
    .pipe(
      startWith(false),
      distinctUntilChanged(),
    );
  public error$ = new ReplaySubject<Error | null>(1);
  public data$ = new ReplaySubject<ReturnType>(1);

  /**
   * @alias
   */
  public success$ = this.data$;

  public load = (
    data: Argument,
    takeUntilSubject$ ? : Subject<unknown>,
  ) => {
    if (takeUntilSubject$) {
      this.loadInternal(data)
        .pipe(takeUntil(takeUntilSubject$))
        .subscribe();
    }
    else {
      this.loadInternal(data)
        .subscribe();
    }
  };

  private loadInternal (
    data: Argument,
  ) {
    this.mmResourceLoadingCache.push(0);
    this._inProgress$.next(!!(this.mmResourceLoadingCache.length));
    return this.loadFn(data)
      .pipe(
        catchError(e => {
          this.mmResourceLoadingCache.pop();
          this._inProgress$.next(!!(this.mmResourceLoadingCache.length));
          this.error$.next(e);
          return throwError(() => e);
        }),
        tap(value => {
          this.mmResourceLoadingCache.pop();
          this._inProgress$.next(!!(this.mmResourceLoadingCache.length));
          this.error$.next(null);
          this.data$.next(value);
        }),
      );
  }

  public execute = (
    data: Argument,
  ) => {
    return this.loadInternal(data);
  };

  constructor (
    loadFn: (data: Argument) => Observable<ReturnType>,
  ) {
    this.loadFn = loadFn;
  }

}