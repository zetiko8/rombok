/* eslint-disable @typescript-eslint/no-empty-function */
import {
  BoundProcess2,
} from '../../../src';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import { prepareTestScheduler, TestError } from '../../test.helpers';

/**
 * Besides being a smoke test, it also checks if
 * the SWITCH_MAP strategy works even if the success
 * is not subscribed
 */
describe('errors', () => {
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

  describe('consumers get an error', () => {
    it('execute()', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const error = new TestError('test');
        const SERVICE = {
          api: (arg: string) => cold('--#', {}, error),
        };
        const process
         = new BoundProcess2<string, string>(arg => SERVICE.api(arg));

        expectObservable(process.execute('a'))
          .toBe('--#', {}, error);
      });
    });
    it('share()', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const error = new TestError('test');
        const SERVICE = {
          api: (arg: string) => cold('--#', {}, error),
        };
        const process
         = new BoundProcess2<string, string>(arg => SERVICE.api(arg));

        expectObservable(process.share('a'))
          .toBe('--#', {}, error);
      });
    });
  });
});
