/* eslint-disable @typescript-eslint/no-empty-function */
import {
  Process,
  CreateProcessFunction,
  createConcatProcess,
  createMergeProcess,
  createSwitchProcess,
  MULTIPLE_EXECUTIONS_STRATEGY,
} from '../../../src';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import {
  assertCallCount,
  ColdCreator,
  fakeApiCall,
  ignoreErrorSub,
  getProcessorTestReturns,
  MultipleExecutionsStrategyOperator,
  prepareTestScheduler,
  spy,
  TestError,
  TestScenarioReturn,
  values,
} from '../../test.helpers';
import {
  catchError,
  concatMap,
  map,
  mergeMap,
  switchMap,
} from 'rxjs/operators';
import { EMPTY,  merge } from 'rxjs';

/**
 * The point of this test is to test the loading indicator in switch case.
 * Because the first request is supposed to be canceled,
 * th loading indicator should not be triggered by its completion.
 * It should complete when the third request completes.
 */
describe('linear first errors and takes for ever', () => {

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
      cold('---o'),
      cold('-------p'),
      cold('-----------r'),
    ];
    const error = new TestError('test');
    const getProccesFn = () => (value: string) => {
      if (value === 'o')
        return fakeApiCall(
          cold<string>('--------------#', {}, error));
      else
        return fakeApiCall(cold<string>('--' + value));
    };
    const spyWrapper = spy(sbx, getProccesFn());
    function onWrite (value: string) {
      process.execute(
        () => spyWrapper.fn(value))
        .subscribe(ignoreErrorSub);
    }

    const spyWrapperForNormalOperator
      = spy(sbx, getProccesFn());

    // user writes
    triggers.forEach(t => t.subscribe(onWrite));

    const normalData$ = merge(...triggers)
      .pipe(
        operator(
          (arg) => spyWrapperForNormalOperator
            .fn(arg)
            .pipe(
              catchError(() => EMPTY),
            ),
        ),
      );

    const after
    = cold('-------------------------1')
      .pipe(map(() => undefined));

    return {
      processLegacy: {
        processFn: spyWrapper.spy,
      },
      wrapProcess: getProcessorTestReturns(
        sbx,
        createProcessFunction,
        getProccesFn,
        triggers,
      ),
      normalOperator: {
        processFn: spyWrapperForNormalOperator.spy,
        success$: normalData$,
      },
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
        processLegacy,
        wrapProcess,
        error,
        after,
      }
        = scenario(process, cold, createMergeProcess,
          mergeMap as
          MultipleExecutionsStrategyOperator<string, string>);

      expectObservable(process.success$)
        .toBe('---------p---r');
      expectObservable(process.error$)
        .toBe('n----------------e', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('f--t-------------f', values);
      after.subscribe(() =>
        assertCallCount(processLegacy.processFn, 3));

      expectObservable(wrapProcess.success$)
        .toBe('---------p---r');
      expectObservable(wrapProcess.error$)
        .toBe('n----------------e', { ...values, e: error });
      expectObservable(wrapProcess.inProgress$)
        .toBe('f--t-------------f', values);
      after.subscribe(() =>
        assertCallCount(wrapProcess.processFn, 3));
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
        processLegacy,
        wrapProcess,
        normalOperator,
        error,
        after,
      }
        = scenario(process, cold, createConcatProcess,
          concatMap as
          MultipleExecutionsStrategyOperator<string, string>);

      expectObservable(process.success$)
        .toBe('--------------------p--r');
      expectObservable(process.error$)
        .toBe('n----------------en-----', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('f--t-------------ft-ft-f', values);
      after.subscribe(() =>
        assertCallCount(processLegacy.processFn, 3));

      expectObservable(normalOperator.success$)
        .toBe('-------------------p-r');

      expectObservable(wrapProcess.success$)
        .toBe('-------------------p-r');
      expectObservable(wrapProcess.error$)
        .toBe('n----------------(en)-----', { ...values, e: error });
      expectObservable(wrapProcess.inProgress$)
        .toBe('f--t-----------------f', values);
      after.subscribe(() =>
        assertCallCount(wrapProcess.processFn, 3));
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
        processLegacy,
        wrapProcess,
        error,
        after,
      }
        = scenario(process, cold, createSwitchProcess,
          switchMap as
          MultipleExecutionsStrategyOperator<string, string>);

      expectObservable(process.success$)
        .toBe('---------p---r');
      expectObservable(process.error$)
        .toBe('n----------------e', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('f--t-----f-t-f', values);
      after.subscribe(() =>
        assertCallCount(processLegacy.processFn, 3));

      expectObservable(wrapProcess.success$)
        .toBe('---------p---r');
      expectObservable(wrapProcess.error$)
        .toBe('n-----------------', { ...values, e: error });
      expectObservable(wrapProcess.inProgress$)
        .toBe('f--t-----f-t-f', values);
      after.subscribe(() =>
        assertCallCount(wrapProcess.processFn, 3));
    });
  });
});
