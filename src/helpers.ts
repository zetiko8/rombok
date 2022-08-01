import { OperatorFunction, pipe, throwError, EMPTY, Subject, map } from 'rxjs';
import { tap, catchError } from 'rxjs';
import { logger } from './debug-helpers';
import { ERROR_STRATEGY, TriggerError } from './error-handling';
import { LoadContext } from './loading-handling';

export function registerLoadingStartEvent<T>(loadContext: LoadContext): OperatorFunction<T, T> {
  return  pipe(tap(() => {
    logger.debug('registerLoadingStartEvent pipe');
    return loadContext.registerLoading();
  }));
}

export function registerLoadingEndEvent<T>(loadContext: LoadContext): OperatorFunction<T, T> {
  return  pipe(tap(() => {
    logger.debug('registerLoadingEndEvent pipe');
    return loadContext.registerLoadEnd();
  }));
}

export function handleLoadFunctionError<T>(errorStrategy: ERROR_STRATEGY, errorNotificationSubject$: Subject<Error | null>, loadContext: LoadContext): OperatorFunction<T, T> {
  return pipe(catchError(error => {
    logger.debug('handleLoadFunctionError pipe');
    errorNotificationSubject$.next(error);
    loadContext.registerLoadEnd();
    if (errorStrategy === ERROR_STRATEGY.non_terminating) return EMPTY;
    else return throwError(() => error);
  }));
}

export function handleError<T>(errorNotificationSubject$: Subject<Error | null>, loadContext: LoadContext): OperatorFunction<T, T> {
  return pipe(
    catchError(error => {
      if (error.isTriggerError) {
        logger.debug('handleError pipe - isTriggerError');
        errorNotificationSubject$.next(error.originalError);
        return throwError(() => error.originalError);
      } else {
        logger.debug('handleError pipe');
        errorNotificationSubject$.next(error);
        loadContext.registerLoadEnd();
        return throwError(() => error);
      }
    }),
  );
}

export function handleAndCodifyTriggerError<T>(): OperatorFunction<T, T> {
  return pipe(
    catchError(error => {
      return throwError(() => new TriggerError(error));
    }),
  );
}

