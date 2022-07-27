import { 
  BehaviorSubject, 
  distinctUntilChanged, 
  Observable, 
  ReplaySubject, 
  tap, 
  OperatorFunction, 
  Observer, 
  Subscription,
} from 'rxjs';

export enum LOAD_STRATEGY {
  only_one_load_at_a_time = 'only_one_load_at_a_time',
  default = 'default',
}
export interface LoadPipeOptions {
  loadStrategy: LOAD_STRATEGY;
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
  private _loadingError$ = new BehaviorSubject<Error | null>(null);
  loadingError$ = this._loadingError$.asObservable();
  data$: Observable<Resource>;

  private loadContext: LoadContext;

  constructor (
    pipe: OperatorFunction<LoadArguments, Resource>,
    trigger$: Observable<LoadArguments>,
    loadPipeOptions: LoadPipeOptions,
  ) {
    super();
    this.loadContext = new LoadContext(loadPipeOptions.loadStrategy);
    this.data$ = trigger$.pipe(
      tap(() => this.loadContext.registerLoading()),
      tap(() => this._loadingError$.next(null)),
      pipe,
      tap(() => this._loadingError$.next(null)),
      tap(() => this.loadContext.registerLoadEnd()),
    );

    this.isLoading$ = this.loadContext.isLoading$
      .pipe(distinctUntilChanged());
  }

  subscribe(observer?: Partial<Observer<Resource>> | undefined): Subscription;
  subscribe(next: (value: Resource) => void): Subscription;
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
        if (next && typeof next === 'function') observer.next = next as any;
        if (error && typeof error === 'function') observer.error = error as any;
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

  loadPipe (
    pipe: OperatorFunction<LoadArguments, Resource>, 
    options: LoadPipeOptions = {
      loadStrategy: LOAD_STRATEGY.default,
    },
  ): LoadableObservable<Resource, LoadArguments> {
    return new LoadableObservable<Resource, LoadArguments>(pipe, this.trigger$, options);
  }
}
export class LoadableRx {
  static trigger<Resource, LoadArguments>(trigger$: Observable<LoadArguments>): LoadTrigger<Resource, LoadArguments> {
    return new LoadTrigger<Resource, LoadArguments>(trigger$);
  }
}