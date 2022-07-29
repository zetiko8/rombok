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

export enum ERROR_STRATEGY {
  terminate = 'terminate',
  non_terminating = 'non_terminating',
}
enum ERROR {
  loadPipeError,
  triggerError,
  unknown,
}

export class LoadableRxError extends Error {
  isLoadableRxError = true;
  type: ERROR = ERROR.unknown;
  originalError: Error;
  constructor(
    message: string | Error | LoadableRxError | unknown,
    options: { type?: ERROR } = {},
  ) {
    super('');
    if (message instanceof LoadableRxError || message instanceof Error) {
      this.message = message.message;
      this.stack = message.stack;
      if (message instanceof LoadableRxError) {
        this.originalError = message.originalError;
        this.type = message.type;
      } else {
        this.originalError = message;
      }
    } else {
      this.message = typeof message === 'string' ? message : 'Unknown';
      this.originalError = new Error();
      this.originalError.stack = this.stack;
      this.originalError.message = this.message;
    } 

    if (options.type !== undefined) {
      this.type = options.type;
    }
  }
}

export enum LOAD_STRATEGY {
  only_one_load_at_a_time = 'only_one_load_at_a_time',
  default = 'default',
}
export interface LoadPipeOptions {
  switch?: boolean;
  errorStrategy?: ERROR_STRATEGY,
}
class ExecutingPipe {
  private _hasEnded = false;
  registerLoadPipeEnd () {
    this._hasEnded = true;
  }

  get hasEnded () {
    return this._hasEnded;
  }
}

class OnlyOneLoadAtTimeLoadingContext {
  private pipes: ExecutingPipe[] = [];

  registerLoading () {
    this.pipes.push(new ExecutingPipe());
    this.setLoadingState();
  }

  registerLoadEnd () {
    this.pipes[this.pipes.length - 1]?.registerLoadPipeEnd();
    this.setLoadingState();
  }

  private setLoadingState () {
    this._isLoading$.next(this.isLoading());
  }
  
  private isLoading () {
    if (!this.pipes.length) {
      return false;
    } else {
      return !(this.pipes[this.pipes.length - 1]?.hasEnded); 
    }
  }

  private _isLoading$ = new ReplaySubject<boolean>(1);
  isLoading$ = this._isLoading$.asObservable();
}
class MultipleLoadsAtTimeLoadingContext {
  private loadPipeCount = 0;

  registerLoading () {
    this.loadPipeCount++;
    this.setLoadingState();
  }

  registerLoadEnd () {
    this.loadPipeCount--;
    this.setLoadingState();
  }

  private setLoadingState () {
    this._isLoading$.next(this.isLoading());
  }
  
  private isLoading () {
    return this.loadPipeCount > 0;
  }

  private _isLoading$ = new ReplaySubject<boolean>(1);
  isLoading$ = this._isLoading$.asObservable();
}
class LoadContext {
  private _implementation: OnlyOneLoadAtTimeLoadingContext | MultipleLoadsAtTimeLoadingContext;
  registerLoading: () => void;
  registerLoadEnd: () => void;
  isLoading$: Observable<boolean>

  constructor (loadStrategy = LOAD_STRATEGY.default) {
    if (loadStrategy === LOAD_STRATEGY.only_one_load_at_a_time) this._implementation = new OnlyOneLoadAtTimeLoadingContext();
    else this._implementation = new MultipleLoadsAtTimeLoadingContext();
    this.registerLoadEnd = this._implementation.registerLoadEnd.bind(this._implementation);
    this.registerLoading = this._implementation.registerLoading.bind(this._implementation);
    this.isLoading$ = this._implementation.isLoading$;
  }

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
    loadPipeOptions: LoadPipeOptions,
  ) {
    super();
    this._loadingError$.next(null);
    this.loadContext = new LoadContext(loadPipeOptions.switch ? LOAD_STRATEGY.only_one_load_at_a_time : LOAD_STRATEGY.default);
    const combinePipe = loadPipeOptions.switch ? switchMap : mergeMap;
    this.data$ = trigger$.pipe(
      // handle the triggers error - parse it so later you can know it's from the trigger and rethrow it
      catchError(error => throwError(new LoadableRxError(error, { type: ERROR.triggerError }))),
      tap(() => this.loadContext.registerLoading()),
      tap(() => this._loadingError$.next(null)),
      combinePipe(loadArguments => loadFunction(loadArguments)
        .pipe(catchError(error => {
          this._loadingError$.next(error);
          if (loadPipeOptions.errorStrategy === ERROR_STRATEGY.non_terminating) return EMPTY;
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
    options: LoadPipeOptions = {
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