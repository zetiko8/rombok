import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export enum MULTIPLE_EXECUTIONS_STRATEGY {
  MERGE_MAP,
  CONCAT_MAP,
  SWITCH_MAP,
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
