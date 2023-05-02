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
import { LoadContext1, MULTIPLE_EXECUTIONS_STRATEGY } from '../loading-handling';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { log } from '../utils';

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
        MULTIPLE_EXECUTIONS_STRATEGY.ONE_BY_ONE
      ) {

        const process
        = new Process<ResourceType>({
          multipleExecutionsStrategy:
             MULTIPLE_EXECUTIONS_STRATEGY.ONE_BY_ONE,
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
        MULTIPLE_EXECUTIONS_STRATEGY.CONCURRENT
      ) {

        const process
        = new Process<ResourceType>({
          multipleExecutionsStrategy:
             MULTIPLE_EXECUTIONS_STRATEGY.CONCURRENT,
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
        = new LoadContext1(options.multiple_executions_strategy);

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
              loadContext.registerLoading();
            }),
            switchMap(args => {
              return this.loadFn(args)
                .pipe(
                  catchError(error => {
                    _loadingError$.next(error);
                    loadContext.registerLoadEnd();
                    return EMPTY;
                  }),
                );
            }),
            tap(() => {
              _loadingError$.next(null);
              loadContext.registerLoadEnd();
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

export class CRUDResource<LoadingArguments, ResourceType> {
    private _internalTrigger$ = new ReplaySubject<LoadingArguments>(1);
    private _trigger$: Observable<LoadingArguments>;

    private resource: Resource<LoadingArguments, ResourceType>;
    public data$: Observable<ResourceType>;
    public isReading$: Observable<boolean>;
    public readError$: Observable<Error | null>;

    private createProcess = new Process();
    public isCreating$ = this.createProcess.inProgress$;
    public createError$ = this.createProcess.error$;

    private updateProcess = new Process();
    public isUpdating$ = this.updateProcess.inProgress$;
    public updateError$ = this.updateProcess.error$;

    private deleteProcess = new Process();
    public isDeleting$ = this.deleteProcess.inProgress$;
    public deleteError$ = this.deleteProcess.error$;

    public isProcessing$: Observable<boolean>;
    public processingError$: Observable<boolean>;

    constructor (
      readTrigger$: Observable<LoadingArguments>,
      loadingFunction: (args: LoadingArguments) => Observable<ResourceType>,
    ) {
      this._trigger$ = merge(
        this._internalTrigger$,
        readTrigger$,
      );

      this.resource
            = new Resource(
          this._trigger$,
          loadingFunction,
        );

      this.isReading$ = this.resource.inProgress$;
      this.readError$ = this.resource.error$;
      this.data$ = this.resource.data$;
      this.isProcessing$ = combineLatest([
        this.isReading$,
        this.isCreating$,
        this.isUpdating$,
        this.isDeleting$,
      ]).pipe(
        map(booleans => booleans.some(bool => bool)),
        shareReplay(1),
      );
      this.processingError$ = combineLatest([
        this.readError$,
        this.createError$,
        this.updateError$,
        this.deleteError$,
      ]).pipe(
        map(booleans => booleans.every(bool => bool)),
        shareReplay(1),
      );
    }

    read (args: LoadingArguments): void {
      this._internalTrigger$.next(args);
    }

    create<T> (
      createFunction: () => Observable<T>)
      : Observable<T>  {
      return this.createProcess
        .execute(createFunction)
        .pipe(
          tap(() => {
            this._trigger$
              .pipe(take(1))
              .subscribe({
                next: data => {
                  this._internalTrigger$.next(data);
                },
              });
          }),
        );
    }

    delete<T> (
      deleteFunction: () => Observable<T>)
      : Observable<T> {
      return this.deleteProcess
        .execute(deleteFunction)
        .pipe(
          tap(() => {
            this._trigger$
              .pipe(take(1))
              .subscribe({
                next: data => this._internalTrigger$.next(data),
              });
          }),
        );
    }

    update<T> (
      updateFunction: () => Observable<T>)
      : Observable<T> {
      return this.updateProcess
        .execute(updateFunction)
        .pipe(
          tap(() => {
            this._trigger$
              .pipe(take(1))
              .subscribe({
                next: data => this._internalTrigger$.next(data),
              });
          }),
        );
    }
}
