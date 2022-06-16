import { BehaviorSubject, catchError, distinctUntilChanged, switchMap, first, map, merge, mergeMap, Observable, of, ReplaySubject, shareReplay, Subject, tap, throwError, OperatorFunction, ObservedValueOf } from 'rxjs';
import { log, logObject, pipeContext } from './utils';

class LoadQueueItem {
  id: number | null;
  constructor (id: number | null = null) {
    this.id = id;
  }
}
enum ACTION {
  REMOVE,
  ADD,
}

export class LoadableObservable<Resource, LoadArguments> extends Observable<Resource> {
  isLoading$ = new ReplaySubject<boolean>();
  loadingError$ = new BehaviorSubject<Error | null>(null);
  data$: Observable<Resource>;

  private loadQueueAdd$ = new ReplaySubject<LoadQueueItem>();
  private loadQueueRemove$ = new ReplaySubject<LoadQueueItem>();
  private loadQueue: LoadQueueItem[] = [];
  private loadQueue$ = 
    merge(
      this.loadQueueAdd$.pipe(map(item => ({ action: ACTION.ADD, item }))),
      this.loadQueueRemove$.pipe(map(item => ({ action: ACTION.REMOVE, item }))),
    ).pipe(
      map(event => {
        switch (event.action) {
        case ACTION.ADD:
          this.loadQueue.push(event.item);
          break;
        case ACTION.REMOVE:
          this.loadQueue = this.loadQueue.filter(i => i !== event.item); 
          break;          
        default:
          break;
        }

        return this.loadQueue;
      }),
      shareReplay(1),
    );

  private internalTrigger$ = new ReplaySubject<LoadArguments>(1);

  constructor (
    pipe: OperatorFunction<LoadArguments, Resource>,
    trigger$?: Observable<LoadArguments>,
  ) {
    super();
    this.data$ = merge(
      this.internalTrigger$,
      trigger$ || new Subject<LoadArguments>(),  
    ).pipe(
      map(args => {
        const r = Math.random();
        const loadQueueItem = new LoadQueueItem(r);
        this.loadQueueAdd$.next(loadQueueItem);
        return { loadQueueItem, value: args };
      }),
      tap(() => this.loadingError$.next(null)),
      mergeMap(context => {
        return of(context.value)
          .pipe(
            // switchMap(() => of(3 as unknown as Resource)),
            pipe,
            map(result => {
              return { loadQueueItem: context.loadQueueItem, value: result };
            }),
          );
      }),
      tap(context => this.loadQueueRemove$.next(context.loadQueueItem)),
      tap(() => this.loadingError$.next(null)),
      map(res => res.value),
      shareReplay(1),
    );

    this.loadQueue$
      .pipe(
        map(queue => !!(queue.length)),
        distinctUntilChanged(),
      )
      .subscribe(bool => this.isLoading$.next(bool));
  }

  async loadData (args: LoadArguments): Promise<void> {
    this.internalTrigger$.next(args);
  }
}
export class LoadTrigger<Resource, LoadArguments> {

  private trigger$: Observable<LoadArguments>;
  constructor (trigger$: Observable<LoadArguments>) {
    this.trigger$ = trigger$;
  }

  loadPipe (pipe: OperatorFunction<LoadArguments, Resource>): LoadableObservable<Resource, LoadArguments> {
    return new LoadableObservable<Resource, LoadArguments>(pipe, this.trigger$);
  }
}
export class LoadableRx {
  static trigger<Resource, LoadArguments>(trigger$: Observable<LoadArguments>): LoadTrigger<Resource, LoadArguments> {
    return new LoadTrigger<Resource, LoadArguments>(trigger$);
  }
}

export class LoadableResource<Resource, LoadArguments> {
    isLoading$ = new ReplaySubject<boolean>();
    loadingError$ = new BehaviorSubject<Error | null>(null);
    data$: Observable<Resource>;

    private loadQueueAdd$ = new ReplaySubject<LoadQueueItem>();
    private loadQueueRemove$ = new ReplaySubject<LoadQueueItem>();
    private loadQueue: LoadQueueItem[] = [];
    private loadQueue$ = 
      merge(
        this.loadQueueAdd$.pipe(map(item => ({ action: ACTION.ADD, item }))),
        this.loadQueueRemove$.pipe(map(item => ({ action: ACTION.REMOVE, item }))),
      ).pipe(
        map(event => {
          switch (event.action) {
          case ACTION.ADD:
            this.loadQueue.push(event.item);
            break;
          case ACTION.REMOVE:
            this.loadQueue = this.loadQueue.filter(i => i !== event.item); 
            break;          
          default:
            break;
          }

          return this.loadQueue;
        }),
        shareReplay(1),
      );

    private load: (args: LoadArguments) => Observable<Resource>;
    private internalTrigger$ = new ReplaySubject<LoadArguments>(1);

    constructor (
      load: (args: LoadArguments) => Observable<Resource>,
      trigger$?: Observable<LoadArguments>,
    ) {
      this.load = load;
      this.data$ = merge(
        this.internalTrigger$,
        trigger$ || new Subject<LoadArguments>(),  
      ).pipe(
        mergeMap(loadArgs => this._loadData(loadArgs)),
        shareReplay(1),
      );

      this.loadQueue$
        .pipe(
          map(queue => !!(queue.length)),
          distinctUntilChanged(),
        )
        .subscribe(bool => this.isLoading$.next(bool));
    }

    private _loadData(args: LoadArguments) {
      const r = Math.random();
      const loadQueueItem = new LoadQueueItem(r);
      return of('immediate')
        .pipe(
          tap(() => this.loadQueueAdd$.next(loadQueueItem)),
          tap(() => this.loadingError$.next(null)),
          mergeMap(() => this.load(args)),
          tap(() => this.loadQueueRemove$.next(loadQueueItem)),
          tap(() => this.loadingError$.next(null)),
          catchError(error => {
            this.loadQueueRemove$.next(loadQueueItem);
            this.loadingError$.next(error);
            return throwError(() => error);
          }),
        );
    }

    async loadData (args: LoadArguments): Promise<void> {
      this.internalTrigger$.next(args);
    }
}
