import {
  asyncScheduler,
  Observable,
  ReplaySubject,
  BehaviorSubject,
  throwError,
  Subject,
  of,
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
} from 'rxjs/operators';
import { LOAD_STRATEGY, LoadContext, LoadContext1, MULTIPLE_EXECUTIONS_STRATEGY } from '../loading-handling';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { log } from '~/utils';

export interface IProcess<T> {
    error$: Observable<Error | null>;
    inProgress$: Observable<boolean>;
    success$: Observable<T>;
  }

export class Process<T> implements IProcess<T> {
    private _loadContext: LoadContext1;
    private _inProgress$
     = new BehaviorSubject<boolean>(false);
    private _inProgressIndicator$
     = new BehaviorSubject<boolean>(false);
    // public inProgress$ = this._inProgressIndicator$
    //   .pipe(
    //     observeOn(asyncScheduler),
    //     distinctUntilChanged(),
    //   );
    public inProgress$: Observable<boolean>;
    private _error$ = new ReplaySubject<null | Error>(1);
    public error$ = this._error$
      .pipe(observeOn(asyncScheduler));
    private _success$ = new Subject<T>();
    public success$ = this._success$
      .pipe(observeOn(asyncScheduler));

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
        = new LoadContext1(this._options.multipleExecutionsStrategy);
      this.inProgress$ = this._loadContext.isLoading$
        .pipe(
          startWith(false),
          observeOn(asyncScheduler),
          distinctUntilChanged(),
        );
    }

    execute<T> (
      processFunction: () => Observable<T>,
    ): Observable<T> {
      if (
        this._options.multipleExecutionsStrategy
        ===
        MULTIPLE_EXECUTIONS_STRATEGY.ONE_BY_ONE
      ) {
        return this._inProgress$
          .pipe(
            filter(bool => !bool),
            take(1),
          )
          .pipe(
            tap(() => {
              this._inProgress$.next(true);
            }),
            observeOn(asyncScheduler),
            tap(() => {
              this._error$.next(null);
              this._loadContext.registerLoading();
              this._inProgressIndicator$.next(true);
            }),
            switchMap(
              () => processFunction()
                .pipe(take(1)),
            ),
            catchError(error => {
              this._inProgress$.next(false);
              this._inProgressIndicator$.next(false);
              this._loadContext.registerLoadEnd();
              this._error$.next(error);
              return throwError(error);
            }),
            tap((result) => {
              this._error$.next(null);
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore - TODO help me
              this._success$.next(result);
              this._inProgress$.next(false);
              this._inProgressIndicator$.next(false);
              this._loadContext.registerLoadEnd();
            }),
            take(1),
          );
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
              this._loadContext.registerLoading();
              this._inProgressIndicator$.next(true);
            }),
            switchMap(
              () => processFunction()
                .pipe(take(1)),
            ),
            catchError(error => {
              this._inProgress$.next(false);
              this._inProgressIndicator$.next(false);
              this._loadContext.registerLoadEnd();
              this._error$.next(error);
              return throwError(error);
            }),
            tap((result) => {
              this._error$.next(null);
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore - TODO help me
              this._success$.next(result);
              this._inProgress$.next(false);
              this._inProgressIndicator$.next(false);
              this._loadContext.registerLoadEnd();
            }),
            take(1),
          );
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