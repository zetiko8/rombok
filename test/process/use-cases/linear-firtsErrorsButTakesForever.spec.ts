/* eslint-disable @typescript-eslint/no-empty-function */
import { Process } from '../../../src';
import { MULTIPLE_EXECUTIONS_STRATEGY } from '../../../src/loading-handling';
import { TestScheduler } from 'rxjs/testing';
import * as chai from 'chai';
import { createSandbox, SinonSandbox } from 'sinon';
import * as sinonChai from 'sinon-chai';
import { ignoreErrorSub, prepareTestScheduler, TestError } from '../../test.helpers';
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable';

chai.use(sinonChai);

const values = {
  t: true, f: false, a: 'a', b: 'b', c: 'c', n: null, v: 'v',
  w: 'w',
  o: 'o', p: 'p', r: 'r', s: 's', u: 'u',
};

  type ColdCreator = <T = string>(marbles: string, values?: {
    [marble: string]: T;
  } | undefined, error?: any) => ColdObservable<T>;


const scenarios = {
  linear: {
    scenario: (
      getProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
          Process<unknown>,
          TestError,
        //   Observable<unknown>
        ] => {

      const p = getProcess();
      const error = new TestError('test');
      function onWrite (value: any) {
        p.execute(
          () => {
            if (value === 'o')
              return cold('--------------#', {}, error);
            else
              return cold('--' + value);
          },
        ).subscribe(ignoreErrorSub);
      }
      // user writes
      cold('---o').subscribe(onWrite);
      cold('-------p').subscribe(onWrite);
      cold('-----------r').subscribe(onWrite);

      return [ p, error ];
    },
  },
};

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

  it('merge', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const process
            = new Process(
              { multipleExecutionsStrategy: MULTIPLE_EXECUTIONS_STRATEGY.CONCURRENT });
      const td = scenarios.linear.scenario(
        () => process as any,
        cold,
      );
      const error = td[1];

      expectObservable(process.success$)
        .toBe('---------p---r');
      expectObservable(process.error$)
        .toBe('---n---n-n-n-n---e', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('f--t-------------f', values);
    });
  });
  it.only('concurent', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const process
            = new Process(
              { multipleExecutionsStrategy: MULTIPLE_EXECUTIONS_STRATEGY.ONE_BY_ONE });
      const td = scenarios.linear.scenario(
        () => process as any,
        cold,
      );
      const error = td[1];

      expectObservable(process.success$)
        .toBe('-------------------(pr)'); // TODO - this is fishy (i think r should still wait)
      expectObservable(process.error$)
        .toBe('---n-------------(enn)-(nn)', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('f--t-------------(ft)-f', values);
    });
  });
  it('switch', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const process
            = new Process(
              { multipleExecutionsStrategy: MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP });
      const td = scenarios.linear.scenario(
        () => process as any,
        cold,
      );
      const error = td[1];

      expectObservable(process.success$)
        .toBe('---------p---r');
      expectObservable(process.error$)
        .toBe('---n---n-n-n-n---e', { ...values, e: error });
      expectObservable(process.inProgress$)
        .toBe('f--t-----f-t-f', values);
    });
  });
});
