import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export enum MULTIPLE_EXECUTIONS_STRATEGY {
  MERGE_MAP,
  CONCAT_MAP,
  SWITCH_MAP,
}

export enum LOAD_STRATEGY {
  only_one_load_at_a_time = 'only_one_load_at_a_time',
  default = 'default',
}

class ExecutingPipe {
  private _hasEnded = false;
  registerLoadPipeEnd() {
    this._hasEnded = true;
  }

  get hasEnded() {
    return this._hasEnded;
  }
}

class OnlyOneLoadAtTimeLoadingContext {
  private pipes: ExecutingPipe[] = [];

  registerLoading() {
    this.pipes.push(new ExecutingPipe());
    this.setLoadingState();
  }

  registerLoadEnd() {
    this.pipes[this.pipes.length - 1]?.registerLoadPipeEnd();
    this.setLoadingState();
  }

  private setLoadingState() {
    this._isLoading$.next(this.isLoading());
  }

  private isLoading() {
    if (!this.pipes.length) {
      return false;
    } else {
      return !this.pipes[this.pipes.length - 1]?.hasEnded;
    }
  }

  private _isLoading$ = new ReplaySubject<boolean>(1);
  isLoading$ = this._isLoading$.asObservable();
}

class MultipleLoadsAtTimeLoadingContext {
  private loadPipeCount = 0;

  registerLoading() {
    this.loadPipeCount++;
    this.setLoadingState();
  }

  registerLoadEnd() {
    this.loadPipeCount--;
    this.setLoadingState();
  }

  private setLoadingState() {
    this._isLoading$.next(this.isLoading());
  }

  private isLoading() {
    return this.loadPipeCount > 0;
  }

  private _isLoading$ = new ReplaySubject<boolean>(1);
  isLoading$ = this._isLoading$.asObservable();
}

class SwitchLoadingContext {
  private loadToken = '';

  registerLoading(loadToken: string) {
    this.loadToken = loadToken;
    this.setLoadingState(true);
  }

  registerLoadEnd(loadToken: string) {
    if (this.loadToken === loadToken) {
      this.setLoadingState(false);
    }
  }

  private setLoadingState(isLoading: boolean) {
    this._isLoading$.next(isLoading);
  }

  private _isLoading$ = new ReplaySubject<boolean>(1);
  isLoading$ = this._isLoading$.asObservable();

}

export class LoadContext {
  private _implementation:
    | OnlyOneLoadAtTimeLoadingContext
    | MultipleLoadsAtTimeLoadingContext
    | SwitchLoadingContext;
  registerLoading: (loadToken: string) => void;
  registerLoadEnd: (loadToken: string) => void;
  isLoading$: Observable<boolean>;

  constructor(loadStrategy = MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP) {
    if (loadStrategy === MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP)
      this._implementation
       = new OnlyOneLoadAtTimeLoadingContext();
    if (loadStrategy === MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP)
      this._implementation
       = new SwitchLoadingContext();
    else this._implementation
     = new MultipleLoadsAtTimeLoadingContext();
    this.registerLoadEnd = (loadToken: string) => {
      return this._implementation
        .registerLoadEnd.bind(this._implementation)(loadToken);
    };
    this.registerLoading = (loadToken: string) => {
      return this._implementation
        .registerLoading.bind(this._implementation)(loadToken);
    };
    this.isLoading$ = this._implementation
      .isLoading$.pipe(distinctUntilChanged());
  }
}

export interface ILoadContext {
  registerLoading: () => void;
  registerLoadEnd: () => void;
  isLoading$: Observable<boolean>;
}

export class MergeLoadContext implements ILoadContext {
  private loadPipeCount = 0;

  registerLoading(): void {
    this.loadPipeCount++;
    this.setLoadingState();
  }

  registerLoadEnd(): void {
    this.loadPipeCount--;
    this.setLoadingState();
  }

  private setLoadingState() {
    this._isLoading$.next(this.isLoading());
  }

  private isLoading() {
    return this.loadPipeCount > 0;
  }

  private _isLoading$ = new BehaviorSubject<boolean>(false);
  isLoading$ = this._isLoading$
    .pipe(
      debounceTime(0),
      distinctUntilChanged(),
    );

}

export class SwitchConcatLoadContext implements ILoadContext {

  registerLoading(): void {
    this.setLoadingState(true);
  }

  registerLoadEnd(): void {
    this.setLoadingState(false);
  }

  private setLoadingState(isLoading: boolean) {
    this._isLoading$.next(isLoading);
  }

  private _isLoading$ = new BehaviorSubject<boolean>(false);
  isLoading$ = this._isLoading$
    .pipe(
      debounceTime(0),
      distinctUntilChanged(),
    );

}
