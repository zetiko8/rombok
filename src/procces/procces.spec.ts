/* eslint-disable @typescript-eslint/no-empty-function */
import { Process } from '.';
import { mergeMap, take } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import * as chai from 'chai';
import { createSandbox, SinonSandbox } from 'sinon';
import * as sinonChai from 'sinon-chai';
import { Observable } from 'rxjs';
import { prepareTestScheduler, TestError } from '../test.helpers';
import { logger } from '../debug-helpers';
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { log } from '../utils';

chai.use(sinonChai);
const expect = chai.expect;

logger.logLevel = 3;

const values = {
  t: true, f: false, a: 'a', b: 'b', n: null, v: 'v' };

type ColdCreator = <T = string>(marbles: string, values?: {
  [marble: string]: T;
} | undefined, error?: any) => ColdObservable<T>;

const scenarios = {
  ['--a']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>
  ] => {
    const p = new Process();
    const sub$ = p.execute(
      () => cold('--a', values),
    );

    return [ p, sub$ ];
  },
  ['--#']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
    const p = new Process();
    const error = new TestError('Test error');
    const sub$ = p.execute(
      () => cold('--#', values, error),
    );

    return [ p, sub$, error ];
  },
  ['sync((--a)(--b))']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
  ] => {
    const p = new Process();
    const sub$ = p.execute(
      () => cold('--a', values),
    );
    const sub$1 = p.execute(
      () => cold('--b', values),
    );
    return [ p, sub$, sub$1 ];
  },
  ['sync((--#)(--b))']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
    const p = new Process();
    const error = new TestError('Test error');
    const sub$ = p.execute(
      () => cold('--#', values, error),
    );
    const sub$1 = p.execute(
      () => cold('--b', values, error),
    );

    return [ p, sub$, sub$1, error ];
  },
  ['sync((--a)(--#))']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
    const p = new Process();
    const error = new TestError('Test error');
    const sub$ = p.execute(
      () => cold('--a', values, error),
    );
    const sub$1 = p.execute(
      () => cold('--#', values, error),
    );

    return [ p, sub$, sub$1, error ];
  },
  ['sync((-a)(--b))']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
  ] => {
    const p = new Process();
    const sub$ = p.execute(
      () => cold('-a', values),
    );
    const sub$1 = p.execute(
      () => cold('--b', values),
    );
    return [ p, sub$, sub$1 ];
  },
  ['sync((-#)(--b))']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
    const p = new Process();
    const error = new TestError('Test error');
    const sub$ = p.execute(
      () => cold('-#', values, error),
    );
    const sub$1 = p.execute(
      () => cold('--b', values, error),
    );

    return [ p, sub$, sub$1, error ];
  },
  ['sync((--a)(-b))']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
  ] => {
    const p = new Process();
    const sub$ = p.execute(
      () => cold('--a', values),
    );
    const sub$1 = p.execute(
      () => cold('-b', values),
    );
    return [ p, sub$, sub$1 ];
  },
  ['sync((--#)(-b))']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
    const p = new Process();
    const error = new TestError('Test error');
    const sub$ = p.execute(
      () => cold('--#', values, error),
    );
    const sub$1 = p.execute(
      () => cold('-b', values, error),
    );

    return [ p, sub$, sub$1, error ];
  },
  ['--exec(--a)']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>
  ] => {
    const p = new Process();
    const sub$
      = cold('--a', values)
        .pipe(
          take(1),
          mergeMap(() => p.execute(
            () => cold('--a', values),
          )),
        );

    return [ p, sub$ ];
  },
  ['--exec(--#)']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
    const p = new Process();
    const error = new TestError('Test error');
    const sub$
    = cold('--a', values)
      .pipe(
        take(1),
        mergeMap(() => p.execute(
          () => cold('--#', values, error),
        )),
      );

    return [ p, sub$, error ];
  },
  ['--exec(--a)-----exec(--b)']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
  ] => {
    const p = new Process();
    const sub$
    = cold('--a', values)
      .pipe(
        take(1),
        mergeMap(() => p.execute(
          () => cold('--a', values),
        )),
      );

    const sub$1
    = cold('-----a', values)
      .pipe(
        take(1),
        mergeMap(() => p.execute(
          () => cold('--b', values),
        )),
      );

    return [ p, sub$, sub$1 ];
  },
  ['--exec(----a)----exec(--b)']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
  ] => {
    const p = new Process();
    const sub$
    = cold('--a', values)
      .pipe(
        take(1),
        mergeMap(() => p.execute(
          () => cold('----a', values),
        )),
      );

    const sub$1
    = cold('----a', values)
      .pipe(
        take(1),
        mergeMap(() => p.execute(
          () => cold('--b', values),
        )),
      );

    return [ p, sub$, sub$1 ];
  },
  ['--exec(--#)-----exec(--b)']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
    const p = new Process();
    const error = new TestError('Test error');
    const sub$
    = cold('--a', values)
      .pipe(
        take(1),
        mergeMap(() => p.execute(
          () => cold('--#', values, error),
        )),
      );

    const sub$1
    = cold('-----a', values)
      .pipe(
        take(1),
        mergeMap(() => p.execute(
          () => cold('--b', values),
        )),
      );

    return [ p, sub$, sub$1, error ];
  },
  ['--exec(----#)----exec(--b)']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
    const p = new Process();
    const error = new TestError('Test error');
    const sub$
    = cold('--a', values)
      .pipe(
        take(1),
        mergeMap(() => p.execute(
          () => cold('----#', values, error),
        )),
      );

    const sub$1
    = cold('----a', values)
      .pipe(
        take(1),
        mergeMap(() => p.execute(
          () => cold('--b', values),
        )),
      );

    return [ p, sub$, sub$1, error ];
  },
  ['--exec(--a)-----exec(--#)']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
    const p = new Process();
    const error = new TestError('Test error');
    const sub$
    = cold('--a', values)
      .pipe(
        take(1),
        mergeMap(() => p.execute(
          () => cold('--a', values, error),
        )),
      );

    const sub$1
    = cold('-----a', values)
      .pipe(
        take(1),
        mergeMap(() => p.execute(
          () => cold('--#', values, error),
        )),
      );

    return [ p, sub$, sub$1, error ];
  },
  ['--exec(----a)----exec(--#)']: (cold: ColdCreator): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
    const p = new Process();
    const error = new TestError('Test error');
    const sub$
    = cold('--a', values)
      .pipe(
        take(1),
        mergeMap(() => p.execute(
          () => cold('----a', values, error),
        )),
      );

    const sub$1
    = cold('----a', values)
      .pipe(
        take(1),
        mergeMap(() => p.execute(
          () => cold('--#', values, error),
        )),
      );

    return [ p, sub$, sub$1, error ];
  },
};

describe('Process', () => {

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

  describe('smoke', () => {
    it('should not smoke', () => {
      const p = new Process();
      expect(p).to.be.ok;
    });
  });

  describe('usage', () => {
    it('--a', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$ ] = scenarios['--a'](cold);

        expectObservable(sub$).toBe('--(a|)', values);
        expectObservable(p.inProgress$).toBe('(ft)-f', values);
        expectObservable(p.success$).toBe('--a', values);
        expectObservable(p.error$).toBe('n-n', values);
      });
    });
    it('--exec(--a)', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$ ] = scenarios['--exec(--a)'](cold);

        expectObservable(sub$).toBe('----(a|)', values);
        expectObservable(p.inProgress$).toBe('f-t-f', values);
        expectObservable(p.success$).toBe('----a', values);
        expectObservable(p.error$).toBe('--n-n', values);
      });
    });
    it('--#', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$, error ] = scenarios['--#'](cold);

        expectObservable(sub$).toBe('--#', values, error);
        expectObservable(p.inProgress$).toBe('(ft)-f', values);
        expectObservable(p.success$).toBe('---', values);
        expectObservable(p.error$)
          .toBe('n-e', { ...values, e: error });
      });
    });
    it('--exec(--#)', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$, error ]
         = scenarios['--exec(--#)'](cold);

        expectObservable(sub$).toBe('----#', values, error);
        expectObservable(p.inProgress$).toBe('f-t-f', values);
        expectObservable(p.success$).toBe('-----', values);
        expectObservable(p.error$)
          .toBe('--n-e', { ...values, e: error });
      });
    });
    it('sync((--a)(--b))', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$, sub1$ ]
         = scenarios['sync((--a)(--b))'](cold);

        expectObservable(sub$).toBe('--(a|)', values);
        expectObservable(sub1$).toBe('----(b|)', values);
        expectObservable(p.inProgress$)
          .toBe('(ft)-(ft)-f', values);
        expectObservable(p.success$).toBe('--a-b', values);
        expectObservable(p.error$).toBe('n-(nn)-n', values);
      });
    });
    it('sync((--#)(--b))', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$, sub1$, error ]
         = scenarios['sync((--#)(--b))'](cold);

        expectObservable(sub$).toBe('--#', values, error);
        expectObservable(sub1$).toBe('----(b|)', values);
        expectObservable(p.inProgress$)
          .toBe('(ft)-(ft)-f', values);
        expectObservable(p.success$).toBe('----b', values);
        expectObservable(p.error$)
          .toBe('n-(en)-n', { ...values, e: error });
      });
    });
    it('sync((--a)(--#))', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$, sub1$, error ]
         = scenarios['sync((--a)(--#))'](cold);

        expectObservable(sub$).toBe('--(a|)', values, error);
        expectObservable(sub1$).toBe('----#', values, error);
        expectObservable(p.inProgress$)
          .toBe('(ft)-(ft)-f', values);
        expectObservable(p.success$).toBe('--a--', values);
        expectObservable(p.error$)
          .toBe('n-(nn)-e', { ...values, e: error });
      });
    });
    it('sync((-a)(--b))', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$, sub1$ ]
         = scenarios['sync((-a)(--b))'](cold);

        expectObservable(sub$).toBe('-(a|)', values);
        expectObservable(sub1$).toBe('---(b|)', values);
        expectObservable(p.inProgress$)
          .toBe('(ft)(ft)-f', values);
        expectObservable(p.success$).toBe('-a-b', values);
        expectObservable(p.error$)
          .toBe('n(nn)-n', values);
      });
    });
    it('sync((-#)(--b))', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$, sub1$, error ]
         = scenarios['sync((-#)(--b))'](cold);

        expectObservable(sub$).toBe('-#', values, error);
        expectObservable(sub1$).toBe('---(b|)', values);
        expectObservable(p.inProgress$)
          .toBe('(ft)(ft)-f', values);
        expectObservable(p.success$).toBe('---b', values);
        expectObservable(p.error$)
          .toBe('n(en)-n', { ...values, e: error });
      });
    });
    /**
     * For the next two
     * - the observables should finish in the order the execute was
     * called, not in the order the loading function resolves
     */
    it('sync((--a)(-b))', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$, sub1$ ]
         = scenarios['sync((--a)(-b))'](cold);

        expectObservable(sub$).toBe('--(a|)', values);
        expectObservable(sub1$).toBe('---(b|)', values);
        expectObservable(p.inProgress$)
          .toBe('(ft)-(ft)f', values);
        expectObservable(p.success$).toBe('--ab', values);
        expectObservable(p.error$)
          .toBe('n-(nn)n', values);
      });
    });
    it('sync((--#)(-b))', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$, sub1$, error ]
         = scenarios['sync((--#)(-b))'](cold);

        expectObservable(sub$).toBe('--#', values, error);
        expectObservable(sub1$).toBe('---(b|)', values);
        expectObservable(p.inProgress$)
          .toBe('(ft)-(ft)f', values);
        expectObservable(p.success$).toBe('---b', values);
        expectObservable(p.error$)
          .toBe('n-(en)n', { ...values, e: error });
      });
    });
    /**
     * This below is the most normal behavior
     * After the page loads - a user clicks something
     * After the effect of that click has happened
     * the user clicks something again
     */
    it('--exec(--a)-----exec(--b)', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$, sub1$ ]
         = scenarios['--exec(--a)-----exec(--b)'](cold);

        expectObservable(sub$).toBe('----(a|)', values);
        expectObservable(sub1$).toBe('-------(b|)', values);
        expectObservable(p.inProgress$)
          .toBe('f-t-ft-f', values);
        expectObservable(p.success$).toBe('----a--b', values);
        expectObservable(p.error$).toBe('--n-nn-n', values);
      });
    });
    /**
     * This time the user clicks something
     * before the effect of the first click is resolved.
     * Still the first click should be resolved first
     */
    it('--exec(----a)----exec(--b)', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$, sub1$ ]
         = scenarios['--exec(----a)----exec(--b)'](cold);

        expectObservable(sub$).toBe('------(a|)', values);
        expectObservable(sub1$).toBe('--------(b|)', values);
        expectObservable(p.inProgress$)
          .toBe('f-t---(ft)-f', values);
        expectObservable(p.success$).toBe('------a-b', values);
        expectObservable(p.error$).toBe('--n---(nn)-n', values);
      });
    });
    /**
     * Error variants off the above
     */
    it('--exec(--#)-----exec(--b)', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$, sub1$, error ]
         = scenarios['--exec(--#)-----exec(--b)'](cold);

        expectObservable(sub$).toBe('----#', values, error);
        expectObservable(sub1$).toBe('-------(b|)', values);
        expectObservable(p.inProgress$)
          .toBe('f-t-ft-f', values);
        expectObservable(p.success$).toBe('-------b', values);
        expectObservable(p.error$)
          .toBe('--n-en-n', { ...values, e: error });
      });
    });
    /**
     * Error variants off the above
     */
    it('--exec(----#)----exec(--b)', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$, sub1$, error ]
         = scenarios['--exec(----#)----exec(--b)'](cold);

        expectObservable(sub$).toBe('------#', values, error);
        expectObservable(sub1$).toBe('--------(b|)', values);
        expectObservable(p.inProgress$)
          .toBe('f-t---(ft)-f', values);
        expectObservable(p.success$).toBe('--------b', values);
        expectObservable(p.error$)
          .toBe('--n---(en)-n', { ...values, e: error });
      });
    });
    /**
     * Error variants off the above
     */
    it('--exec(--a)-----exec(--#)', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$, sub1$, error ]
         = scenarios['--exec(--a)-----exec(--#)'](cold);

        expectObservable(sub$).toBe('----(a|)', values, error);
        expectObservable(sub1$).toBe('-------#', values, error);
        expectObservable(p.inProgress$)
          .toBe('f-t-ft-f', values);
        expectObservable(p.success$).toBe('----a---', values);
        expectObservable(p.error$)
          .toBe('--n-nn-e', { ...values, e: error });
      });
    });
    /**
     * Error variants off the above
     */
    it('--exec(----a)----exec(--#)', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const [ p, sub$, sub1$, error ]
         = scenarios['--exec(----a)----exec(--#)'](cold);

        expectObservable(sub$).toBe('------(a|)', values, error);
        expectObservable(sub1$).toBe('--------#', values, error);
        expectObservable(p.inProgress$)
          .toBe('f-t---(ft)-f', values);
        expectObservable(p.success$).toBe('------a--', values);
        expectObservable(p.error$)
          .toBe('--n---(nn)-e', { ...values, e: error });
      });
    });
  });
});
