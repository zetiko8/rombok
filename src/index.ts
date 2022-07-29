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
import { ERROR_STRATEGY } from './error-handling';
import { handleError, handleLoadFunctionError, registerLoadingEndEvent, registerLoadingStartEvent } from './helpers';
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


  constructor (
    loadFunction: (loadArguments: LoadArguments) => Observable<Resource>,
    trigger$: Observable<LoadArguments>,
    loadableObservableOptions: LoadableObservableOptions,
  ) {
    super();
    const errorStrategy = loadableObservableOptions.errorStrategy || ERROR_STRATEGY.terminate;
    const doSwitch = !!(loadableObservableOptions.switch);
    const loadStrategy = doSwitch ? LOAD_STRATEGY.only_one_load_at_a_time : LOAD_STRATEGY.default;

    // setup initial error state
    this._loadingError$.next(null);

    // setup loading state
    const loadContext = new LoadContext(loadStrategy);
    this.isLoading$ = loadContext.isLoading$;

    const combinePipe = doSwitch ? switchMap : mergeMap;
    this.data$ = trigger$.pipe(
      registerLoadingStartEvent(loadContext),
      tap(() => this._loadingError$.next(null)),
      combinePipe(loadArguments => 
        loadFunction(loadArguments)
          .pipe(handleLoadFunctionError(errorStrategy, this._loadingError$)),
      ),
      handleError(this._loadingError$),
      registerLoadingEndEvent(loadContext),
    );
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