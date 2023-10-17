import {
  Process,
  WrapProcessOptions,
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
import { ignoreErrorSub } from '@zetiko8/rxjs-testing-helpers';
/**
 * Test if the loading indicator fires correctly
 * meaning that a finished request does not set the
 * loading to false, despite another request still
 * running
 */
describe('first and second fire at same time', () => {
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
      cold('---o'),
      cold('---p'),
      cold('-----------r'),
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
        wrapProcessOptions,
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        normalOperator,
        error,
        after,
      }
        = scenario(process, cold, createMergeProcess,
          { terminateOnError: false },
          mergeMap as
          MultipleExecutionsStrategyOperator<string, string>);

      expectObservable(process.success$)
        .toBe('----(op)-------r');
      expectObservable(process.error$)
        .toBe('n------------', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('f--tf------tf', values);
      after.subscribe(() =>
        assertCallCount(processLegacy.processFn, 3));

      expectObservable(wrapProcess.success$)
        .toBe('----(op)-------r');
      expectObservable(wrapProcess.error$)
        .toBe('n------------', { ...values, e: error });
      expectObservable(wrapProcess.inProgress$)
        .toBe('f--tf------tf', values);
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
          concatMap as
          MultipleExecutionsStrategyOperator<string, string>);

      expectObservable(process.success$)
        .toBe('----o-p-----r');
      expectObservable(process.error$)
        .toBe('n------------', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('f--tftf----tf', values);
      after.subscribe(() =>
        assertCallCount(processLegacy.processFn, 3));

      expectObservable(normalOperator.success$)
        .toBe('----op------r');

      expectObservable(wrapProcess.success$)
        .toBe('----op------r');
      expectObservable(wrapProcess.error$)
        .toBe('n------------', { ...values, e: error });
      expectObservable(wrapProcess.inProgress$)
        .toBe('f--t-f-----tf', values);
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        normalOperator,
        error,
        after,
      }
        = scenario(process, cold, createSwitchProcess,
          { terminateOnError: false },
          switchMap as
          MultipleExecutionsStrategyOperator<string, string>);

      expectObservable(process.success$)
        .toBe('----p-------r');
      expectObservable(process.error$)
        .toBe('n------------', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('f--tf------tf', values);
      after.subscribe(() =>
        assertCallCount(processLegacy.processFn, 3));

      expectObservable(wrapProcess.success$)
        .toBe('----p-------r');
      expectObservable(wrapProcess.error$)
        .toBe('n------------', { ...values, e: error });
      expectObservable(wrapProcess.inProgress$)
        .toBe('f--tf------tf', values);
      after.subscribe(() =>
        assertCallCount(wrapProcess.processFn, 3));
    });
  });
});
