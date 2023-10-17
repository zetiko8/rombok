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
  expectToNotThrow,
  expectToThrow,
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

describe('error reporting', () => {
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
      cold<string>('--------------r'),
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
        wrapProcessOptions,
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

  it('merge terminateOnError = false', () => {
    expectToNotThrow(() => {
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

        const sucessP  = '----o-----------r';
        const errorP   = 'n-------e-----n';

        expectObservable(wrapProcess.success$)
          .toBe(sucessP, values, error);
        expectObservable(wrapProcess.error$)
          .toBe(errorP, { ...values, e: error });
        wrapProcess.success$.subscribe();
      });
    });
  });
  it('merge terminateOnError = true', () => {
    expectToThrow(() => {
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
            { terminateOnError: true },
            mergeMap as
              MultipleExecutionsStrategyOperator<string, string>);

        const sucessP  = '----o---#------';
        const errorP   = 'n-------e------';

        expectObservable(wrapProcess.success$)
          .toBe(sucessP, values, error);
        expectObservable(wrapProcess.error$)
          .toBe(errorP, { ...values, e: error });
        wrapProcess.success$.subscribe();
      });
    }).with('test');
  });
  it('merge terminateOnError = false, throwErrorToGlobal = false', () => {
    expectToNotThrow(
      () => scheduler.run(({ cold, expectObservable }) => {
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

        const sucessP  = '----o-----------r';
        const errorP   = 'n-------e-----n';

        expectObservable(wrapProcess.success$)
          .toBe(sucessP, values, error);
        expectObservable(wrapProcess.error$)
          .toBe(errorP, { ...values, e: error });
        wrapProcess.success$.subscribe();
      }));
  });
  it('merge terminateOnError = false, throwErrorToGlobal = true', () => {
    expectToThrow(
      () => scheduler.run(({ cold, expectObservable }) => {
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
            { terminateOnError: false, throwErrorToGlobal: true },
            mergeMap as
              MultipleExecutionsStrategyOperator<string, string>);

        const sucessP  = '----o-----------r';
        const errorP   = 'n-------e-----n';

        expectObservable(wrapProcess.success$)
          .toBe(sucessP, values, error);
        expectObservable(wrapProcess.error$)
          .toBe(errorP, { ...values, e: error });
        wrapProcess.success$.subscribe();
      }))
      .with('test');
  });
  it('concat terminateOnError = false', () => {
    expectToNotThrow(() => {
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

        const sucessP  = '----o-----------r';
        const errorP   = 'n-------e-----n';

        expectObservable(wrapProcess.success$)
          .toBe(sucessP, values, error);
        expectObservable(wrapProcess.error$)
          .toBe(errorP, { ...values, e: error });
        wrapProcess.success$.subscribe();
      });
    });
  });
  it('concat terminateOnError = true', () => {
    expectToThrow(() => {
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
            { terminateOnError: true },
            concatMap as
              MultipleExecutionsStrategyOperator<string, string>);

        const sucessP  = '----o---#------';
        const errorP   = 'n-------e------';

        expectObservable(wrapProcess.success$)
          .toBe(sucessP, values, error);
        expectObservable(wrapProcess.error$)
          .toBe(errorP, { ...values, e: error });
        wrapProcess.success$.subscribe();
      });
    }).with('test');
  });
  it('concat terminateOnError = false, throwErrorToGlobal = false', () => {
    expectToNotThrow(
      () => scheduler.run(({ cold, expectObservable }) => {
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

        const sucessP  = '----o-----------r';
        const errorP   = 'n-------e-----n';

        expectObservable(wrapProcess.success$)
          .toBe(sucessP, values, error);
        expectObservable(wrapProcess.error$)
          .toBe(errorP, { ...values, e: error });
        wrapProcess.success$.subscribe();
      }));
  });
  it('concat terminateOnError = false, throwErrorToGlobal = true', () => {
    expectToThrow(
      () => scheduler.run(({ cold, expectObservable }) => {
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
            { terminateOnError: false, throwErrorToGlobal: true },
            concatMap as
              MultipleExecutionsStrategyOperator<string, string>);

        const sucessP  = '----o-----------r';
        const errorP   = 'n-------e-----n';

        expectObservable(wrapProcess.success$)
          .toBe(sucessP, values, error);
        expectObservable(wrapProcess.error$)
          .toBe(errorP, { ...values, e: error });
        wrapProcess.success$.subscribe();
      }))
      .with('test');
  });
  it('switch terminateOnError = false', () => {
    expectToNotThrow(() => {
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

        const sucessP  = '----o-----------r';
        const errorP   = 'n-------e-----n';

        expectObservable(wrapProcess.success$)
          .toBe(sucessP, values, error);
        expectObservable(wrapProcess.error$)
          .toBe(errorP, { ...values, e: error });
        wrapProcess.success$.subscribe();
      });
    });
  });
  it('switch terminateOnError = true', () => {
    expectToThrow(() => {
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
            { terminateOnError: true },
            switchMap as
              MultipleExecutionsStrategyOperator<string, string>);

        const sucessP  = '----o---#------';
        const errorP   = 'n-------e------';

        expectObservable(wrapProcess.success$)
          .toBe(sucessP, values, error);
        expectObservable(wrapProcess.error$)
          .toBe(errorP, { ...values, e: error });
        wrapProcess.success$.subscribe();
      });
    }).with('test');
  });
  it('switch terminateOnError = false, throwErrorToGlobal = false', () => {
    expectToNotThrow(
      () => scheduler.run(({ cold, expectObservable }) => {
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

        const sucessP  = '----o-----------r';
        const errorP   = 'n-------e-----n';

        expectObservable(wrapProcess.success$)
          .toBe(sucessP, values, error);
        expectObservable(wrapProcess.error$)
          .toBe(errorP, { ...values, e: error });
        wrapProcess.success$.subscribe();
      }));
  });
  it('switch terminateOnError = false, throwErrorToGlobal = true', () => {
    expectToThrow(
      () => scheduler.run(({ cold, expectObservable }) => {
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
            { terminateOnError: false, throwErrorToGlobal: true },
            switchMap as
              MultipleExecutionsStrategyOperator<string, string>);

        const sucessP  = '----o-----------r';
        const errorP   = 'n-------e-----n';

        expectObservable(wrapProcess.success$)
          .toBe(sucessP, values, error);
        expectObservable(wrapProcess.error$)
          .toBe(errorP, { ...values, e: error });
        wrapProcess.success$.subscribe();
      }))
      .with('test');
  });
});
