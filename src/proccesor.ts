import { EMPTY, Observable, Subject, SubjectLike } from 'rxjs';
import {
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  mergeMap,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';
import {
  LoadContext,
  MULTIPLE_EXECUTIONS_STRATEGY,
} from './loading-handling';

// TODO - unsubscribing, error handling, sharing ?

export interface WrapProcessOperator <Argument, ReturnType>{
  (
    processFunction: (
      arg: Argument) => Observable<ReturnType>,
      options?: WrapProcessOptions
    ): (
      source$: Observable<Argument>
    ) => Observable<ReturnType>
}

export interface WrapProcessOptions {
  terminateOnError?: boolean;
  inProgress$?: SubjectLike<boolean>;
  error$?: SubjectLike<Error | null>;
}

interface WrapProcessOptionsFull {
  terminateOnError: boolean;
  inProgress$: Subject<boolean>;
  error$: Subject<Error | null>;
  loadContext: LoadContext,
}

const getOptionsFull = (
  multipleExecutionsStrategy: MULTIPLE_EXECUTIONS_STRATEGY,
  opts?: WrapProcessOptions,
): WrapProcessOptionsFull => {
  return {
    terminateOnError: opts?.terminateOnError || false ,
    inProgress$: new Subject<boolean>(),
    error$: new Subject<Error | null>(),
    loadContext: new LoadContext(multipleExecutionsStrategy),
  };
};

const setError = (
  options: WrapProcessOptionsFull,
  error: Error | null,
) => {
  options.error$.next(error);
};

const setInProgress = (
  options: WrapProcessOptionsFull,
  inProgress: boolean,
) => {
  if (inProgress) {
    options.loadContext.registerLoading('a');
  }
  else {
    options.loadContext.registerLoadEnd('a');
  }
};

const setUpInProgress = (
  options: WrapProcessOptionsFull,
  inProgress$: SubjectLike<boolean> | undefined,
) => {
  const inProgressSubscription
  = options.loadContext.isLoading$
    .pipe(
      startWith(false),
      debounceTime(0),
      distinctUntilChanged(),
    )
    .subscribe({
      next: (value) => {
        if (inProgress$)
          inProgress$.next(value);
      },
    });

  return inProgressSubscription;
};

const afterCommon = (
  options: WrapProcessOptionsFull,
) => {
  setInProgress(options, false);
  setError(options, null);
};

export const wrapMergeProcess
  = <Argument, ReturnType>(
    processFunction: (arg: Argument) => Observable<ReturnType>,
    options?: WrapProcessOptions,
  ): (source$: Observable<Argument>) => Observable<ReturnType> => {

    const opts = getOptionsFull(
      MULTIPLE_EXECUTIONS_STRATEGY.MERGE_MAP,
      options,
    );

    const inProgressSubscription
      = setUpInProgress(opts, options?.inProgress$);

    const errorSubscription
      = opts.error$
        .pipe(
          distinctUntilChanged(),
        )
        .subscribe({
          next: (value) => {
            if (options?.error$)
              options.error$.next(value);
          },
        });

    setError(opts, null);

    return (
      source$: Observable<Argument>,
    ): Observable<ReturnType> => source$.pipe(
      tap(() => {
        setInProgress(opts, true);
        setError(opts, null);
      }),
      mergeMap(arg => {
        return processFunction(arg).pipe(
          catchError(error => {
            setError(opts, error);
            setInProgress(opts, false);
            return EMPTY;
          }),
        );
      }),
      tap(() => {
        afterCommon(opts);
      }),
    );
  };

export function wrapSwitchProcess<Argument, ReturnType>(
  processFunction: (arg: Argument) => Observable<ReturnType>,
  options?: WrapProcessOptions,
): (source$: Observable<Argument>) => Observable<ReturnType> {

  const opts = getOptionsFull(
    MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP,
    options,
  );

  const inProgressSubscription
  = setUpInProgress(opts, options?.inProgress$);

  const errorSubscription
    = opts.error$
      .pipe(
        distinctUntilChanged(),
      )
      .subscribe({
        next: (value) => {
          if (options?.error$)
            options.error$.next(value);
        },
      });

  setError(opts, null);

  return (
    source$: Observable<Argument>,
  ): Observable<ReturnType> => source$.pipe(
    tap(() => {
      setInProgress(opts, true);
      setError(opts, null);
    }),
    switchMap(arg => {
      return processFunction(arg).pipe(
        catchError(error => {
          setError(opts, error);
          setInProgress(opts, false);
          return EMPTY;
        }),
      );
    }),
    tap(() => {
      afterCommon(opts);
    }),
  );
}

export function wrapConcatProcess<Argument, ReturnType>(
  processFunction: (arg: Argument) => Observable<ReturnType>,
  options?: WrapProcessOptions,
): (source$: Observable<Argument>) => Observable<ReturnType> {

  const opts = getOptionsFull(
    MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP,
    options,
  );

  const inProgressSubscription
  = setUpInProgress(opts, options?.inProgress$);

  const errorSubscription
    = opts.error$
      .pipe(
        distinctUntilChanged(),
      )
      .subscribe({
        next: (value) => {
          if (options?.error$)
            options.error$.next(value);
        },
      });

  setError(opts, null);

  return (
    source$: Observable<Argument>,
  ): Observable<ReturnType> => source$.pipe(
    concatMap(arg => {
      setError(opts, null);
      setInProgress(opts, true);
      return processFunction(arg).pipe(
        catchError(error => {
          setError(opts, error);
          setInProgress(opts, false);
          return EMPTY;
        }),
      );
    }),
    tap(() => {
      afterCommon(opts);
    }),
  );
}