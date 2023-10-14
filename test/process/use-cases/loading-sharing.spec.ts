/* eslint-disable @typescript-eslint/no-empty-function */
import {
  Process,
  MULTIPLE_EXECUTIONS_STRATEGY,
  createMergeProcess,
  createConcatProcess,
  createSwitchProcess,
} from '../../../src';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import {
  fakeApiCall,
  getProcessorTestReturns,
  getProcessTestReturns,
  prepareTestScheduler,
  values,
} from '../../test.helpers';
import {
  mergeMap,
} from 'rxjs/operators';

describe('loading sharing', () => {
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
      const getProccesFn = () => (value: string) => {
        return fakeApiCall(cold<string>('---' + value));
      };

      const triggers = [
        cold<string>('--o'),
        cold<string>('----------r'),
      ];

      getProcessTestReturns(
        sbx,
        process,
        getProccesFn,
        triggers,
      );
      const wrapProcess = getProcessorTestReturns(
        sbx,
        createMergeProcess,
        getProccesFn,
        triggers,
      );

      const sucessP  = '-----o-------r';
      const loadingP = 'f-t--f----t--f';
      const lateSub  = '---s';
      const lateSubP = '---t-f----t--f';
      expectObservable(process.success$)
        .toBe(sucessP);
      expectObservable(process.inProgress$)
        .toBe(loadingP, values);

      // wrapProcess
      expectObservable(wrapProcess.success$)
        .toBe(sucessP);
      expectObservable(wrapProcess.inProgress$)
        .toBe(loadingP, values);
      const lateSub$ =
         cold(lateSub)
           .pipe(
             mergeMap(() => wrapProcess.inProgress$),
           );
      expectObservable(lateSub$)
        .toBe(lateSubP, values);
    });
  });
  it('concat', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const process
       = new Process<string>({
         multipleExecutionsStrategy:
          MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP,
       });

      const getProccesFn = () => (value: string) => {
        return fakeApiCall(cold<string>('---' + value));
      };

      const triggers = [
        cold<string>('--o'),
        cold<string>('----------r'),
      ];

      getProcessTestReturns(
        sbx,
        process,
        getProccesFn,
        triggers,
      );
      const wrapProcess = getProcessorTestReturns(
        sbx,
        createConcatProcess,
        getProccesFn,
        triggers,
      );

      const sucessP  = '-----o-------r';
      const loadingP = 'f-t--f----t--f';
      const lateSub  = '---s';
      const lateSubP = '---t-f----t--f';
      expectObservable(process.success$)
        .toBe(sucessP);
      expectObservable(process.inProgress$)
        .toBe(loadingP, values);

      // wrapProcess
      expectObservable(wrapProcess.success$)
        .toBe(sucessP);
      expectObservable(wrapProcess.inProgress$)
        .toBe(loadingP, values);
      const lateSub$ =
           cold(lateSub)
             .pipe(
               mergeMap(() => wrapProcess.inProgress$),
             );
      expectObservable(lateSub$)
        .toBe(lateSubP, values);
    });
  });
  it('switch', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const process
       = new Process<string>({
         multipleExecutionsStrategy:
          MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP,
       });
      const getProccesFn = () => (value: string) => {
        return fakeApiCall(cold<string>('---' + value));
      };

      const triggers = [
        cold<string>('--o'),
        cold<string>('----------r'),
      ];

      getProcessTestReturns(
        sbx,
        process,
        getProccesFn,
        triggers,
      );
      const wrapProcess = getProcessorTestReturns(
        sbx,
        createSwitchProcess,
        getProccesFn,
        triggers,
      );

      const sucessP  = '-----o-------r';
      const loadingP = 'f-t--f----t--f';
      const lateSub  = '---s';
      const lateSubP = '---t-f----t--f';
      expectObservable(process.success$)
        .toBe(sucessP);
      expectObservable(process.inProgress$)
        .toBe(loadingP, values);

      // wrapProcess
      expectObservable(wrapProcess.success$)
        .toBe(sucessP);
      expectObservable(wrapProcess.inProgress$)
        .toBe(loadingP, values);
      const lateSub$ =
           cold(lateSub)
             .pipe(
               mergeMap(() => wrapProcess.inProgress$),
             );
      expectObservable(lateSub$)
        .toBe(lateSubP, values);
    });
  });
});
