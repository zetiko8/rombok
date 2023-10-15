/* eslint-disable @typescript-eslint/no-empty-function */
import {
  Process,
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
    createProcessFunction: CreateProcessFunction<string, string>,
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
          mergeMap as
            MultipleExecutionsStrategyOperator<string, string>);

      const sucessP  = '-----o-------r';
      const loadingP = 'f-t--f----t--f';
      const lateSub  = '---s';
      const lateSubP = '---t-f----t--f';
      expectObservable(process.success$)
        .toBe(sucessP);
      expectObservable(process.inProgress$)
        .toBe(loadingP, values);

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
        .toBe(lateSubP, values);
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
          concatMap as
            MultipleExecutionsStrategyOperator<string, string>);

      const sucessP  = '-----o-------r';
      const loadingP = 'f-t--f----t--f';
      const lateSub  = '---s';
      const lateSubP = '---t-f----t--f';
      expectObservable(process.success$)
        .toBe(sucessP);
      expectObservable(process.inProgress$)
        .toBe(loadingP, values);

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
        .toBe(lateSubP, values);
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
          switchMap as
            MultipleExecutionsStrategyOperator<string, string>);

      const sucessP  = '-----o-------r';
      const loadingP = 'f-t--f----t--f';
      const lateSub  = '---s';
      const lateSubP = '---t-f----t--f';
      expectObservable(process.success$)
        .toBe(sucessP);
      expectObservable(process.inProgress$)
        .toBe(loadingP, values);

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
        .toBe(lateSubP, values);
    });
  });
});
