import {
  Observable,
  ReplaySubject,
  OperatorFunction,
  pipe,
} from 'rxjs';

import {
  tap,
  distinctUntilChanged,
  mergeMap,
  switchMap,
} from 'rxjs/operators';
import { logger } from './debug-helpers';
import { ERROR_STRATEGY } from './error-handling';
import { handleAndCodifyTriggerError, handleError, handleLoadFunctionError, registerLoadingEndEvent, registerLoadingStartEvent } from './helpers';
import { LoadContext, LOAD_STRATEGY } from './loading-handling';
export { Process } from './procces';

export interface LoadableObservableOptions {
  switch?: boolean;
  errorStrategy?: ERROR_STRATEGY;
}

interface LoadableObservableOptionsDefined {
  switch: boolean;
  errorStrategy: ERROR_STRATEGY;
}

export class LoadableRx<T> {
  private loadFunction: (trigg: unknown) => Observable<T>;
  private options: LoadableObservableOptionsDefined;
  private _loadingError$ = new ReplaySubject<Error | null>(1);
  private loadContext: LoadContext;

  isLoading$: Observable<boolean>;
  loadingError$ = this._loadingError$
    .pipe(
      tap(() => logger.debug('Nexted _loadingError')),
      distinctUntilChanged(),
    );

  constructor (
    loadFunction: (trigg: unknown) => Observable<T>,
    options?: LoadableObservableOptions,
  ) {
    this.loadFunction = loadFunction;

    const opts: LoadableObservableOptionsDefined = {
      errorStrategy: options?.errorStrategy || ERROR_STRATEGY.terminate,
      switch: options ? !!(options.switch) : false,
    };
    this.options = opts;

    // setup initial error state
    this._setError(null);

    // setup loading state
    const loadStrategy = opts.switch ? LOAD_STRATEGY.only_one_load_at_a_time : LOAD_STRATEGY.default;
    const loadContext = new LoadContext(loadStrategy);
    this.isLoading$ = loadContext.isLoading$;
    this.loadContext = loadContext;
  }

  private _getSettings (): LoadableObservableOptionsDefined  {
    return JSON.parse(JSON.stringify(this.options));
  }

  private _setError (state: null | Error): void {
    logger.debug('setError', state);
    this._loadingError$.next(state);
  }

  private _registerLoadingStart (): void {
    this.loadContext.registerLoading();
  }

  private _registerLoadingEnd (): void {
    this.loadContext.registerLoadEnd();
  }

  private _getLoadFunction (): (trigg: unknown) => Observable<T> {
    return this.loadFunction;
  }
}

export function loadableRx<T>(
  lrx: LoadableRx<T>,
): OperatorFunction<unknown, T> {
  // @ts-expect-error - method is private for the end user not for _internal lib. TODO - try to solve in another way
  const setError = lrx._setError.bind(lrx);
  // @ts-expect-error - method is private for the end user not for _internal lib. TODO - try to solve in another way
  const registerLoadingStart = lrx._registerLoadingStart.bind(lrx);
  // @ts-expect-error - method is private for the end user not for _internal lib. TODO - try to solve in another way
  const registerLoadingEnd = lrx._registerLoadingEnd.bind(lrx);
  // @ts-expect-error - method is private for the end user not for _internal lib. TODO - try to solve in another way
  const loadFn = lrx._getLoadFunction();
  // @ts-expect-error - method is private for the end user not for _internal lib. TODO - try to solve in another way
  const options = lrx._getSettings();
  const combinePipe = options.switch ? switchMap : mergeMap;
  return pipe(
    handleAndCodifyTriggerError(),
    registerLoadingStartEvent(registerLoadingStart),
    tap(() => setError(null)),
    combinePipe(loadArguments =>
      loadFn(loadArguments)
        .pipe(handleLoadFunctionError(options.errorStrategy, setError, registerLoadingEnd)),
    ),
    registerLoadingEndEvent(registerLoadingEnd),
    handleError(setError, registerLoadingEnd),
  );
}

