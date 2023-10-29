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
import {
  CreateProcessFunction,
} from '../proccesor.types';

export interface IProcess<T> {
  error$: Observable<Error | null>;
  inProgress$: Observable<boolean>;
  success$: Observable<T>;
}

function getWrapProcessFunction (
  multipleExecutionsStrategy: MULTIPLE_EXECUTIONS_STRATEGY,
): CreateProcessFunction {
  switch (multipleExecutionsStrategy) {
  case MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP:
    return createConcatProcess;
  case MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP:
    return createSwitchProcess;
  default:
    return createMergeProcess;
  }
}

export class Process<T> implements IProcess<T> {
  private readonly _trigger$
    = new ReplaySubject<() => Observable<T>>(1);
  public readonly success$: Observable<T>;
  public readonly error$: Observable<Error | null>;
  public readonly inProgress$: Observable<boolean>;

  constructor (
    options: {
      multipleExecutionsStrategy:
        MULTIPLE_EXECUTIONS_STRATEGY
    } = {
      multipleExecutionsStrategy:
        MULTIPLE_EXECUTIONS_STRATEGY.MERGE_MAP,
    },
  ) {
    const process = getWrapProcessFunction(
      options.multipleExecutionsStrategy,
    )<() => Observable<T>, T>(
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

export class BoundProcess<Argument, ReturnType> implements IProcess<ReturnType> {

  private _process: Process<ReturnType>;
  error$: Observable<Error | null>;
  inProgress$: Observable<boolean>;
  success$: Observable<ReturnType>;

  private _processFunction: (arg: Argument) => Observable<ReturnType>;

  constructor (
    processFunction: (arg: Argument) => Observable<ReturnType>,
    options: {
        multipleExecutionsStrategy:
          MULTIPLE_EXECUTIONS_STRATEGY
      } = {
      multipleExecutionsStrategy:
          MULTIPLE_EXECUTIONS_STRATEGY.MERGE_MAP,
    },
  ) {
    this._process = new Process(options);
    this.error$ = this._process.error$;
    this.inProgress$ = this._process.inProgress$;
    this.success$ = this._process.success$;
    this._processFunction = processFunction;
  }

  execute (arg: Argument): Observable<ReturnType> {
    return this._process
      .execute(
        () => this._processFunction(arg),
      );
  }
}