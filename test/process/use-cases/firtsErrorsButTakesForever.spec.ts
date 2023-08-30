/* eslint-disable @typescript-eslint/no-empty-function */
import { Process } from '../../../src';
import { MULTIPLE_EXECUTIONS_STRATEGY } from '../../../src/loading-handling';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import { assertCallCount, ColdCreator, ignoreErrorSub, prepareTestScheduler, spy, TestError, TestScenarioReturn, values } from '../../test.helpers';
import { map } from 'rxjs';

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
  ): TestScenarioReturn => {

    const error = new TestError('test');
    const spyWrapper = spy(sbx, (value: string) => {
      if (value === 'o')
        return cold('--------------#', {}, error);
      else
        return cold('--' + value);
    });
    function onWrite (value: string) {
      process.execute(
        () => spyWrapper.fn(value))
        .subscribe(ignoreErrorSub);
    }
    // user writes
    cold('---o').subscribe(onWrite);
    cold('-------p').subscribe(onWrite);
    cold('-----------r').subscribe(onWrite);

    const after
    = cold('-------------------------1')
      .pipe(map(() => undefined));

    return [ error, spyWrapper.spy, after ];
  };

  it('merge', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const process
       = new Process<string>({
         multipleExecutionsStrategy:
          MULTIPLE_EXECUTIONS_STRATEGY.MERGE_MAP,
       });
      const [ error, processFn, after ]
        = scenario(process, cold);

      expectObservable(process.success$)
        .toBe('---------p---r');
      expectObservable(process.error$)
        .toBe('n----------------e', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('f--t-------------f', values);
      after.subscribe(() =>
        assertCallCount(processFn, 3));
    });
  });
  it('concurent', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const process
       = new Process<string>({
         multipleExecutionsStrategy:
          MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP,
       });
      const [ error, processFn, after ]
        = scenario(process, cold);

      expectObservable(process.success$)
        .toBe('--------------------p--r');
      expectObservable(process.error$)
        .toBe('n----------------en-----', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('f--t-------------ft-ft-f', values);
      after.subscribe(() =>
        assertCallCount(processFn, 3));
    });
  });
  it('switch', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const process
       = new Process<string>({
         multipleExecutionsStrategy:
          MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP,
       });
      const [ error, processFn, after ]
        = scenario(process, cold);

      expectObservable(process.success$)
        .toBe('---------p---r');
      expectObservable(process.error$)
        .toBe('n----------------e', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('f--t-----f-t-f', values);
      after.subscribe(() =>
        assertCallCount(processFn, 3));
    });
  });
});
