/* eslint-disable @typescript-eslint/no-empty-function */
import {
  createConcatProcess,
  createMergeProcess,
  createSwitchProcess,
} from '../../../src';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import {
  assertCallCount,
  createAfter$,
  executeAfter,
  fakeApiCall,
  fakeInterval,
  prepareTestScheduler,
  spy,
} from '../../test.helpers';
import {
  tap,
  take,
} from 'rxjs';
import { expect } from 'chai';

/**
   * Besides being a smoke test, it also checks if
   * the SWITCH_MAP strategy works even if the success
   * is not subscribed
   */
describe('data sharing', () => {
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

  [
    {
      name: 'merge',
      createProcess: createMergeProcess,
    },
    {
      name: 'concat',
      createProcess: createConcatProcess,
    },
    {
      name: 'switch',
      createProcess: createSwitchProcess,
    },
  ].forEach(mode => {
    describe(mode.name, () => {
      it('two subscribers', () => {
        scheduler.run(({ cold }) => {
          let numOfA = 0;
          let numOfB = 0;
          let numOfC = 0;
          const spyWrapper = spy(sbx, () => fakeApiCall(cold('a')));
          const wrapedProcess = mode.createProcess(wrap => {
            return fakeInterval(cold, 0, 5)
              .pipe(
                tap(() => numOfA++),
              )
              .pipe(
                wrap((spyWrapper.fn), { share: true }),
              );
          });
          wrapedProcess.data$
            .subscribe(() => numOfB++);
          wrapedProcess.data$
            .subscribe(() => numOfC++);

          createAfter$(cold)
            .subscribe(() => {
              expect(numOfA).to.equal(5);
              expect(numOfB).to.equal(5);
              expect(numOfC).to.equal(5);
              assertCallCount(spyWrapper.spy, 5);
            });
        });
      });
      it('two subscribers - first unsubscribes later', () => {
        scheduler.run(({ cold }) => {
          let numOfA = 0;
          let numOfB = 0;
          let numOfC = 0;
          const spyWrapper = spy(sbx, () => fakeApiCall(cold('a')));
          const wrapedProcess = mode.createProcess(wrap => {
            return fakeInterval(cold, 0, 5)
              .pipe(
                tap(() => numOfA++),
              )
              .pipe(
                wrap((spyWrapper.fn), { share: true }),
              );
          });
          wrapedProcess.data$
            .pipe(take(2))
            .subscribe(() => numOfB++);
          wrapedProcess.data$
            .subscribe(() => numOfC++);

          createAfter$(cold)
            .subscribe(() => {
              expect(numOfA).to.equal(5);
              expect(numOfB).to.equal(2);
              expect(numOfC).to.equal(5);
              assertCallCount(spyWrapper.spy, 5);
            });
        });
      });
      it('two subscribers - second subscribes later', () => {
        scheduler.run(({ cold }) => {
          const cnt = {
            numOfA: 0,
            numOfB: 0,
            numOfC: 0,
          };
          const spyWrapper = spy(sbx, () => {
            return fakeApiCall(cold('a'));
          });
          const wrapedProcess = mode.createProcess(wrap => {
            return fakeInterval(cold, 0, 5)
              .pipe(
                tap(() => cnt.numOfA++),
              )
              .pipe(
                wrap((spyWrapper.fn), { share: true }),
              );
          });
          wrapedProcess.data$
            .subscribe({
              next: () => cnt.numOfB++,
            });

          executeAfter(cold, '--t', () => {
            wrapedProcess.data$
              .subscribe({
                next: () => cnt.numOfC++,
              });
          });

          createAfter$(cold)
            .subscribe(() => {
              expect(cnt.numOfA).to.equal(5);
              expect(cnt.numOfB).to.equal(5);
              expect(cnt.numOfC).to.equal(4);
              assertCallCount(spyWrapper.spy, 5);
            });
        });
      });
      it('two subscribers - second subscribes later, but before first unsubscribes', () => {
        scheduler.run(({ cold }) => {
          const cnt = {
            numOfA: 0,
            numOfB: 0,
            numOfC: 0,
          };
          const spyWrapper = spy(sbx, () => {
            return fakeApiCall(cold('a'));
          });
          const wrapedProcess = mode.createProcess(wrap => {
            return fakeInterval(cold, 0, 5)
              .pipe(
                tap(() => cnt.numOfA++),
              )
              .pipe(
                wrap((spyWrapper.fn), { share: true }),
              );
          });
          wrapedProcess.data$
            .pipe(take(3))
            .subscribe({
              next: () => cnt.numOfB++,
            });

          executeAfter(cold, '--t', () => {
            wrapedProcess.data$
              .subscribe({
                next: () => cnt.numOfC++,
              });
          });

          createAfter$(cold)
            .subscribe(() => {
              expect(cnt.numOfA).to.equal(5);
              expect(cnt.numOfB).to.equal(3);
              expect(cnt.numOfC).to.equal(4);
              assertCallCount(spyWrapper.spy, 5);
            });
        });
      });
      it('two subscribers - second subscribes later, but after first unsubscribes', () => {
        scheduler.run(({ cold }) => {
          const cnt = {
            numOfA: 0,
            numOfB: 0,
            numOfC: 0,
          };
          const spyWrapper = spy(sbx, () => {
            return fakeApiCall(cold('a'));
          });
          const wrapedProcess = createMergeProcess(wrap => {
            return fakeInterval(cold, 0, 5)
              .pipe(
                tap(() => cnt.numOfA++),
              )
              .pipe(
                wrap((spyWrapper.fn)),
              );
          });
          wrapedProcess.data$
            .pipe(take(3))
            .subscribe({
              next: () => cnt.numOfB++,
            });

          executeAfter(cold, '---t', () => {
            wrapedProcess.data$
              .subscribe({
                next: () => cnt.numOfC++,
              });
          });

          createAfter$(cold)
            .subscribe(() => {
              expect(cnt.numOfA).to.equal(8);
              expect(cnt.numOfB).to.equal(3);
              expect(cnt.numOfC).to.equal(5);
              assertCallCount(spyWrapper.spy, 8);
            });
        });
      });
    });
  });
});
