/* eslint-disable @typescript-eslint/no-empty-function */
import {
  BoundProcess2,
} from '../../../src';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import { executeAfter, prepareTestScheduler } from '../../test.helpers';

describe('AsyncProcess.share()', () => {
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

  describe('gets data', () => {
    it('share - sub$', () => {
      scheduler.run(({ cold, expectObservable }) => {

        const SERVICE = {
          api: (arg: string) => cold('-a'),
        };
        const process
         = new BoundProcess2<string, string>(arg => SERVICE.api(arg));

        const sub$ = process.share('a');

        expectObservable(sub$)
          .toBe('-a');
      });
    });
    it('share - isShared', () => {
      scheduler.run(({ cold, expectObservable }) => {

        const SERVICE = {
          api: (arg: string) => cold('-a'),
        };
        const process
         = new BoundProcess2<string, string>(arg => SERVICE.api(arg));

        const sub$ = process.share('a');

        expectObservable(sub$)
          .toBe('-a');

        executeAfter(cold, '----a', () => {
          expectObservable(sub$)
            .toBe('----a');
        });
      });
    });
  });
});
