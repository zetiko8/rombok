import {
  asyncScheduler,
  Observable,
  ReplaySubject,
  throwError,
  Subject,
  of,
  EMPTY,
} from 'rxjs';
import {
  catchError,
  observeOn,
  switchMap,
  tap,
  take,
  distinctUntilChanged,
  startWith,
  share,
  map,
  mergeMap,
  delay,
} from 'rxjs/operators';
import {
  LoadContext,
  MULTIPLE_EXECUTIONS_STRATEGY,
} from '../loading-handling';
import { randomString } from '../helpers';
import {
  createConcatProcess,
  createMergeProcess,
} from '../proccesor';

export interface IProcess<T> {
  error$: Observable<Error | null>;
  inProgress$: Observable<boolean>;
  success$: Observable<T>;
}

interface UnboundProcess<T> extends IProcess<T> {
  execute: {
    (processFunction: () => Observable<T>)
    : Observable<T>
  }
}

export class ConcatMapProcess<T> implements UnboundProcess<T> {
  private readonly _trigger$
    = new ReplaySubject<() => Observable<T>>(1);
  public readonly success$: Observable<T>;
  public readonly error$: Observable<Error | null>;
  public readonly inProgress$: Observable<boolean>;

  constructor () {
    const mergeProcess = createConcatProcess<() => Observable<T>, T>(
      wrap => {
        return this._trigger$
          .pipe(
            wrap(fn => {
              return fn();
            }, {
              share: true,
            }),
          );
      },
    );
    this.success$ = mergeProcess.data$;
    this.error$ = mergeProcess.error$;
    this.inProgress$ = mergeProcess.inProgress$;
  }

  execute (
    processFunction: () => Observable<T>,
  ): Observable<T> {
    const obs$
      = this.success$.pipe(take(1));
    this._trigger$.next(processFunction);
    return obs$;
  }
}
export class MergeMapProcess<T> implements UnboundProcess<T> {
  private readonly _trigger$
    = new ReplaySubject<() => Observable<T>>(1);
  public readonly success$: Observable<T>;
  public readonly error$: Observable<Error | null>;
  public readonly inProgress$: Observable<boolean>;

  constructor () {
    const mergeProcess = createMergeProcess<() => Observable<T>, T>(
      wrap => {
        return this._trigger$
          .pipe(
            wrap(fn => {
              return fn();
            }, {
              share: true,
            }),
          );
      },
    );
    this.success$ = mergeProcess.data$;
    this.error$ = mergeProcess.error$;
    this.inProgress$ = mergeProcess.inProgress$;
  }

  execute (
    processFunction: () => Observable<T>,
  ): Observable<T> {
    const obs$
      = this.success$.pipe(take(1));
    this._trigger$.next(processFunction);
    return obs$;
  }
}

export class SwitchMapProcess<T> implements UnboundProcess<T> {
  private _loadContext
   = new LoadContext(MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP);
  public inProgress$
  = this._loadContext.isLoading$
    .pipe(
      startWith(false),
      observeOn(asyncScheduler),
      distinctUntilChanged(),
    );
  private _error$ = new ReplaySubject<null | Error>(1);
  public error$ = this._error$
    .pipe(
      startWith(null),
      observeOn(asyncScheduler),
      distinctUntilChanged(),
    );

  private readonly _trigger
   = new ReplaySubject<() => Observable<T>>(1);
  private readonly _success$ = new Subject<T>();
  public readonly success$
   = this._trigger
     .pipe(
       switchMap(fn => fn()),
       observeOn(asyncScheduler),
       distinctUntilChanged(),
     );

  execute (
    processFunction: () => Observable<T>,
  ): Observable<T> {
    const load$: Observable<T> = (of('immediate')
      .pipe(
        observeOn(asyncScheduler),
        map(() => randomString()),
        tap((loadToken) => {
          this._error$.next(null);
          this._loadContext.registerLoading(loadToken);
        }),
        switchMap(
          (loadToken) => processFunction()
            .pipe(
              take(1),
              map(result => {
                return {
                  result,
                  hasError:
                false,
                  error: null,
                  loadToken,
                };
              }),
              catchError(error => {
                return of({
                  result: null,
                  hasError: true,
                  error: error,
                  loadToken,
                });
              }),
            ),
        ),
        mergeMap(resultWrapper => {
          if (resultWrapper.hasError) {
            this._loadContext.registerLoadEnd(resultWrapper.loadToken);
            this._error$.next(resultWrapper.error);
            return throwError(() => resultWrapper.error);
          }
          else return of(resultWrapper);
        }),
        tap((resultWrapper) => {
          this._error$.next(null);
          this._success$.next(resultWrapper.result as T);
          this._loadContext.registerLoadEnd(resultWrapper.loadToken);
        }),
        map(r => (r.result) as T),
        share({ connector: () => new ReplaySubject<T>(1) }),
      )) as Observable<T>;

    this._trigger.next(
      () => {
        return load$
          .pipe(
            catchError(() => EMPTY),
          );
      },
    );

    return load$;
  }
}

export class Process<ReturnType> implements IProcess<ReturnType> {

    private _process: UnboundProcess<ReturnType>;
    error$: Observable<Error | null>;
    inProgress$: Observable<boolean>;
    success$: Observable<ReturnType>;
    execute: {
      (processFunction: () => Observable<ReturnType>)
      : Observable<ReturnType>
    }

    constructor (
      options: {
        multipleExecutionsStrategy:
          MULTIPLE_EXECUTIONS_STRATEGY
      } = {
        multipleExecutionsStrategy:
          MULTIPLE_EXECUTIONS_STRATEGY.MERGE_MAP,
      },
    ) {
      this._process = (() => {
        switch (options.multipleExecutionsStrategy) {
        case MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP:
          return new ConcatMapProcess();
        case MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP:
          return new SwitchMapProcess();
        default:
          return new MergeMapProcess();
        }
      })();
      this.error$ = this._process.error$;
      this.inProgress$ = this._process.inProgress$;
      this.success$ = this._process.success$;
      this.execute = this._process.execute.bind(this._process);
    }
}

export class BoundProcess<Arguments, ReturnType> implements IProcess<ReturnType> {

    private _process: Process<ReturnType>;
    error$: Observable<Error | null>;
    inProgress$: Observable<boolean>;
    success$: Observable<ReturnType>;

    private _processFunction: (...args: Arguments[]) => Observable<ReturnType>;

    constructor (
      processFunction: (...args: Arguments[]) => Observable<ReturnType>,
    ) {
      this._process = new Process();
      this.error$ = this._process.error$;
      this.inProgress$ = this._process.inProgress$;
      this.success$ = this._process.success$;
      this._processFunction = processFunction;
    }

    execute (...args: Arguments[]): Observable<ReturnType> {
      return this._process
        .execute(
          () => this._processFunction(...args),
        );
    }
}