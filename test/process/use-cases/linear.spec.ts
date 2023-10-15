/* eslint-disable @typescript-eslint/no-empty-function */
import {
  Process,
  WrapProcessOptions,
  MULTIPLE_EXECUTIONS_STRATEGY,
  CreateProcessFunction,
  createMergeProcess,
  createConcatProcess,
  createSwitchProcess,
} from '../../../src';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import {
  assertCallCount,
  ColdCreator,
  fakeApiCall,
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
import { EMPTY, merge } from 'rxjs';
import { ignoreErrorSub } from '@zetiko8/rxjs-testing-helpers';

describe('linear', () => {
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
      cold<string>('---o'),
      cold<string>('-------p'),
      cold<string>('-----------r'),
    ];
    const error = new TestError('test');
    const getProccesFn = () => (value: string) => {
      return fakeApiCall(cold<string>('-' + value));
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
        normalOperator,
        error,
        after,
      }
        = scenario(process, cold, createMergeProcess,
          { terminateOnError: false },
          mergeMap as
            MultipleExecutionsStrategyOperator<string, string>);

      expectObservable(process.success$)
        .toBe('----o---p---r');
      expectObservable(process.error$)
        .toBe('n------------', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('f--tf--tf--tf', values);
      after.subscribe(() =>
        assertCallCount(processLegacy.processFn, 3));

      // normal operator
      expectObservable(normalOperator.success$)
        .toBe('----o---p---r');
      after.subscribe(() =>
        assertCallCount(normalOperator.processFn, 3));

      // wrapProcess
      expectObservable(wrapProcess.success$)
        .toBe('----o---p---r');
      expectObservable(wrapProcess.error$)
        .toBe('n------------', { ...values, e: error });
      expectObservable(wrapProcess.inProgress$)
        .toBe('f--tf--tf--tf', values);
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
          { terminateOnError: false },
            concatMap as MultipleExecutionsStrategyOperator<string, string>);

      expectObservable(process.success$)
        .toBe('----o---p---r');
      expectObservable(process.error$)
        .toBe('n------------', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('f--tf--tf--tf', values);
      after.subscribe(() =>
        assertCallCount(processLegacy.processFn, 3));

      expectObservable(normalOperator.success$)
        .toBe('----o---p---r');
      after.subscribe(() =>
        assertCallCount(normalOperator.processFn, 3));

      // wrapProcess
      expectObservable(wrapProcess.success$)
        .toBe('----o---p---r');
      expectObservable(wrapProcess.error$)
        .toBe('n------------', { ...values, e: error });
      expectObservable(wrapProcess.inProgress$)
        .toBe('f--tf--tf--tf', values);
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
        normalOperator,
        error,
        after,
      }
        = scenario(process, cold, createSwitchProcess,
          { terminateOnError: false },
          switchMap as MultipleExecutionsStrategyOperator<string, string>);

      expectObservable(process.success$)
        .toBe('----o---p---r');
      expectObservable(process.error$)
        .toBe('n------------', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('f--tf--tf--tf', values);
      after.subscribe(() =>
        assertCallCount(processLegacy.processFn, 3));

      // normal operator
      expectObservable(normalOperator.success$)
        .toBe('----o---p---r');
      after.subscribe(() =>
        assertCallCount(normalOperator.processFn, 3));

      // wrapProcess
      expectObservable(wrapProcess.success$)
        .toBe('----o---p---r');
      expectObservable(wrapProcess.error$)
        .toBe('n------------', { ...values, e: error });
      expectObservable(wrapProcess.inProgress$)
        .toBe('f--tf--tf--tf', values);
      after.subscribe(() =>
        assertCallCount(wrapProcess.processFn, 3));
    });
  });
});
