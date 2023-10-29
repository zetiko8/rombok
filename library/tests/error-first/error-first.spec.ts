/* eslint-disable @typescript-eslint/no-empty-function */
import {
  errorFirst,
} from '../../src';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import {
  TestError,
  prepareTestScheduler,
  values,
} from '../test.helpers';
import { map } from 'rxjs/operators';

/**
   * Besides being a smoke test, it also checks if
   * the SWITCH_MAP strategy works even if the success
   * is not subscribed
   */
describe('error first', () => {
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

  it('no error', () => {
    scheduler.run(({ cold, expectObservable }) => {

      const error = new TestError('test');
      const sub$ = cold('a').pipe(errorFirst());

      expectObservable(
        sub$.pipe(map(([ error, data ]) => {
          return data;
        })),
      )
        .toBe('a', { ...values, e: error });
      expectObservable(
        sub$.pipe(map(([ error ]) => {
          return error;
        })),
      )
        .toBe('n', { ...values, e: error });
    });
  });
  it('error', () => {
    scheduler.run(({ cold, expectObservable }) => {

      const error = new TestError('test');
      const sub$ = cold('#', values, error).pipe(errorFirst());

      expectObservable(
        sub$.pipe(map(([ error, data ]) => {
          return data;
        })),
      )
        .toBe('(n|)', { ...values, e: error });
      expectObservable(
        sub$.pipe(map(([ error ]) => {
          return error;
        })),
      )
        .toBe('(e|)', { ...values, e: error });
    });
  });
});
