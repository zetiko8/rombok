import {
  errorFirst,
  errorFirstToResult,
  throwErrorFirstToGlobal,
  throwErrorToGlobal,
} from '../../src';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import {
  TestError,
  expectToNotThrow,
  expectToThrow,
  prepareTestScheduler,
  values,
} from '../test.helpers';

describe('throwErrorToGlobal', () => {
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
    expectToNotThrow(
      () => scheduler.run(({ cold, expectObservable }) => {
        const error = new TestError('test');
        const sub$ = cold('a')
          .pipe(throwErrorToGlobal());

        expectObservable(sub$)
          .toBe('a', { ...values, e: error });
      }));
  });
  it('error', () => {
    expectToThrow(
      () => scheduler.run(({ cold, expectObservable }) => {
        const error = new TestError('test');
        const sub$ = cold('#', values, error)
          .pipe(throwErrorToGlobal());

        expectObservable(sub$)
          .toBe('#', values, error);
      })).with('test');
  });
});

describe('throwErrorFirstToGlobal', () => {
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
    expectToNotThrow(
      () =>     scheduler.run(({ cold, expectObservable }) => {
        const error = new TestError('test');
        const sub$ = cold('a')
          .pipe(
            errorFirst(),
            throwErrorToGlobal(),
            errorFirstToResult(),
          );

        expectObservable(sub$)
          .toBe('a', { ...values, e: error });
      }));
  });
  it('error', () => {
    expectToThrow(
      () => scheduler.run(({ cold, expectObservable }) => {
        const error = new TestError('test');
        const sub$ = cold('#', values, error)
          .pipe(
            errorFirst(),
            throwErrorFirstToGlobal(),
            errorFirstToResult(),
          );

        expectObservable(sub$)
          .toBe('|', values, error);
      })).with('test');
  });
});
