import {
  BehaviorSubject,
  EMPTY,
  Observable,
  SubjectLike,
} from 'rxjs';
import {
  catchError,
  concatMap,
  distinctUntilChanged,
  mergeMap,
  switchMap,
  tap,
} from 'rxjs/operators';
import {
  SwitchConcatLoadContext,
  ILoadContext,
  MergeLoadContext,
} from './loading-handling';
import {
  CreateProcessFunction,
  CreatorCallback,
  WrapProcessOperator,
} from './proccesor.types';

// TODO - unsubscribing, error handling

const changeBoth = (
  loadContext: ILoadContext,
  error$: SubjectLike<Error | null>,
  inProgress: boolean,
  error: Error | null,
): void => {
  inProgress && loadContext.registerLoading();
  !inProgress && loadContext.registerLoadEnd();
  error$.next(error);
};

const createContext = (
  loadContext: ILoadContext,
): {
  doChange: (inProgress: boolean, error: Error | null) => void;
  isLoading$: Observable<boolean>;
  error$: Observable<Error | null>;
} => {
  const error$
    = new BehaviorSubject<Error | null>(null);
  const doChange
    = changeBoth.bind(null, loadContext, error$);

  return {
    doChange,
    isLoading$: loadContext.isLoading$,
    error$: error$.pipe(distinctUntilChanged()),
  };
};

export const createMergeProcess: CreateProcessFunction
  = <Argument, ReturnType>(
    creator: CreatorCallback<Argument, ReturnType>,
  ) => {

    let inProgress$!: Observable<boolean>;
    let error$!: Observable<Error | null>;

    const wrap: WrapProcessOperator<Argument, ReturnType>
      = (processFunction, options) => {

        const context = createContext(new MergeLoadContext());
        inProgress$ = context.isLoading$;
        error$ = context.error$;

        return (
          source$: Observable<Argument>,
        ): Observable<ReturnType> => source$.pipe(
          mergeMap(arg => {
            context.doChange(true, null);
            return processFunction(arg).pipe(
              catchError(error => {
                context.doChange(false, error);
                return EMPTY;
              }),
            );
          }),
          tap(() => {
            context.doChange(false, null);
          }),
        );
      };

    const data$ = creator(wrap);

    return {
      data$,
      error$,
      inProgress$,
    };
  };

export const createConcatProcess: CreateProcessFunction
  = <Argument, ReturnType>(
    creator: CreatorCallback<Argument, ReturnType>,
  ) => {

    let inProgress$!: Observable<boolean>;
    let error$!: Observable<Error | null>;

    const wrap: WrapProcessOperator<Argument, ReturnType>
      = (processFunction, options) => {

        const context = createContext(new SwitchConcatLoadContext());
        inProgress$ = context.isLoading$;
        error$ = context.error$;

        return (
          source$: Observable<Argument>,
        ): Observable<ReturnType> => source$.pipe(
          concatMap(arg => {
            context.doChange(true, null);
            return processFunction(arg).pipe(
              catchError(error => {
                context.doChange(false, error);
                return EMPTY;
              }),
            );
          }),
          tap(() => {
            context.doChange(false, null);
          }),
        );
      };

    const data$ = creator(wrap);

    return {
      data$,
      error$,
      inProgress$,
    };
  };

export const createSwitchProcess: CreateProcessFunction
  = <Argument, ReturnType>(
    creator: CreatorCallback<Argument, ReturnType>,
  ) => {

    let inProgress$!: Observable<boolean>;
    let error$!: Observable<Error | null>;

    const wrap: WrapProcessOperator<Argument, ReturnType>
      = (processFunction, options) => {

        // TODO - switch and concat loadContext seem to be interchangeable
        const context = createContext(new SwitchConcatLoadContext());
        inProgress$ = context.isLoading$;
        error$ = context.error$;

        return (
          source$: Observable<Argument>,
        ): Observable<ReturnType> => source$.pipe(
          switchMap(arg => {
            context.doChange(true, null);
            return processFunction(arg).pipe(
              catchError(error => {
                context.doChange(false, error);
                return EMPTY;
              }),
            );
          }),
          tap(() => {
            context.doChange(false, null);
          }),
        );
      };

    const data$ = creator(wrap);

    return {
      data$,
      error$,
      inProgress$,
    };
  };