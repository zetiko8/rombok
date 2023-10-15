import {
  BehaviorSubject,
  EMPTY,
  Observable,
} from 'rxjs';
import {
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  mergeMap,
  switchMap,
  tap,
} from 'rxjs/operators';
import {
  ConcatLoadContext,
  MergeLoadContext,
  SwitchLoadContext,
} from './loading-handling';

// TODO - unsubscribing, error handling

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
          = new MergeLoadContext();

        inProgress$
        = loadContext.isLoading$
            .pipe(
              debounceTime(0),
              distinctUntilChanged(),
            );

        const _error$ = new BehaviorSubject<Error | null>(null);
        error$
          = _error$
            .pipe(
              distinctUntilChanged(),
            );

        return (
          source$: Observable<Argument>,
        ): Observable<ReturnType> => source$.pipe(
          tap(() => {
            loadContext.registerLoading();
            _error$.next(null);
          }),
          mergeMap(arg => {
            return processFunction(arg).pipe(
              catchError(error => {
                _error$.next(error);
                loadContext.registerLoadEnd();
                return EMPTY;
              }),
            );
          }),
          tap(() => {
            _error$.next(null);
            loadContext.registerLoadEnd();
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
          = new ConcatLoadContext();

        inProgress$
        = loadContext.isLoading$
            .pipe(
              debounceTime(0),
              distinctUntilChanged(),
            );

        const _error$ = new BehaviorSubject<Error | null>(null);
        error$
              = _error$
            .pipe(
              distinctUntilChanged(),
            );

        return (
          source$: Observable<Argument>,
        ): Observable<ReturnType> => source$.pipe(
          concatMap(arg => {
            loadContext.registerLoading();
            _error$.next(null);
            return processFunction(arg).pipe(
              catchError(error => {
                _error$.next(error);
                loadContext.registerLoadEnd();
                return EMPTY;
              }),
            );
          }),
          tap(() => {
            _error$.next(null);
            loadContext.registerLoadEnd();
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
          = new SwitchLoadContext();

        inProgress$
        = loadContext.isLoading$
            .pipe(
              debounceTime(0),
              distinctUntilChanged(),
            );

        const _error$ = new BehaviorSubject<Error | null>(null);
        error$
              = _error$
            .pipe(
              distinctUntilChanged(),
            );

        return (
          source$: Observable<Argument>,
        ): Observable<ReturnType> => source$.pipe(
          tap(() => {
            loadContext.registerLoading();
            _error$.next(null);
          }),
          switchMap(arg => {
            return processFunction(arg).pipe(
              catchError(error => {
                _error$.next(error);
                loadContext.registerLoadEnd();
                return EMPTY;
              }),
            );
          }),
          tap(() => {
            _error$.next(null);
            loadContext.registerLoadEnd();
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