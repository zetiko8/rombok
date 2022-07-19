import { 
  BehaviorSubject, 
  distinctUntilChanged, 
  map, 
  merge, 
  Observable, 
  ReplaySubject, 
  shareReplay, 
  Subject, 
  tap, 
  OperatorFunction, 
  Observer, 
  Subscription,
  mergeMap,
  of,
} from 'rxjs';

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
      this.internalTrigger$,  // TODO - think if necessary
      trigger$ || new Subject<LoadArguments>(),  
    ).pipe(
      map(args => {
        const r = Math.random();
        const loadQueueItem = new LoadQueueItem(r);
        this.loadQueueAdd$.next(loadQueueItem);
        return { loadQueueItem, value: args };
      }),
      tap(() => this.loadingError$.next(null)),
      map(context => context.value),
      pipe,
      tap(() => this.loadingError$.next(null)),
    );

    this.loadQueue$
      .pipe(
        map(queue => !!(queue.length)),
        distinctUntilChanged(),
      )
      .subscribe(bool => this.isLoading$.next(bool));
  }

  subscribe(observer?: Partial<Observer<Resource>> | undefined): Subscription;
  subscribe(next: (value: Resource) => void): Subscription;
  subscribe(next?: ((value: Resource) => void) | null | undefined, error?: ((error: any) => void) | null | undefined, complete?: (() => void) | null | undefined): Subscription;
  subscribe(next?: unknown, error?: unknown, complete?: unknown): Subscription {
    const observer: Partial<Observer<Resource>> = {};
    if (next) {
      const h = next as Partial<Observer<Resource>>;
      if (
        (h.next && typeof h.next == 'function')
        || (h.error && typeof h.error == 'function')
        || (h.complete && typeof h.complete == 'function')
      ) {
        observer.next = h.next?.bind(h);
        observer.error = h.error?.bind(h);
        observer.complete = h.complete?.bind(h);
      } else {
        if (next && typeof next === 'function') observer.next = next as any;
        if (error && typeof error === 'function') observer.error = error as any;
        if (complete && typeof complete === 'function') observer.complete = complete as any;
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      observer.next = () => {};
    }
    const sub$ = this.data$.subscribe(observer);  


    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return new Subscription(() => {
      sub$.unsubscribe();
    });
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