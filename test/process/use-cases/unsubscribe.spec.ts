import {
  createConcatProcess,
  createMergeProcess,
  createSwitchProcess,
} from '../../../src';
import { TestScheduler } from 'rxjs/testing';
import { createSandbox, SinonSandbox } from 'sinon';
import {
  createAfter$,
  fakeApiCall,
  fakeInterval,
  prepareTestScheduler,
  spy,
  noop,
} from '../../test.helpers';
import { shareReplay, tap } from 'rxjs/operators';
import { expect } from 'chai';

describe('unsubscribe', () => {
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
      it('leak because of share replay', () => {
        scheduler.run(({ cold }) => {
          let numOfA = 0;
          let numOfB = 0;
          const wrapedProcess = mode.createProcess(wrap => {
            return fakeInterval(cold, 1, 10)
              .pipe(
                tap(() => numOfA++),
                shareReplay(1),
              )
              .pipe(
                wrap((() => fakeApiCall(cold('a')))),
              );
          });
          const subscription
              = wrapedProcess.data$
                .subscribe(() => numOfB++);

          cold('--t').subscribe(() => {
            subscription.unsubscribe();
          });

          createAfter$(cold)
            .subscribe(() => {
              expect(numOfA).to.equal(10);
              expect(numOfB).to.equal(1);
            });
        });
      });
      it('no leak', () => {
        scheduler.run(({ cold }) => {
          let numOfA = 0;
          let numOfB = 0;
          const wrapedProcess = mode.createProcess(wrap => {
            return fakeInterval(cold, 1, 5)
              .pipe(
                tap(() => numOfA++),
              )
              .pipe(
                wrap((() => fakeApiCall(cold('a')))),
              );
          });
          const subscription
              = wrapedProcess.data$
                .subscribe(() => numOfB++);

          cold('--t').subscribe(() => {
            subscription.unsubscribe();
          });

          createAfter$(cold)
            .subscribe(() => {
              expect(numOfA).to.equal(1);
              expect(numOfB).to.equal(1);
            });
        });
      });
      it('remains if only one unsubscribes', () => {
        scheduler.run(({ cold }) => {
          let numOfA = 0;
          let numOfB = 0;
          const spyWrapper = spy(sbx, () => fakeApiCall(cold('a')));
          const wrapedProcess = mode.createProcess(wrap => {
            return fakeInterval(cold, 1, 5)
              .pipe(
                tap(() => numOfA++),
              )
              .pipe(
                wrap((spyWrapper.fn)),
              );
          });
          const subscription
              = wrapedProcess.data$
                .subscribe(() => numOfB++);
          wrapedProcess.data$
            .subscribe(noop);

          cold('----t').subscribe(() => {
            wrapedProcess.data$
              .subscribe(noop);
          });

          cold('--t').subscribe(() => {
            subscription.unsubscribe();
          });

          createAfter$(cold)
            .subscribe(() => {
              expect(numOfA).to.equal(5);
              expect(numOfB).to.equal(1);
            });
        });
      });
    });
  });
  it('shareReplay poc', () => {
    scheduler.run(({ cold }) => {
      let numOfA = 0;
      let numOfB = 0;
      const interval$ = fakeInterval(cold, 1, 10)
        .pipe(
          tap(() => numOfA++),
          shareReplay(1),
        );

      const subscription
        = interval$
          .subscribe(() => numOfB++);

      cold('--t').subscribe(() => {
        subscription.unsubscribe();
      });

      createAfter$(cold)
        .subscribe(() => {
          expect(numOfA).to.equal(10);
          expect(numOfB).to.equal(1);
        });
    });
  });
  it('no shareReplay poc', () => {
    scheduler.run(({ cold }) => {
      let numOfA = 0;
      let numOfB = 0;
      const interval$ = fakeInterval(cold, 1, 10)
        .pipe(
          tap(() => numOfA++),
        );

      const subscription
        = interval$
          .subscribe(() => numOfB++);

      cold('--t').subscribe(() => {
        subscription.unsubscribe();
      });

      createAfter$(cold)
        .subscribe(() => {
          expect(numOfA).to.equal(1);
          expect(numOfB).to.equal(1);
        });
    });
  });
});
