import {
  asyncScheduler,
  Observable,
  ReplaySubject,
  BehaviorSubject,
  throwError,
  Subject,
} from 'rxjs';
import {
  catchError,
  observeOn,
  switchMap,
  tap,
  filter,
  take,
} from 'rxjs/operators';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { log } from '~/utils';

export enum MULTIPLE_EXECUTIONS_STRATEGY {
  CONCURRENT,
  ONE_BY_ONE,
  SWITCH_MAP,
}

export interface IProcess<T> {
    error$: Observable<Error | null>;
    inProgress$: Observable<boolean>;
    success$: Observable<T>;
  }

export class Process<T> implements IProcess<T> {
    private _inProgress$
     = new BehaviorSubject<boolean>(false);
    private _inProgressIndicator$
     = new BehaviorSubject<boolean>(false);
    public inProgress$ = this._inProgressIndicator$
      .pipe(
        observeOn(asyncScheduler),
      );
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
              this._inProgressIndicator$.next(true);
            }),
            switchMap(
              () => processFunction()
                .pipe(take(1)),
            ),
            catchError(error => {
              this._inProgress$.next(false);
              this._inProgressIndicator$.next(false);
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