import { OperatorFunction, pipe, throwError, EMPTY } from 'rxjs';
import { tap, catchError } from 'rxjs';
import { logger } from './debug-helpers';
import { ERROR_STRATEGY, TriggerError } from './error-handling';

export function registerLoadingStartEvent<T>(
  registerLoadingStart: () => void): OperatorFunction<T, T> {
  return  pipe(tap(() => {
    logger.debug('registerLoadingStartEvent pipe');
    return registerLoadingStart();
  }));
}

export function registerLoadingEndEvent<T>(
  registerLoadingEnd: () => void): OperatorFunction<T, T> {
  return  pipe(tap(() => {
    logger.debug('registerLoadingEndEvent pipe');
    return registerLoadingEnd();
  }));
}

export function handleLoadFunctionError<T>(
  errorStrategy: ERROR_STRATEGY,
  setError: (errorState: Error | null) => void,
  registerLoadingEnd: () => void,
): OperatorFunction<T, T> {
  return pipe(catchError(error => {
    logger.debug('handleLoadFunctionError pipe');
    setError(error);
    registerLoadingEnd();
    if (errorStrategy === ERROR_STRATEGY.non_terminating)
      return EMPTY;
    else return throwError(() => error);
  }));
}

export function handleError<T>(
  setError: (errorState: Error | null) => void,
  registerLoadingEnd: () => void): OperatorFunction<T, T> {
  return pipe(
    catchError(error => {
      if (error.isTriggerError) {
        logger.debug('handleError pipe - isTriggerError');
        setError(error.originalError);
        return throwError(() => error.originalError);
      } else {
        logger.debug('handleError pipe');
        setError(error);
        registerLoadingEnd();
        return throwError(() => error);
      }
    }),
  );
}

export function handleAndCodifyTriggerError<T>()
: OperatorFunction<T, T> {
  return pipe(
    catchError(error => {
      logger.debug('handleAndCodifyTriggerError');
      return throwError(() => new TriggerError(error));
    }),
  );
}

