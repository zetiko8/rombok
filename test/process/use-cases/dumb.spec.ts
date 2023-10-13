/* eslint-disable @typescript-eslint/no-empty-function */
import { Process, wrapConcatProcess, wrapMergeProcess, wrapSwitchProcess } from '../../../src';
import { MULTIPLE_EXECUTIONS_STRATEGY } from '../../../src/loading-handling';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import { prepareTestScheduler, values } from '../../test.helpers';
import { ReplaySubject, mergeMap } from 'rxjs';

/**
 * Besides being a smoke test, it also checks if
 * the SWITCH_MAP strategy works even if the success
 * is not subscribed
 */
describe('dumb', () => {
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
    it('just execute', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const process
         = new Process<string>({
           multipleExecutionsStrategy:
            MULTIPLE_EXECUTIONS_STRATEGY.MERGE_MAP,
         });

        const sub$ = cold('-a')
          .pipe(
            mergeMap(
              () => process.execute(() => cold('-a')),
            ),
          );

        expectObservable(sub$)
          .toBe('--a');

        // wrapMergeProcess
        const data$ = cold('-a')
          .pipe(
            wrapMergeProcess(() => cold('-a')),
          );

        expectObservable(data$)
          .toBe('--a');
      });
    });
    it('success$', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const process
         = new Process<string>({
           multipleExecutionsStrategy:
            MULTIPLE_EXECUTIONS_STRATEGY.MERGE_MAP,
         });

        const sub$ = cold('--a')
          .pipe(
            mergeMap(
              () => process.execute(() => cold('--a')),
            ),
          );

        expectObservable(sub$)
          .toBe('----a');
        expectObservable(process.success$)
          .toBe('----a');

        // wrapMergeProcess
        const data$ = cold('--a')
          .pipe(
            wrapMergeProcess(() => cold('--a')),
          );

        expectObservable(data$)
          .toBe('----a');
      });
    });
    it('inProgress$', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const process
         = new Process<string>({
           multipleExecutionsStrategy:
            MULTIPLE_EXECUTIONS_STRATEGY.MERGE_MAP,
         });

        const sub$ = cold('--a')
          .pipe(
            mergeMap(
              () => process.execute(() => cold('--a')),
            ),
          );

        expectObservable(sub$)
          .toBe('----a');
        expectObservable(process.inProgress$)
          .toBe('f-t-f', values);

        // wrapMergeProcess
        const inProgress$ = new ReplaySubject<boolean>(1);
        const data$ = cold('--a')
          .pipe(
            wrapMergeProcess(() => cold('--a'), { inProgress$ }),
          );

        expectObservable(data$)
          .toBe('----a');
        expectObservable(inProgress$)
          .toBe('f-t-f', values);
      });
    });
    it('error$', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const process
         = new Process<string>({
           multipleExecutionsStrategy:
            MULTIPLE_EXECUTIONS_STRATEGY.MERGE_MAP,
         });

        const sub$ = cold('--a')
          .pipe(
            mergeMap(
              () => process.execute(() => cold('--a')),
            ),
          );

        expectObservable(sub$)
          .toBe('----a');
        expectObservable(process.error$)
          .toBe('n----', values);

        // wrapMergeProcess
        const error$ = new ReplaySubject<Error | null>(1);
        const data$ = cold('--a')
          .pipe(
            wrapMergeProcess(() => cold('--a'), { error$ }),
          );

        expectObservable(data$)
          .toBe('----a');
        expectObservable(error$)
          .toBe('n----', values);
      });
    });
  });
  describe('concat', () => {
    it('just execute', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const process
         = new Process<string>({
           multipleExecutionsStrategy:
            MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP,
         });

        const sub$ = cold('-a')
          .pipe(
            mergeMap(
              () => process.execute(() => cold('-a')),
            ),
          );

        expectObservable(sub$)
          .toBe('--a');

        // wrapProcess
        const data$ = cold('-a')
          .pipe(
            wrapConcatProcess(() => cold('-a')),
          );

        expectObservable(data$)
          .toBe('--a');
      });
    });
    it('success$', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const process
         = new Process<string>({
           multipleExecutionsStrategy:
            MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP,
         });

        const sub$ = cold('--a')
          .pipe(
            mergeMap(
              () => process.execute(() => cold('--a')),
            ),
          );

        expectObservable(sub$)
          .toBe('----a');
        expectObservable(process.success$)
          .toBe('----a');

        // wrapProcess
        const data$ = cold('--a')
          .pipe(
            wrapConcatProcess(() => cold('--a')),
          );

        expectObservable(data$)
          .toBe('----a');
      });
    });
    it('inProgress$', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const process
         = new Process<string>({
           multipleExecutionsStrategy:
            MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP,
         });

        const sub$ = cold('--a')
          .pipe(
            mergeMap(
              () => process.execute(() => cold('--a')),
            ),
          );

        expectObservable(sub$)
          .toBe('----a');
        expectObservable(process.inProgress$)
          .toBe('f-t-f', values);

        // wrapProcess
        const inProgress$ = new ReplaySubject<boolean>(1);
        const data$ = cold('--a')
          .pipe(
            wrapConcatProcess(() => cold('--a'), { inProgress$ }),
          );

        expectObservable(data$)
          .toBe('----a');
        expectObservable(inProgress$)
          .toBe('f-t-f', values);
      });
    });
    it('error$', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const process
         = new Process<string>({
           multipleExecutionsStrategy:
            MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP,
         });

        const sub$ = cold('--a')
          .pipe(
            mergeMap(
              () => process.execute(() => cold('--a')),
            ),
          );

        expectObservable(sub$)
          .toBe('----a');
        expectObservable(process.error$)
          .toBe('n----', values);

        // wrapProcess
        const error$ = new ReplaySubject<Error | null>(1);
        const data$ = cold('--a')
          .pipe(
            wrapConcatProcess(() => cold('--a'), { error$ }),
          );

        expectObservable(data$)
          .toBe('----a');
        expectObservable(error$)
          .toBe('n----', values);
      });
    });
  });
  describe('switch', () => {
    it('just execute', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const process
         = new Process<string>({
           multipleExecutionsStrategy:
            MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP,
         });

        const sub$ = cold('-a')
          .pipe(
            mergeMap(
              () => process.execute(() => cold('-a')),
            ),
          );

        expectObservable(sub$)
          .toBe('--a');

        // wrapProcess
        const data$ = cold('-a')
          .pipe(
            wrapSwitchProcess(() => cold('-a')),
          );

        expectObservable(data$)
          .toBe('--a');
      });
    });
    it('success$', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const process
         = new Process<string>({
           multipleExecutionsStrategy:
            MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP,
         });

        const sub$ = cold('--a')
          .pipe(
            mergeMap(
              () => process.execute(() => cold('--a')),
            ),
          );

        expectObservable(sub$)
          .toBe('----a');
        expectObservable(process.success$)
          .toBe('----a');

        // wrapProcess
        const data$ = cold('--a')
          .pipe(
            wrapSwitchProcess(() => cold('--a')),
          );

        expectObservable(data$)
          .toBe('----a');
      });
    });
    it('inProgress$', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const process
         = new Process<string>({
           multipleExecutionsStrategy:
            MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP,
         });

        const sub$ = cold('--a')
          .pipe(
            mergeMap(
              () => process.execute(() => cold('--a')),
            ),
          );

        expectObservable(sub$)
          .toBe('----a');
        expectObservable(process.inProgress$)
          .toBe('f-t-f', values);

        // wrapProcess
        const inProgress$ = new ReplaySubject<boolean>(1);
        const data$ = cold('--a')
          .pipe(
            wrapSwitchProcess(() => cold('--a'), { inProgress$ }),
          );

        expectObservable(data$)
          .toBe('----a');
        expectObservable(inProgress$)
          .toBe('f-t-f', values);
      });
    });
    it('error$', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const process
         = new Process<string>({
           multipleExecutionsStrategy:
            MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP,
         });

        const sub$ = cold('--a')
          .pipe(
            mergeMap(
              () => process.execute(() => cold('--a')),
            ),
          );

        expectObservable(sub$)
          .toBe('----a');
        expectObservable(process.error$)
          .toBe('n----', values);

        // wrapProcess
        const error$ = new ReplaySubject<Error | null>(1);
        const data$ = cold('--a')
          .pipe(
            wrapSwitchProcess(() => cold('--a'), { error$ }),
          );

        expectObservable(data$)
          .toBe('----a');
        expectObservable(error$)
          .toBe('n----', values);
      });
    });
  });
});
