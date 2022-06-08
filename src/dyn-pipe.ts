import { BehaviorSubject, catchError, identity, mergeMap, Observable, of, OperatorFunction, ReplaySubject, Subscriber, tap, TeardownLogic, throwError, UnaryFunction } from 'rxjs';

class DynPipePosition extends Observable<any> {
  constructor (subscribe?: (this: Observable<any>, subscriber: Subscriber<any>) => TeardownLogic) {
    super(subscriber => {
        
    });
  }
}
  
export class DynPipe {
  
    private operators: OperatorFunction<any, any>[];
  
    private positions: DynPipePosition[] = [];
  
    constructor (operators: OperatorFunction<any, any>[]) {
      this.operators = operators;
      const observables = [];
      operators.forEach((item, index) => {
        
      }); 
    }
  
    pipe() {
      return <T>(source: Observable<T>): Observable<T> => {
        const operators = this.operators;
        return new Observable(subscriber => {
          source.subscribe({
            next(value) {
              pipeFromArray(operators)(of(value)).subscribe(v => {
                subscriber.next(v);
              });
            },
            error(error) {
              subscriber.error(error);
            },
            complete() {
              subscriber.complete();
            },
          });
        });
      };
    }
}
  
/** @internal */
export function pipeFromArray<T, R>(fns: Array<UnaryFunction<T, R>>): UnaryFunction<T, R> {
  if (fns.length === 0) {
    return identity as UnaryFunction<any, any>;
  }
  
  if (fns.length === 1) {
    return fns[0];
  }
  
  return function piped(input: T): R {
    return fns.reduce((prev: any, fn: UnaryFunction<T, R>) => fn(prev), input as any);
  };
}
  