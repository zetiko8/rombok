/* eslint-disable @typescript-eslint/no-empty-function */
import {
  BoundProcess2,
} from '../../../src';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import { executeAfter, ignoreErrorSub, prepareTestScheduler, TestError } from '../../test.helpers';

/**
 * Besides being a smoke test, it also checks if
 * the SWITCH_MAP strategy works even if the success
 * is not subscribed
 */
describe('loading', () => {
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

  describe('merge', () => {
    it('loading - starts with false', () => {
      scheduler.run(({ cold, expectObservable }) => {

        const SERVICE = {
          api: (arg: string) => cold('-a'),
        };
        const process
         = new BoundProcess2<string, string>(arg => SERVICE.api(arg));

        expectObservable(process.inProgress$)
          .toBe('f');
      });
    });
    it('loading - one after another', () => {
      scheduler.run(({ cold, expectObservable }) => {

        const SERVICE = {
          api: (arg: string) => cold('--a'),
        };
        const process
         = new BoundProcess2<string, string>(arg => SERVICE.api(arg));

        executeAfter(cold, '--a', () => process
          .execute('a')
          .subscribe(ignoreErrorSub));
        executeAfter(cold, '-------a', () => process
          .execute('a')
          .subscribe(ignoreErrorSub));

        expectObservable(process.inProgress$)
          .toBe('f-t-f--t-f');
      });
    });
    it('loading - at same time', () => {
      scheduler.run(({ cold, expectObservable }) => {

        const SERVICE = {
          api: (arg: string) => cold('--a'),
        };
        const process
         = new BoundProcess2<string, string>(arg => SERVICE.api(arg));

        executeAfter(cold, '--a', () => process
          .execute('a')
          .subscribe(ignoreErrorSub));
        executeAfter(cold, '--a', () => process
          .execute('a')
          .subscribe(ignoreErrorSub));

        expectObservable(process.inProgress$)
          .toBe('f-t-f');
      });
    });
    it('loading - covering', () => {
      scheduler.run(({ cold, expectObservable }) => {

        const SERVICE = {
          api: (arg: string) => cold('--a'),
        };
        const process
         = new BoundProcess2<string, string>(arg => SERVICE.api(arg));

        executeAfter(cold, '--a', () => process
          .execute('a')
          .subscribe(ignoreErrorSub));
        executeAfter(cold, '---a', () => process
          .execute('a')
          .subscribe(ignoreErrorSub));

        expectObservable(process.inProgress$)
          .toBe('f-t--f');
      });
    });
    it('loading - covering and error', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const error = new TestError('test');
        const SERVICE = {
          api: (arg: string) => cold('--#', {}, error),
        };
        const process
         = new BoundProcess2<string, string>(arg => SERVICE.api(arg));

        executeAfter(cold, '--a', () => process
          .execute('a')
          .subscribe(ignoreErrorSub));
        executeAfter(cold, '---a', () => process
          .execute('a')
          .subscribe(ignoreErrorSub));

        expectObservable(process.inProgress$)
          .toBe('f-t--f');
      });
    });
  });
});
