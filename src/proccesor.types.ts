import { Observable } from 'rxjs';

export interface CreatorCallback <Argument, ReturnType>{
  (
    wrap: WrapProcessOperator<Argument, ReturnType>,
  )
  : Observable<ReturnType>
}

export interface CreateProcessFunction {
  <Argument, ReturnType>
  (
    creator: CreatorCallback<Argument, ReturnType>,
  )
  : Processor<ReturnType>;
}

export interface WrapProcessOptions {
  terminateOnError?: boolean,
  throwErrorToGlobal?: boolean,
}

export interface WrapProcessOperator <Argument, ReturnType>{
  (
    processFunction: (
      arg: Argument,
    ) => Observable<ReturnType>,
    options?: WrapProcessOptions
  )
  : (
      source$: Observable<Argument>
  ) => Observable<ReturnType>
}

export interface Processor<ReturnType> {
  inProgress$: Observable<boolean>,
  error$: Observable<Error | null>,
  data$: Observable<ReturnType>,
}