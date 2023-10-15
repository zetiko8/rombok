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

describe('error sharing before error emit', () => {
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
      cold<string>('------p'),
      cold<string>('----------r'),
    ];
    const error = new TestError('test');
    const getProccesFn = () => (value: string) => {
      if (value === 'p')
        return fakeApiCall(cold<string>('--#', {}, error));
      else
        return fakeApiCall(cold<string>('--' + value));
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
        error,
      }
        = scenario(process, cold, createMergeProcess,
          { terminateOnError: false },
          mergeMap as
            MultipleExecutionsStrategyOperator<string, string>);

      const sucessP  = '----o-------r';
      const errorP   = 'n-------e-n';
      const lateSub  = '---s';
      const lateSubP = '---n----e-n';
      expectObservable(process.success$)
        .toBe(sucessP);
      expectObservable(process.error$)
        .toBe(errorP, { ...values, e: error });
      const lateProcessSub$ =
        cold(lateSub)
          .pipe(
            mergeMap(() => process.error$),
          );
      expectObservable(lateProcessSub$)
        .toBe(lateSubP, { ...values, e: error });

      // wrapProcess
      expectObservable(wrapProcess.success$)
        .toBe(sucessP);
      expectObservable(wrapProcess.error$)
        .toBe(errorP, { ...values, e: error });
      const lateSub$ =
         cold(lateSub)
           .pipe(
             mergeMap(() => wrapProcess.error$),
           );
      expectObservable(lateSub$)
        .toBe(lateSubP, { ...values, e: error });
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
        error,
      }
        = scenario(process, cold, createConcatProcess,
          { terminateOnError: false },
          concatMap as
            MultipleExecutionsStrategyOperator<string, string>);

      const sucessP  = '----o-------r';
      const errorP   = 'n-------e-n';
      const lateSub  = '---s';
      const lateSubP = '---n----e-n';
      expectObservable(process.success$)
        .toBe(sucessP);
      expectObservable(process.error$)
        .toBe(errorP, { ...values, e: error });
      const lateProcessSub$ =
        cold(lateSub)
          .pipe(
            mergeMap(() => process.error$),
          );
      expectObservable(lateProcessSub$)
        .toBe(lateSubP, { ...values, e: error });

      // wrapProcess
      expectObservable(wrapProcess.success$)
        .toBe(sucessP);
      expectObservable(wrapProcess.error$)
        .toBe(errorP, { ...values, e: error });
      const lateSub$ =
           cold(lateSub)
             .pipe(
               mergeMap(() => wrapProcess.error$),
             );
      expectObservable(lateSub$)
        .toBe(lateSubP, { ...values, e: error });
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
        error,
      }
        = scenario(process, cold, createSwitchProcess,
          { terminateOnError: false },
          switchMap as
            MultipleExecutionsStrategyOperator<string, string>);

      const sucessP  = '----o-------r';
      const errorP   = 'n-------e-n';
      const lateSub  = '---s';
      const lateSubP = '---n----e-n';
      expectObservable(process.success$)
        .toBe(sucessP);
      expectObservable(process.error$)
        .toBe(errorP, { ...values, e: error });
      const lateProcessSub$ =
        cold(lateSub)
          .pipe(
            mergeMap(() => process.error$),
          );
      expectObservable(lateProcessSub$)
        .toBe(lateSubP, { ...values, e: error });

      // wrapProcess
      expectObservable(wrapProcess.success$)
        .toBe(sucessP);
      expectObservable(wrapProcess.error$)
        .toBe(errorP, { ...values, e: error });
      const lateSub$ =
           cold(lateSub)
             .pipe(
               mergeMap(() => wrapProcess.error$),
             );
      expectObservable(lateSub$)
        .toBe(lateSubP, { ...values, e: error });
    });
  });
});
