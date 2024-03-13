/* eslint-disable @typescript-eslint/no-empty-function */
import {
  BoundProcess2,
} from '../../../src';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import { TestError, prepareTestScheduler, values } from '../../test.helpers';
import { ignoreErrorSub } from '@zetiko8/rxjs-testing-helpers';

describe('smoke', () => {
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
    it('execute - sub$', () => {
      scheduler.run(({ cold, expectObservable }) => {

        const SERVICE = {
          api: (arg: string) => cold('-a'),
        };
        const process
         = new BoundProcess2<string, string>(arg => SERVICE.api(arg));

        const sub$ = process.execute('a');

        expectObservable(sub$)
          .toBe('-a');
      });
    });
    it('execute - data$', () => {
      scheduler.run(({ cold, expectObservable }) => {

        const SERVICE = {
          api: (arg: string) => cold('--a'),
        };
        const process
         = new BoundProcess2<string, string>(arg => SERVICE.api(arg));

        const sub$ = process.execute('a');
        sub$.subscribe();
        expectObservable(process.data$)
          .toBe('--a');
      });
    });
    it('execute - inProgress$', () => {
      scheduler.run(({ cold, expectObservable }) => {

        const SERVICE = {
          api: (arg: string) => cold('--a'),
        };
        const process
         = new BoundProcess2<string, string>(arg => SERVICE.api(arg));

        const sub$ = process.execute('a');
        sub$.subscribe();
        expectObservable(process.inProgress$)
          .toBe('(ft)-f');
      });
    });
    it('execute - error$ (no error)', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const SERVICE = {
          api: (arg: string) => cold('--a'),
        };
        const process
         = new BoundProcess2<string, string>(arg => SERVICE.api(arg));

        const sub$ = process.execute('a');
        sub$.subscribe();
        expectObservable(process.error$)
          .toBe('--n', values);
      });
    });
    it('execute - error$ (error)', () => {
      scheduler.run(({ cold, expectObservable }) => {

        const testError = new TestError('test');
        const SERVICE = {
          api: (arg: string) => cold('--#', {}, testError),
        };
        const process
         = new BoundProcess2<string, string>(arg => SERVICE.api(arg));

        const sub$ = process.execute('a');
        sub$.subscribe(ignoreErrorSub);
        expectObservable(process.error$)
          .toBe('--e', { ...values, e: testError });
      });
    });
    it('execute.next({ error })', () => {
      scheduler.run(({ cold, expectObservable }) => {

        const testError = new TestError('test');
        const SERVICE = {
          api: (arg: string) => cold('--#', {}, testError),
        };
        const process
         = new BoundProcess2<string, string>(arg => SERVICE.api(arg));

        const sub$ = process.execute('a');
        expectObservable(sub$)
          .toBe('--#', { ...values, e: testError }, testError);
      });
    });
  });
});
