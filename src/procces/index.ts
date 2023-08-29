import {
  asyncScheduler,
  Observable,
  ReplaySubject,
  BehaviorSubject,
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
  filter,
  take,
  distinctUntilChanged,
  startWith,
  share,
  map,
  mergeMap,
  delay,
} from 'rxjs/operators';
import { LoadContext, MULTIPLE_EXECUTIONS_STRATEGY } from '../loading-handling';
import { randomString } from '../helpers';

class Pipeline<T> {
  private readonly line: { execute$: Subject<0|1>, result$: Observable<T> }[] = [];
  private readonly ready$ = new BehaviorSubject<boolean>(false);

  add (load$: Observable<T>): Observable<T> {
    const execute$ = new ReplaySubject<0|1>(1);
    const result$ = execute$.pipe(
      mergeMap(delayTime => {
        return of(1)
          .pipe(delay(delayTime));
      }),
      mergeMap(() => load$),
      catchError(err => {
        let index!: number;
        this.line.find((v, i) => {
          const found = v.execute$ === execute$;
          if (found) index = i;
          return found;
        });
        this.finishPipeItem(index);
        return throwError(() => err);
      }),
      tap(() => {
        let index!: number;
        this.line.find((v, i) => {
          const found = v.execute$ === execute$;
          if (found) index = i;
          return found;
        });
        this.finishPipeItem(index);
      }),
    );
    this.line.push({
      execute$,
      result$,
    });

    if (this.line.length === 1) {
      this.executeNext(0);
    }

    return result$;
  }

  private executeNext (type: 0|1) {
    this.line[0].execute$.next(type);
  }

  private finishPipeItem (index: number) {
    this.line.splice(index, 1);
    if (this.line.length !== 0) this.executeNext(1);
  }
}

export interface IProcess<T> {
    error$: Observable<Error | null>;
    inProgress$: Observable<boolean>;
    success$: Observable<T>;
  }

export class Process<T> implements IProcess<T> {
    private _loadContext: LoadContext;
    private _inProgress$
     = new BehaviorSubject<boolean>(false);
    public inProgress$: Observable<boolean>;
    private _error$ = new ReplaySubject<null | Error>(1);
    public error$ = this._error$
      .pipe(observeOn(asyncScheduler));
    private readonly _success$ = new Subject<T>();
    public readonly success$: Observable<T>;

    private readonly _trigger
      = new ReplaySubject<() => Observable<T>>(1);
    private readonly _pipeline$ = new Pipeline<T>();

    private _options: {
      multipleExecutionsStrategy: MULTIPLE_EXECUTIONS_STRATEGY,
    };

    constructor (options: {
      multipleExecutionsStrategy: MULTIPLE_EXECUTIONS_STRATEGY,
    } = {
      multipleExecutionsStrategy:
        MULTIPLE_EXECUTIONS_STRATEGY.ONE_BY_ONE,
    }) {
      this._options = options;

      this._loadContext
        = new LoadContext(this._options.multipleExecutionsStrategy);
      this.inProgress$ = this._loadContext.isLoading$
        .pipe(
          startWith(false),
          observeOn(asyncScheduler),
          distinctUntilChanged(),
        );

      if (
        this._options.multipleExecutionsStrategy
          ===
          MULTIPLE_EXECUTIONS_STRATEGY.ONE_BY_ONE
      ) {
        this.success$ = this._success$
          .pipe(
            observeOn(asyncScheduler),
            distinctUntilChanged(),
          );
      }
      else if (
        this._options.multipleExecutionsStrategy
          ===
          MULTIPLE_EXECUTIONS_STRATEGY.CONCURRENT
      ) {
        this.success$ = this._success$
          .pipe(
            observeOn(asyncScheduler),
            distinctUntilChanged(),
          );
      }
      else if (
        this._options.multipleExecutionsStrategy
          ===
          MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP
      ) {
        this.success$
          = this._trigger
            .pipe(
              switchMap(fn => fn()),
              observeOn(asyncScheduler),
              distinctUntilChanged(),
            );
      }
      else throw Error('Not implemented jet');
    }

    execute (
      processFunction: () => Observable<T>,
    ): Observable<T> {
      if (
        this._options.multipleExecutionsStrategy
        ===
        MULTIPLE_EXECUTIONS_STRATEGY.ONE_BY_ONE
      ) {
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
            take(1),
            share({ connector: () => new ReplaySubject<T>(1) }),
          )) as Observable<T>;

        return this._pipeline$.add(load$);
      }
      else if (
        this._options.multipleExecutionsStrategy
        ===
        MULTIPLE_EXECUTIONS_STRATEGY.CONCURRENT
      ) {
        return of('immediate')
          .pipe(
            tap(() => {
              this._inProgress$.next(true);
            }),
            observeOn(asyncScheduler),
            tap(() => {
              this._error$.next(null);
              this._loadContext.registerLoading('');
            }),
            switchMap(
              () => processFunction()
                .pipe(take(1)),
            ),
            catchError(error => {
              this._inProgress$.next(false);
              this._loadContext.registerLoadEnd('');
              this._error$.next(error);
              return throwError(error);
            }),
            tap((result) => {
              this._error$.next(null);
              this._success$.next(result);
              this._inProgress$.next(false);
              this._loadContext.registerLoadEnd('');
            }),
            take(1),
          );
      }
      else if (
        this._options.multipleExecutionsStrategy
        ===
        MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP
      ) {

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
            take(1),
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
      else throw Error('Not implemented jet');
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