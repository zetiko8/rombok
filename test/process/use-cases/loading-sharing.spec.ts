/* eslint-disable @typescript-eslint/no-empty-function */
import {
  Process,
  WrapProcessOptions,
  MULTIPLE_EXECUTIONS_STRATEGY,
  createMergeProcess,
  createConcatProcess,
  createSwitchProcess,
  CreateProcessFunction,
} from '../../../src';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import {
  ColdCreator,
  fakeApiCall,
  getNormalTestReturns,
  getProcessorTestReturns,
  getProcessTestReturns,
  MultipleExecutionsStrategyOperator,
  prepareTestScheduler,
  TestError,
  TestScenarioReturn,
  values,
} from '../../test.helpers';
import {
  concatMap,
  map,
  mergeMap,
  switchMap,
} from 'rxjs/operators';

describe('loading sharing', () => {
  let scheduler: TestScheduler;
  let sbx: SinonSandbox;
  beforeEach(() => {
    scheduler = prepareTestScheduler();
    sbx = createSandbox();
  });
  afterEach(() => {
    scheduler = prepareTestScheduler();
    sbx.restore();
  });

  const scenario = (
    process: Process<string>,
    cold: ColdCreator,
    createProcessFunction: CreateProcessFunction,
    wrapProcessOptions:  WrapProcessOptions,
    operator: MultipleExecutionsStrategyOperator<string, string>,
  ): TestScenarioReturn => {

    const triggers = [
      cold<string>('--o'),
      cold<string>('----------r'),
    ];
    const error = new TestError('test');
    const getProccesFn = () => (value: string) => {
      return fakeApiCall(cold<string>('---' + value));
    };

    const after
    = cold('-------------------------1')
      .pipe(map(() => undefined));

    return {
      processLegacy: getProcessTestReturns(
        sbx,
        process,
        getProccesFn,
        triggers,
      ),
      wrapProcess: getProcessorTestReturns(
        sbx,
        createProcessFunction,
        getProccesFn,
        triggers,
      ),
      normalOperator: getNormalTestReturns(
        sbx,
        operator,
        getProccesFn,
        triggers,
      ),
      error,
      after,
    };
  };

  it('merge', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const process
       = new Process<string>({
         multipleExecutionsStrategy:
          MULTIPLE_EXECUTIONS_STRATEGY.MERGE_MAP,
       });
      const {
        wrapProcess,
      }
        = scenario(process, cold, createMergeProcess,
          { terminateOnError: false },
          mergeMap as
            MultipleExecutionsStrategyOperator<string, string>);

      const sucessP  = '-----o-------r';
      const loadingP = 'f-t--f----t--f';
      const lateSub  = '---s';
      expectObservable(process.success$)
        .toBe(sucessP);
      expectObservable(process.inProgress$)
        .toBe(loadingP, values);
      const lateProcessSub$ =
        cold(lateSub)
          .pipe(
            mergeMap(() => process.inProgress$),
          );
      expectObservable(lateProcessSub$)
        .toBe('---(ft)-f----t--f', values);

      // wrapProcess
      expectObservable(wrapProcess.success$)
        .toBe(sucessP);
      expectObservable(wrapProcess.inProgress$)
        .toBe(loadingP, values);
      const lateSub$ =
         cold(lateSub)
           .pipe(
             mergeMap(() => wrapProcess.inProgress$),
           );
      expectObservable(lateSub$)
        .toBe('---t-f----t--f', values);
    });
  });
  it('concat', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const process
       = new Process<string>({
         multipleExecutionsStrategy:
          MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP,
       });
      const {
        wrapProcess,
      }
        = scenario(process, cold, createConcatProcess,
          { terminateOnError: false },
          concatMap as
            MultipleExecutionsStrategyOperator<string, string>);

      const sucessP  = '-----o-------r';
      const loadingP = 'f-t--f----t--f';
      const lateSub  = '---s';
      expectObservable(process.success$)
        .toBe(sucessP);
      expectObservable(process.inProgress$)
        .toBe(loadingP, values);
      const lateProcessSub$ =
        cold(lateSub)
          .pipe(
            mergeMap(() => process.inProgress$),
          );
      expectObservable(lateProcessSub$)
        .toBe('---(ft)-f----t--f', values);

      // wrapProcess
      expectObservable(wrapProcess.success$)
        .toBe(sucessP);
      expectObservable(wrapProcess.inProgress$)
        .toBe(loadingP, values);
      const lateSub$ =
           cold(lateSub)
             .pipe(
               mergeMap(() => wrapProcess.inProgress$),
             );
      expectObservable(lateSub$)
        .toBe('---t-f----t--f', values);
    });
  });
  it('switch', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const process
       = new Process<string>({
         multipleExecutionsStrategy:
          MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP,
       });
      const {
        wrapProcess,
      }
        = scenario(process, cold, createSwitchProcess,
          { terminateOnError: false },
          switchMap as
            MultipleExecutionsStrategyOperator<string, string>);

      const sucessP  = '-----o-------r';
      const loadingP = 'f-t--f----t--f';
      const lateSub  = '---s';
      expectObservable(process.success$)
        .toBe(sucessP);
      expectObservable(process.inProgress$)
        .toBe(loadingP, values);
      const lateProcessSub$ =
        cold(lateSub)
          .pipe(
            mergeMap(() => process.inProgress$),
          );
      expectObservable(lateProcessSub$)
        .toBe('---(ft)-f----t--f', values);

      // wrapProcess
      expectObservable(wrapProcess.success$)
        .toBe(sucessP);
      expectObservable(wrapProcess.inProgress$)
        .toBe(loadingP, values);
      const lateSub$ =
           cold(lateSub)
             .pipe(
               mergeMap(() => wrapProcess.inProgress$),
             );
      expectObservable(lateSub$)
        .toBe('---t-f----t--f', values);
    });
  });
});
