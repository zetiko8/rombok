import {
  asyncScheduler,
  EMPTY,
  merge,
  Observable,
  ReplaySubject,
  combineLatest,
} from 'rxjs';
import {
  catchError,
  observeOn,
  shareReplay,
  switchMap,
  tap,
  take,
  map,
  startWith,
  mergeMap,
  share,
} from 'rxjs/operators';
import { Process } from '../procces/index';
import { LoadContext, MULTIPLE_EXECUTIONS_STRATEGY } from '../loading-handling';

export interface ResourceOptions {
    multiple_executions_strategy: MULTIPLE_EXECUTIONS_STRATEGY,
}

export class Resource <LoadingArguments, ResourceType> {
    private _trigger$ = new ReplaySubject<LoadingArguments>();
    private loadFn: (args: LoadingArguments) => Observable<ResourceType>;

    public inProgress$: Observable<boolean>;
    public error$: Observable<Error | null>;
    public data$: Observable<ResourceType>;

    constructor (
      trigger$: Observable<LoadingArguments>,
      loadingFunction: (args: LoadingArguments) => Observable<ResourceType>,
      options: ResourceOptions = {
        multiple_executions_strategy: MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP,
      },
    ) {
      this.loadFn = loadingFunction;

      if (
        options.multiple_executions_strategy
        ===
        MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP
      ) {

        const process
        = new Process<ResourceType>({
          multipleExecutionsStrategy:
             MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP,
        });

        this.data$ = merge(
          trigger$,
          this._trigger$,
        )
          .pipe(
            mergeMap(args =>
              process.execute(
                () => this.loadFn(args))
                .pipe(catchError(() => EMPTY))),
            share({
              connector: () => new ReplaySubject<ResourceType>(1),
            }),
          );

        this.inProgress$
            = process.inProgress$;
        this.error$
            = process.error$;
      }
      else if (
        options.multiple_executions_strategy
        ===
        MULTIPLE_EXECUTIONS_STRATEGY.MERGE_MAP
      ) {

        const process
        = new Process<ResourceType>({
          multipleExecutionsStrategy:
             MULTIPLE_EXECUTIONS_STRATEGY.MERGE_MAP,
        });

        this.data$ = merge(
          trigger$,
          this._trigger$,
        )
          .pipe(
            mergeMap(args =>
              process.execute(
                () => this.loadFn(args))
                .pipe(catchError(() => EMPTY))),
            share({
              connector: () => new ReplaySubject<ResourceType>(1),
            }),
          );

        this.inProgress$
          = process.inProgress$;
        this.error$
          = process.error$;
      }
      else {

        const loadContext
        = new LoadContext(options.multiple_executions_strategy);

        const _loadingError$ = new ReplaySubject<Error | null>(1);
        this.error$ = _loadingError$
          .pipe(observeOn(asyncScheduler));

        this.inProgress$
        = loadContext.isLoading$
            .pipe(
              startWith(false),
              observeOn(asyncScheduler),
            );

        this.data$ = merge(
          trigger$,
          this._trigger$,
        )
          .pipe(
            tap(() => {
              _loadingError$.next(null);
              loadContext.registerLoading('');
            }),
            switchMap(args => {
              return this.loadFn(args)
                .pipe(
                  catchError(error => {
                    _loadingError$.next(error);
                    loadContext.registerLoadEnd('');
                    return EMPTY;
                  }),
                );
            }),
            tap(() => {
              _loadingError$.next(null);
              loadContext.registerLoadEnd('');
            }),
            share({
              connector: () => new ReplaySubject<ResourceType>(1),
            }),
          );
      }
    }

    load (args: LoadingArguments): void {
      this._trigger$.next(args);
    }
}

