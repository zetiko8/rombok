/* eslint-disable @typescript-eslint/no-empty-function */
import {
  AsyncProcess,
} from '../../../src';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import { assertCallCount, executeAfter, prepareTestScheduler, spy } from '../../test.helpers';
import { merge, mergeMap, of, Subject, tap } from 'rxjs';

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
         = new AsyncProcess<string, string>(arg => SERVICE.api(arg));

        const sub$ = process.share('a');

        expectObservable(sub$)
          .toBe('-a');
      });
    });
    it('the service function is called only once', () => {
      scheduler.run(({ cold }) => {
        const apiFnSpy = spy(sbx, (arg: string) => cold('--a'));
        const SERVICE = {
          api: apiFnSpy.fn,
        };
        const process
         = new AsyncProcess<string, string>(arg => SERVICE.api(arg));

        const sub$
         = process.share('');

        sub$.subscribe();
        sub$.subscribe();

        executeAfter(cold, '-------a', () => {
          assertCallCount(apiFnSpy.spy, 1);
        });
      });
    });
    it('AsyncProcess.on the service function is called only once', () => {
      scheduler.run(({ cold }) => {
        const apiFnSpy = spy(sbx, () => cold('--a'));
        const SERVICE = {
          api: apiFnSpy.fn,
        };

        const reload$ = new Subject<void>();
        const sub$
         = AsyncProcess.on<unknown, string>(
           merge(
             of(''),
             reload$,
           ),
           () => SERVICE.api(),
         ).share();

        sub$.subscribe();
        sub$.subscribe();

        executeAfter(cold, '-------a', () => {
          assertCallCount(apiFnSpy.spy, 1);
        });
      });
    });
  });
});
