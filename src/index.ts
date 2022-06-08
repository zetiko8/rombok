import { BehaviorSubject, catchError, distinctUntilChanged, first, map, merge, mergeMap, Observable, of, ReplaySubject, shareReplay, Subject, tap, throwError } from 'rxjs';
import { log, logObject } from './utils';

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

    async loadData (args: LoadArguments) {
      this.internalTrigger$.next(args);
    }
}
