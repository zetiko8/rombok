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

export interface CreateProcessFunction <Argument, ReturnType>{
  (
    createFn: (
      wrap:
        WrapProcessOperator<
          Argument,
          ReturnType>
      ) => Observable<ReturnType>,
  ): Processor<ReturnType>;
}

export interface WrapProcessOptions {
  terminateOnError?: boolean,
}

export interface WrapProcessOperator <Argument, ReturnType>{
  (
    processFunction: (
      arg: Argument) => Observable<ReturnType>,
      options?: WrapProcessOptions
    ): (
      source$: Observable<Argument>
    ) => Observable<ReturnType>
}

export interface WrapProcessOperator1 <Argument, ReturnType>{
  (
    options: WrapProcessOptions1,
    processFunction: (
      arg: Argument) => Observable<ReturnType>,
    ): (
      source$: Observable<Argument>
    ) => Observable<ReturnType>,
    options?: WrapProcessOptions1,
}

export interface WrapProcessOptions1 {
  inProgress$: Observable<boolean>;
  error$: Observable<Error | null>;
}

export interface Processor<ReturnType> {
  inProgress$: Observable<boolean>,
  error$: Observable<Error | null>,
  data$: Observable<ReturnType>,
}

export const createMergeProcess
  = <Argument, ReturnType>(
    createFn: (
      wrap:
        WrapProcessOperator<
          Argument,
          ReturnType>
      ) => Observable<ReturnType>,
  ): Processor<ReturnType> => {

    let inProgress$!: Observable<boolean>;
    let error$!: Observable<Error | null>;

    const wrap
      = (
        processFunction: (arg: Argument) => Observable<ReturnType>,
        options?: WrapProcessOptions,
      ): (source$: Observable<Argument>) => Observable<ReturnType> => {

        const loadContext
          = new LoadContext(MULTIPLE_EXECUTIONS_STRATEGY.MERGE_MAP);

        inProgress$
        = loadContext.isLoading$
            .pipe(
              startWith(false),
              debounceTime(0),
              distinctUntilChanged(),
            );

        const _error$ = new Subject<Error | null>();
        error$
          = _error$
            .pipe(
              startWith(null),
              distinctUntilChanged(),
            );

        return (
          source$: Observable<Argument>,
        ): Observable<ReturnType> => source$.pipe(
          tap(() => {
            loadContext.registerLoading('a');
            _error$.next(null);
          }),
          mergeMap(arg => {
            return processFunction(arg).pipe(
              catchError(error => {
                _error$.next(error);
                loadContext.registerLoadEnd('a');
                return EMPTY;
              }),
            );
          }),
          tap(() => {
            _error$.next(null);
            loadContext.registerLoadEnd('a');
          }),
        );
      };

    const data$ = createFn(wrap);

    return {
      data$,
      error$,
      inProgress$,
    };
  };

export const createConcatProcess
  = <Argument, ReturnType>(
    createFn: (
      wrap:
        WrapProcessOperator<
          Argument,
          ReturnType>
      ) => Observable<ReturnType>,
  ): Processor<ReturnType> => {

    let inProgress$!: Observable<boolean>;
    let error$!: Observable<Error | null>;

    const wrap
      = (
        processFunction: (arg: Argument) => Observable<ReturnType>,
        options?: WrapProcessOptions,
      ): (source$: Observable<Argument>) => Observable<ReturnType> => {

        const loadContext
          = new LoadContext(MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP);

        inProgress$
        = loadContext.isLoading$
            .pipe(
              startWith(false),
              debounceTime(0),
              distinctUntilChanged(),
            );

        const _error$ = new Subject<Error | null>();
        error$
          = _error$
            .pipe(
              startWith(null),
              distinctUntilChanged(),
            );

        return (
          source$: Observable<Argument>,
        ): Observable<ReturnType> => source$.pipe(
          concatMap(arg => {
            loadContext.registerLoading('a');
            _error$.next(null);
            return processFunction(arg).pipe(
              catchError(error => {
                _error$.next(error);
                loadContext.registerLoadEnd('a');
                return EMPTY;
              }),
            );
          }),
          tap(() => {
            _error$.next(null);
            loadContext.registerLoadEnd('a');
          }),
        );
      };

    const data$ = createFn(wrap);

    return {
      data$,
      error$,
      inProgress$,
    };
  };

export const createSwitchProcess
  = <Argument, ReturnType>(
    createFn: (
      wrap:
        WrapProcessOperator<
          Argument,
          ReturnType>
      ) => Observable<ReturnType>,
  ): Processor<ReturnType> => {

    let inProgress$!: Observable<boolean>;
    let error$!: Observable<Error | null>;

    const wrap
      = (
        processFunction: (arg: Argument) => Observable<ReturnType>,
        options?: WrapProcessOptions,
      ): (source$: Observable<Argument>) => Observable<ReturnType> => {

        const loadContext
          = new LoadContext(MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP);

        inProgress$
        = loadContext.isLoading$
            .pipe(
              startWith(false),
              debounceTime(0),
              distinctUntilChanged(),
            );

        const _error$ = new Subject<Error | null>();
        error$
          = _error$
            .pipe(
              startWith(null),
              distinctUntilChanged(),
            );

        return (
          source$: Observable<Argument>,
        ): Observable<ReturnType> => source$.pipe(
          tap(() => {
            loadContext.registerLoading('a');
            _error$.next(null);
          }),
          switchMap(arg => {
            return processFunction(arg).pipe(
              catchError(error => {
                _error$.next(error);
                loadContext.registerLoadEnd('a');
                return EMPTY;
              }),
            );
          }),
          tap(() => {
            _error$.next(null);
            loadContext.registerLoadEnd('a');
          }),
        );
      };

    const data$ = createFn(wrap);

    return {
      data$,
      error$,
      inProgress$,
    };
  };