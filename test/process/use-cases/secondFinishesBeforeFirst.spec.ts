/* eslint-disable @typescript-eslint/no-empty-function */
import { Process } from '../../../src';
import { MULTIPLE_EXECUTIONS_STRATEGY } from '../../../src/loading-handling';
import { TestScheduler } from 'rxjs/testing';
import * as chai from 'chai';
import { createSandbox, SinonSandbox } from 'sinon';
import * as sinonChai from 'sinon-chai';
import { prepareTestScheduler, TestError } from '../../test.helpers';
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable';
import { Observable } from 'rxjs';

chai.use(sinonChai);
const expect = chai.expect;

const values = {
  t: true, f: false, a: 'a', b: 'b', c: 'c', n: null, v: 'v',
  w: 'w',
  o: 'o', p: 'p', r: 'r', s: 's', u: 'u',
};

  type ColdCreator = <T = string>(marbles: string, values?: {
    [marble: string]: T;
  } | undefined, error?: any) => ColdObservable<T>;


const scenario = (
  process: Process<string>,
  cold: ColdCreator,
): [
  TestError,
  (value: string) => Observable<string>,
] => {

  const error = new TestError('test');
  const processFn = (value: string) => {
    if (value === 'o')
      return cold('-------' + value);
    else
      return cold('--' + value);
  };
  function onWrite (value: any) {
    process.execute(
      () => {
        if (value === 'o')
          return cold('-------' + value);
        else
          return cold('--' + value);
      },
    ).subscribe();
  }
  // user writes
  cold('---o').subscribe(onWrite);
  cold('-------p').subscribe(onWrite);
  cold('-----------r').subscribe(onWrite);

  return [ error, processFn ];
};

describe('second finishes before first', () => {
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
       = new Process<string>({
         multipleExecutionsStrategy:
          MULTIPLE_EXECUTIONS_STRATEGY.MERGE_MAP,
       });
      const [ error, processFn ]
        = scenario(process, cold);

      expectObservable(process.success$)
        .toBe('---------po--r');
      expectObservable(process.error$)
        .toBe('---n---n-nnn-n', values);
      expectObservable(process.inProgress$)
        .toBe('f--t------ft-f', values);
    });
  });
  it('concurent', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const process
       = new Process<string>({
         multipleExecutionsStrategy:
          MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP,
       });
      const [ error, processFn ]
        = scenario(process, cold);

      expectObservable(process.success$)
        .toBe('----------o--p--r');
      expectObservable(process.error$)
        .toBe('---n------nn-nn-n', values);
      expectObservable(process.inProgress$)
        .toBe('f--t------ft-ft-f', values);
    });
  });
  it('switch', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const process
       = new Process<string>({
         multipleExecutionsStrategy:
          MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP,
       });
      const [ error, processFn ]
        = scenario(process, cold);

      expectObservable(process.success$)
        .toBe('---------p---r');
      expectObservable(process.error$)
        .toBe('---n---n-nnn-n', values);
      expectObservable(process.inProgress$)
        .toBe('f--t-----f-t-f', values);
    });
  });
});
