import {
  Observable,
  ReplaySubject,
} from 'rxjs';
import {
  take,
} from 'rxjs/operators';
import {
  MULTIPLE_EXECUTIONS_STRATEGY,
} from '../loading-handling';
import {
  createConcatProcess,
  createMergeProcess,
  createSwitchProcess,
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
    const process = createConcatProcess<() => Observable<T>, T>(
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
    this.success$ = process.data$;
    this.error$ = process.error$;
    this.inProgress$ = process.inProgress$;
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
    const process = createMergeProcess<() => Observable<T>, T>(
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
    this.success$ = process.data$;
    this.error$ = process.error$;
    this.inProgress$ = process.inProgress$;
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
  private readonly _trigger$
    = new ReplaySubject<() => Observable<T>>(1);
  public readonly success$: Observable<T>;
  public readonly error$: Observable<Error | null>;
  public readonly inProgress$: Observable<boolean>;

  constructor () {
    const process = createSwitchProcess<() => Observable<T>, T>(
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
    this.success$ = process.data$;
    this.error$ = process.error$;
    this.inProgress$ = process.inProgress$;
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