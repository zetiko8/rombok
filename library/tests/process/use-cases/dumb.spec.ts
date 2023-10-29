/* eslint-disable @typescript-eslint/no-empty-function */
import {
  Process,
  createConcatProcess,
  createMergeProcess,
  createSwitchProcess,
  MULTIPLE_EXECUTIONS_STRATEGY,
} from '../../../src';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import { prepareTestScheduler, values } from '../../test.helpers';
import { mergeMap } from 'rxjs';

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

        const wraped = createMergeProcess(
          wrap => {
            return cold('-a')
              .pipe(
                wrap(() => cold('-a')),
              );
          },
        );

        expectObservable(wraped.data$)
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

        const wraped = createMergeProcess(
          wrap => {
            return cold('--a')
              .pipe(
                wrap(() => cold('--a')),
              );
          },
        );

        expectObservable(wraped.data$)
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

        const wraped = createMergeProcess(
          wrap => {
            return cold('--a')
              .pipe(
                wrap(() => cold('--a')),
              );
          },
        );
        expectObservable(wraped.data$)
          .toBe('----a');
        expectObservable(wraped.inProgress$)
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

        const wraped = createMergeProcess(
          wrap => {
            return cold('--a')
              .pipe(
                wrap(() => cold('--a')),
              );
          },
        );
        expectObservable(wraped.data$)
          .toBe('----a');
        expectObservable(wraped.error$)
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

        const wraped = createConcatProcess(
          wrap => {
            return cold('-a')
              .pipe(
                wrap(() => cold('-a')),
              );
          },
        );

        expectObservable(wraped.data$)
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

        const wraped = createConcatProcess(
          wrap => {
            return cold('--a')
              .pipe(
                wrap(() => cold('--a')),
              );
          },
        );

        expectObservable(wraped.data$)
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

        const wraped = createConcatProcess(
          wrap => {
            return cold('--a')
              .pipe(
                wrap(() => cold('--a')),
              );
          },
        );

        expectObservable(wraped.data$)
          .toBe('----a');
        expectObservable(wraped.inProgress$)
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

        const wraped = createConcatProcess(
          wrap => {
            return cold('--a')
              .pipe(
                wrap(() => cold('--a')),
              );
          },
        );

        expectObservable(wraped.data$)
          .toBe('----a');
        expectObservable(wraped.error$)
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

        const wraped = createSwitchProcess(
          wrap => {
            return cold('-a')
              .pipe(
                wrap(() => cold('-a')),
              );
          },
        );

        expectObservable(wraped.data$)
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

        const wraped = createSwitchProcess(
          wrap => {
            return cold('--a')
              .pipe(
                wrap(() => cold('--a')),
              );
          },
        );

        expectObservable(wraped.data$)
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

        const wraped = createSwitchProcess(
          wrap => {
            return cold('--a')
              .pipe(
                wrap(() => cold('--a')),
              );
          },
        );

        expectObservable(wraped.data$)
          .toBe('----a');
        expectObservable(wraped.inProgress$)
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

        const wraped = createSwitchProcess(
          wrap => {
            return cold('--a')
              .pipe(
                wrap(() => cold('--a')),
              );
          },
        );

        expectObservable(wraped.data$)
          .toBe('----a');
        expectObservable(wraped.error$)
          .toBe('n----', values);
      });
    });
  });
});
