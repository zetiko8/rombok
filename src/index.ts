import {
  Observable, 
  ReplaySubject,
  Observer, 
  Subscription,
  throwError,
  EMPTY,
} from 'rxjs';

import {
  tap,
  catchError,
  distinctUntilChanged,
  mergeMap,
  switchMap,
} from 'rxjs/operators';
import { ERROR, ERROR_STRATEGY, LoadableRxError } from './error-handling';
import { LoadContext, LOAD_STRATEGY } from './loading-handling';

export interface LoadableObservableOptions {
  switch?: boolean;
  errorStrategy?: ERROR_STRATEGY;
}
export class LoadableObservable<Resource, LoadArguments> extends Observable<Resource> {
  isLoading$: Observable<boolean>;
  private _loadingError$ = new ReplaySubject<Error | null>(1);
  loadingError$ = this._loadingError$
    .pipe(distinctUntilChanged());
  data$: Observable<Resource>;

  private loadContext: LoadContext;

  constructor (
    loadFunction: (loadArguments: LoadArguments) => Observable<Resource>,
    trigger$: Observable<LoadArguments>,
    LoadableObservableOptions: LoadableObservableOptions,
  ) {
    super();
    this._loadingError$.next(null);
    this.loadContext = new LoadContext(LoadableObservableOptions.switch ? LOAD_STRATEGY.only_one_load_at_a_time : LOAD_STRATEGY.default);
    const combinePipe = LoadableObservableOptions.switch ? switchMap : mergeMap;
    this.data$ = trigger$.pipe(
      // handle the triggers error - parse it so later you can know it's from the trigger and rethrow it
      catchError(error => throwError(new LoadableRxError(error, { type: ERROR.triggerError }))),
      tap(() => this.loadContext.registerLoading()),
      tap(() => this._loadingError$.next(null)),
      combinePipe(loadArguments => loadFunction(loadArguments)
        .pipe(catchError(error => {
          this._loadingError$.next(error);
          if (LoadableObservableOptions.errorStrategy === ERROR_STRATEGY.non_terminating) return EMPTY;
          else return throwError(error);
        }))),
      catchError(error => {
        if (error.isLoadableRxError && error.type === ERROR.triggerError) {
          this._loadingError$.next(error.originalError);
          throw error.originalError;
        } else {
          this._loadingError$.next(error);
          throw error;
        }
      }),
      tap(() => this.loadContext.registerLoadEnd()),
    );

    this.isLoading$ = this.loadContext.isLoading$
      .pipe(distinctUntilChanged());
  }

  subscribe(observer?: Partial<Observer<Resource>> | undefined): Subscription;
  subscribe(next: (value: Resource) => void): Subscription;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe(next?: ((value: Resource) => void) | null | undefined, error?: ((error: any) => void) | null | undefined, complete?: (() => void) | null | undefined): Subscription;
  subscribe(next?: unknown, error?: unknown, complete?: unknown): Subscription {
    const observer: Partial<Observer<Resource>> = {};
    if (next) {
      const h = next as Partial<Observer<Resource>>;
      if (
        (h.next && typeof h.next == 'function')
        || (h.error && typeof h.error == 'function')
        || (h.complete && typeof h.complete == 'function')
      ) {
        observer.next = h.next?.bind(h);
        observer.error = h.error?.bind(h);
        observer.complete = h.complete?.bind(h);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (next && typeof next === 'function') observer.next = next as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (error && typeof error === 'function') observer.error = error as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (complete && typeof complete === 'function') observer.complete = complete as any;
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      observer.next = () => {};
    }
    const sub$ = this.data$.subscribe(observer);  


    return new Subscription(() => {
      sub$.unsubscribe();
    });
  }
}
export class LoadTrigger<Resource, LoadArguments> {

  private trigger$: Observable<LoadArguments>;
  constructor (trigger$: Observable<LoadArguments>) {
    this.trigger$ = trigger$;
  }
  
  loadFunction (
    loadFunction: (loadArguments: LoadArguments) => Observable<Resource>, 
    options: LoadableObservableOptions = {
      switch: false,
      errorStrategy: ERROR_STRATEGY.terminate,
    },
  ): LoadableObservable<Resource, LoadArguments> {
    return new LoadableObservable<Resource, LoadArguments>(loadFunction, this.trigger$, options);
  }
}
export class LoadableRx {
  static trigger<Resource, LoadArguments>(trigger$: Observable<LoadArguments>): LoadTrigger<Resource, LoadArguments> {
    return new LoadTrigger<Resource, LoadArguments>(trigger$);
  }
}