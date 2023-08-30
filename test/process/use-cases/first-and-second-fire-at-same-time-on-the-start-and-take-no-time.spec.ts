/* eslint-disable @typescript-eslint/no-empty-function */
import { Process } from '../../../src';
import { MULTIPLE_EXECUTIONS_STRATEGY } from '../../../src/loading-handling';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import { assertCallCount, ColdCreator, ignoreErrorSub, prepareTestScheduler, spy, TestError, TestScenarioReturn, values } from '../../test.helpers';
import { map } from 'rxjs';

/**
 * Check what happens if everything happens
 * instantly - make sure that the interfaces are in correct state
 * // TODO - also test for errors
 */
describe('first and second fire at same time on the start and take no time', () => {
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
      return cold(value);
    });
    function onWrite (value: string) {
      process.execute(
        () => spyWrapper.fn(value))
        .subscribe(ignoreErrorSub);
    }

    // user writes
    cold('o').subscribe(onWrite);
    cold('p').subscribe(onWrite);
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
        .toBe('(op)----------r');
      expectObservable(process.error$)
        .toBe('n------------', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('(ftf)----------(tf)', values);
      after.subscribe(() =>
        assertCallCount(processFn, 3));
    });
  });
  it('concat', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const process
       = new Process<string>({
         multipleExecutionsStrategy:
          MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP,
       });
      const [ error, processFn, after ]
        = scenario(process, cold);

      expectObservable(process.success$)
        .toBe('op---------r');
      expectObservable(process.error$)
        .toBe('n------------', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('(ftf)(tf)---------(tf)', values);
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
        .toBe('p----------r');
      expectObservable(process.error$)
        .toBe('n------------', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('(ftf)----------(tf)', values);
      after.subscribe(() =>
        assertCallCount(processFn, 3));
    });
  });
});
