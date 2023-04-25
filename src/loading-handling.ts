import { Observable, ReplaySubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { logger } from './debug-helpers';

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

export class LoadContext {
  private _implementation:
    | OnlyOneLoadAtTimeLoadingContext
    | MultipleLoadsAtTimeLoadingContext;
  registerLoading: () => void;
  registerLoadEnd: () => void;
  isLoading$: Observable<boolean>;

  constructor(loadStrategy = LOAD_STRATEGY.default) {
    if (loadStrategy === LOAD_STRATEGY.only_one_load_at_a_time)
      this._implementation
       = new OnlyOneLoadAtTimeLoadingContext();
    else this._implementation
     = new MultipleLoadsAtTimeLoadingContext();
    this.registerLoadEnd = () => {
      logger.debug('Abstract load strategy: load end');
      return this._implementation
        .registerLoadEnd.bind(this._implementation)();
    };
    this.registerLoading = () => {
      logger.debug('Abstract load strategy: load start');
      return this._implementation
        .registerLoading.bind(this._implementation)();
    };
    this.isLoading$ = this._implementation
      .isLoading$.pipe(distinctUntilChanged());
  }
}
