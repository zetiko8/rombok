import { OperatorFunction, pipe, throwError, EMPTY, Subject } from 'rxjs';
import { tap, catchError } from 'rxjs';
import { ERROR_STRATEGY } from './error-handling';
import { LoadContext } from './loading-handling';

export function registerLoadingStartEvent<T>(loadContext: LoadContext): OperatorFunction<T, T> {
  return  pipe(tap(() => loadContext.registerLoading()));
}

export function registerLoadingEndEvent<T>(loadContext: LoadContext): OperatorFunction<T, T> {
  return  pipe(tap(() => loadContext.registerLoadEnd()));
}

export function handleLoadFunctionError<T>(errorStrategy: ERROR_STRATEGY, errorNotificationSubject$: Subject<Error | null>): OperatorFunction<T, T> {
  return pipe(catchError(error => {
    errorNotificationSubject$.next(error);
    if (errorStrategy === ERROR_STRATEGY.non_terminating) return EMPTY;
    else return throwError(() => error);
  }));
}

export function handleError<T>(errorNotificationSubject$: Subject<Error | null>): OperatorFunction<T, T> {
  return pipe(catchError(error => {
    errorNotificationSubject$.next(error);
    return throwError(() => error);
  }));
}

