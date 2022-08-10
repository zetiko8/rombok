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

export interface LoadableObservableOptions {
  switch?: boolean;
  errorStrategy?: ERROR_STRATEGY;
}

interface LoadableObservableOptionsDefined {
  switch: boolean;
  errorStrategy: ERROR_STRATEGY;
}
export class LoadableRx<T> {
  loadFunction: (trigg: unknown) => Observable<T>;
  options: LoadableObservableOptionsDefined;
  isLoading$: Observable<boolean>;
  _loadingError$ = new ReplaySubject<Error | null>(1);
  loadingError$ = this._loadingError$
    .pipe(
      tap(() => logger.debug('Nexted _loadingError')),
      distinctUntilChanged(),
    );
  loadContext: LoadContext;
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
    this.setError(null);
    
    // setup loading state
    const loadStrategy = opts.switch ? LOAD_STRATEGY.only_one_load_at_a_time : LOAD_STRATEGY.default;
    const loadContext = new LoadContext(loadStrategy);
    this.isLoading$ = loadContext.isLoading$;
    this.loadContext = loadContext;
  }

  setError (state: null | Error): void {
    logger.debug('setError', state);
    this._loadingError$.next(state);
  }
}

export function loadableRx<T>(
  loadableRxDefinition: LoadableRx<T>,
): OperatorFunction<unknown, T> {
  const combinePipe = loadableRxDefinition.options.switch ? switchMap : mergeMap;
  return pipe(
    handleAndCodifyTriggerError(),
    registerLoadingStartEvent(loadableRxDefinition.loadContext),
    tap(() => loadableRxDefinition._loadingError$.next(null)),
    combinePipe(loadArguments => 
      loadableRxDefinition.loadFunction(loadArguments)
        .pipe(handleLoadFunctionError(loadableRxDefinition.options.errorStrategy, loadableRxDefinition._loadingError$, loadableRxDefinition.loadContext)),
    ),
    registerLoadingEndEvent(loadableRxDefinition.loadContext),
    handleError(loadableRxDefinition.setError.bind(loadableRxDefinition), loadableRxDefinition.loadContext),
  );
}
