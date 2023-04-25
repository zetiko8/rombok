/* eslint-disable @typescript-eslint/no-empty-function */
import { Process } from '..';
import { mergeMap, take } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { Observable } from 'rxjs';
import { TestError } from '../../test.helpers';
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { log } from '../../utils';

const values = {
  t: true, f: false, a: 'a', b: 'b', n: null, v: 'v' };

type ColdCreator = <T = string>(marbles: string, values?: {
  [marble: string]: T;
} | undefined, error?: any) => ColdObservable<T>;

export const scenarios = {
  ['--a']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>
  ] => {
      const p = createProcess();
      const sub$ = p.execute(
        () => cold('--a', values),
      );

      return [ p, sub$ ];
    },
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$ ] = scenarios['--a']
            .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--(a|)', values);
          expectObservable(p.inProgress$).toBe('(ft)-f', values);
          expectObservable(p.success$).toBe('--a', values);
          expectObservable(p.error$).toBe('n-n', values);
        });
      },
    },
  },
  ['--exec(--a)']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>
  ] => {
      const p = createProcess();
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
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$ ] = scenarios['--exec(--a)']
            .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('----(a|)', values);
          expectObservable(p.inProgress$).toBe('f-t-f', values);
          expectObservable(p.success$).toBe('----a', values);
          expectObservable(p.error$).toBe('--n-n', values);
        });
      },
    },
  },
  ['--#']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
      const p = createProcess();
      const error = new TestError('Test error');
      const sub$ = p.execute(
        () => cold('--#', values, error),
      );

      return [ p, sub$, error ];
    },
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, error ] = scenarios['--#']
            .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--#', values, error);
          expectObservable(p.inProgress$).toBe('(ft)-f', values);
          expectObservable(p.success$).toBe('---', values);
          expectObservable(p.error$)
            .toBe('n-e', { ...values, e: error });
        });
      },
    },
  },
  ['--exec(--#)']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
      const p = createProcess();
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
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, error ]
                   = scenarios['--exec(--#)']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('----#', values, error);
          expectObservable(p.inProgress$).toBe('f-t-f', values);
          expectObservable(p.success$).toBe('-----', values);
          expectObservable(p.error$)
            .toBe('--n-e', { ...values, e: error });
        });
      },
    },
  },
  ['sync((--a)(--b))']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
  ] => {
      const p = createProcess();
      const sub$ = p.execute(
        () => cold('--a', values),
      );
      const sub$1 = p.execute(
        () => cold('--b', values),
      );
      return [ p, sub$, sub$1 ];
    },
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$ ]
                   = scenarios['sync((--a)(--b))']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--(a|)', values);
          expectObservable(sub1$)
            .toBe('----(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('(ft)-(ft)-f', values);
          expectObservable(p.success$).toBe('--a-b', values);
          expectObservable(p.error$).toBe('n-(nn)-n', values);
        });
      },
      concurrent: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$ ]
                   = scenarios['sync((--a)(--b))']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--(a|)', values);
          expectObservable(sub1$)
            .toBe('--(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('(ft)-f', values);
          expectObservable(p.success$).toBe('--(ab)', values);
          expectObservable(p.error$).toBe('(nn)-(nn)', values);
        });
      },
    },
  },
  ['sync((--#)(--b))']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
      const p = createProcess();
      const error = new TestError('Test error');
      const sub$ = p.execute(
        () => cold('--#', values, error),
      );
      const sub$1 = p.execute(
        () => cold('--b', values, error),
      );

      return [ p, sub$, sub$1, error ];
    },
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['sync((--#)(--b))']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--#', values, error);
          expectObservable(sub1$)
            .toBe('----(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('(ft)-(ft)-f', values);
          expectObservable(p.success$).toBe('----b', values);
          expectObservable(p.error$)
            .toBe('n-(en)-n', { ...values, e: error });
        });
      },
      concurrent: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['sync((--#)(--b))']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--#', values, error);
          expectObservable(sub1$)
            .toBe('--(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('(ft)-f', values);
          expectObservable(p.success$).toBe('--b', values);
          expectObservable(p.error$)
            .toBe('(nn)-(en)', { ...values, e: error });
        });
      },
    },
  },
  ['sync((--a)(--#))']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
      const p = createProcess();
      const error = new TestError('Test error');
      const sub$ = p.execute(
        () => cold('--a', values, error),
      );
      const sub$1 = p.execute(
        () => cold('--#', values, error),
      );

      return [ p, sub$, sub$1, error ];
    },
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['sync((--a)(--#))']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--(a|)', values, error);
          expectObservable(sub1$)
            .toBe('----#', values, error);
          expectObservable(p.inProgress$)
            .toBe('(ft)-(ft)-f', values);
          expectObservable(p.success$).toBe('--a--', values);
          expectObservable(p.error$)
            .toBe('n-(nn)-e', { ...values, e: error });
        });
      },
      concurrent: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['sync((--a)(--#))']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--(a|)', values, error);
          expectObservable(sub1$)
            .toBe('--#', values, error);
          expectObservable(p.inProgress$)
            .toBe('(ft)-f', values);
          expectObservable(p.success$).toBe('--a', values);
          expectObservable(p.error$)
            .toBe('(nn)-(ne)', { ...values, e: error });
        });
      },
    },
  },
  ['sync((-a)(--b))']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
  ] => {
      const p = createProcess();
      const sub$ = p.execute(
        () => cold('-a', values),
      );
      const sub$1 = p.execute(
        () => cold('--b', values),
      );
      return [ p, sub$, sub$1 ];
    },
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$ ]
                   = scenarios['sync((-a)(--b))']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('-(a|)', values);
          expectObservable(sub1$)
            .toBe('---(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('(ft)(ft)-f', values);
          expectObservable(p.success$).toBe('-a-b', values);
          expectObservable(p.error$)
            .toBe('n(nn)-n', values);
        });
      },
      concurrent: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$ ]
                   = scenarios['sync((-a)(--b))']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('-(a|)', values);
          expectObservable(sub1$)
            .toBe('--(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('(ft)-f', values);
          expectObservable(p.success$).toBe('-ab', values);
          expectObservable(p.error$)
            .toBe('(nn)nn', values);
        });
      },
    },
  },
  ['sync((-#)(--b))']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
      const p = createProcess();
      const error = new TestError('Test error');
      const sub$ = p.execute(
        () => cold('-#', values, error),
      );
      const sub$1 = p.execute(
        () => cold('--b', values, error),
      );

      return [ p, sub$, sub$1, error ];
    },
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['sync((-#)(--b))']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('-#', values, error);
          expectObservable(sub1$)
            .toBe('---(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('(ft)(ft)-f', values);
          expectObservable(p.success$).toBe('---b', values);
          expectObservable(p.error$)
            .toBe('n(en)-n', { ...values, e: error });
        });
      },
      concurrent: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['sync((-#)(--b))']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('-#', values, error);
          expectObservable(sub1$)
            .toBe('--(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('(ft)-f', values);
          expectObservable(p.success$).toBe('--b', values);
          expectObservable(p.error$)
            .toBe('(nn)en', { ...values, e: error });
        });
      },
    },
  },
  ['sync((--a)(-b))']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
  ] => {
      const p = createProcess();
      const sub$ = p.execute(
        () => cold('--a', values),
      );
      const sub$1 = p.execute(
        () => cold('-b', values),
      );
      return [ p, sub$, sub$1 ];
    },
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$ ]
                   = scenarios['sync((--a)(-b))']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--(a|)', values);
          expectObservable(sub1$)
            .toBe('---(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('(ft)-(ft)f', values);
          expectObservable(p.success$).toBe('--ab', values);
          expectObservable(p.error$)
            .toBe('n-(nn)n', values);
        });
      },
      concurrent: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$ ]
                   = scenarios['sync((--a)(-b))']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--(a|)', values);
          expectObservable(sub1$)
            .toBe('-(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('(ft)-f', values);
          expectObservable(p.success$).toBe('-ba', values);
          expectObservable(p.error$)
            .toBe('(nn)nn', values);
        });
      },
    },
  },
  ['sync((--#)(-b))']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
      const p = createProcess();
      const error = new TestError('Test error');
      const sub$ = p.execute(
        () => cold('--#', values, error),
      );
      const sub$1 = p.execute(
        () => cold('-b', values, error),
      );

      return [ p, sub$, sub$1, error ];
    },
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['sync((--#)(-b))']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--#', values, error);
          expectObservable(sub1$)
            .toBe('---(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('(ft)-(ft)f', values);
          expectObservable(p.success$).toBe('---b', values);
          expectObservable(p.error$)
            .toBe('n-(en)n', { ...values, e: error });
        });
      },
      concurrent: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['sync((--#)(-b))']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--#', values, error);
          expectObservable(sub1$)
            .toBe('-(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('(ft)-f', values);
          expectObservable(p.success$).toBe('-b', values);
          expectObservable(p.error$)
            .toBe('(nn)ne', { ...values, e: error });
        });
      },
    },
  },
  ['--exec(--a)-----exec(--b)']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
  ] => {
    /**
     * The most normal case
     * The user click something,
     * After the result is resolved
     * the user clicks something else.
     */
      const p = createProcess();
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
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$ ]
                   = scenarios['--exec(--a)-----exec(--b)']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('----(a|)', values);
          expectObservable(sub1$)
            .toBe('-------(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('f-t-ft-f', values);
          expectObservable(p.success$).toBe('----a--b', values);
          expectObservable(p.error$).toBe('--n-nn-n', values);
        });
      },
    },
  },
  ['--exec(----a)----exec(--b)']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
  ] => {
    /**
     * The user click something,
     * before the result is resolved
     * the user clicks something else.
     * Both requests resolve at the same time
     */
      const p = createProcess();
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
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$ ]
                   = scenarios['--exec(----a)----exec(--b)']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('------(a|)', values);
          expectObservable(sub1$)
            .toBe('--------(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('f-t---(ft)-f', values);
          expectObservable(p.success$).toBe('------a-b', values);
          expectObservable(p.error$).toBe('--n---(nn)-n', values);
        });
      },
      concurrent: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$ ]
                   = scenarios['--exec(----a)----exec(--b)']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('------(a|)', values);
          expectObservable(sub1$)
            .toBe('------(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('f-t---f', values);
          expectObservable(p.success$).toBe('------(ab)', values);
          expectObservable(p.error$).toBe('--n-n-(nn)', values);
        });
      },
    },
  },
  ['--exec(------a)----exec(--b)']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
  ] => {
    /**
     * The user click something,
     * before the result is resolved
     * the user clicks something else.
     * The second click is resolved before
     * the first click
     */
      const p = createProcess();
      const sub$
    = cold('--a', values)
      .pipe(
        take(1),
        mergeMap(() => p.execute(
          () => cold('------a', values),
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
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$ ]
                   = scenarios['--exec(------a)----exec(--b)']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--------(a|)', values);
          expectObservable(sub1$)
            .toBe('----------(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('f-t-----(ft)-f', values);
          expectObservable(p.success$).toBe('--------a-b', values);
          expectObservable(p.error$).toBe('--n-----(nn)-n', values);
        });
      },
      concurrent: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$ ]
                   = scenarios['--exec(------a)----exec(--b)']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--------(a|)', values);
          expectObservable(sub1$)
            .toBe('------(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('f-t-----f', values);
          expectObservable(p.success$).toBe('------b-a', values);
          expectObservable(p.error$).toBe('--n-n-n-n', values);
        });
      },
    },
  },
  ['--exec(--#)-----exec(--b)']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
    /**
     * The most normal case - but with error
     * one the first request
     * The user click something,
     * After the result errors
     * the user clicks something else.
     */
      const p = createProcess();
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
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['--exec(--#)-----exec(--b)']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('----#', values, error);
          expectObservable(sub1$)
            .toBe('-------(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('f-t-ft-f', values);
          expectObservable(p.success$).toBe('-------b', values);
          expectObservable(p.error$)
            .toBe('--n-en-n', { ...values, e: error });
        });
      },
    },
  },
  ['--exec(----#)----exec(--b)']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
    /**
     * The user click something,
     * before the result is resolved
     * the user clicks something else.
     * Both requests resolve at the same time,
     * but the first one errors
     */
      const p = createProcess();
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
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['--exec(----#)----exec(--b)']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('------#', values, error);
          expectObservable(sub1$)
            .toBe('--------(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('f-t---(ft)-f', values);
          expectObservable(p.success$).toBe('--------b', values);
          expectObservable(p.error$)
            .toBe('--n---(en)-n', { ...values, e: error });
        });
      },
      concurrent: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['--exec(----#)----exec(--b)']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('------#', values, error);
          expectObservable(sub1$)
            .toBe('------(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('f-t---f', values);
          expectObservable(p.success$).toBe('------b', values);
          expectObservable(p.error$)
            .toBe('--n-n-(en)', { ...values, e: error });
        });
      },
    },
  },
  ['--exec(------#)----exec(--b)']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
    /**
     * The user click something,
     * before the result is resolved
     * the user clicks something else.
     * The second click is resolved before
     * the first click, and the first click errors
     */
      const p = createProcess();
      const error = new TestError('Test error');
      const sub$
    = cold('--a', values)
      .pipe(
        take(1),
        mergeMap(() => p.execute(
          () => cold('------#', values, error),
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
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['--exec(------#)----exec(--b)']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--------#', values, error);
          expectObservable(sub1$)
            .toBe('----------(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('f-t-----(ft)-f', values);
          expectObservable(p.success$).toBe('----------b', values);
          expectObservable(p.error$)
            .toBe('--n-----(en)-n', { ...values, e: error });
        });
      },
      concurrent: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['--exec(------#)----exec(--b)']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--------#', values, error);
          expectObservable(sub1$)
            .toBe('------(b|)', values);
          expectObservable(p.inProgress$)
            .toBe('f-t-----f', values);
          expectObservable(p.success$).toBe('------b', values);
          expectObservable(p.error$)
            .toBe('--n-n-n-e', { ...values, e: error });
        });
      },
    },
  },
  ['--exec(--a)-----exec(--#)']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
      /**
       * The most normal case - but with error
       * one the second request
       * The user click something,
       * After the result resolves
       * the user clicks something else,
       * and the second result errors
       */
      const p = createProcess();
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
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['--exec(--a)-----exec(--#)']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('----(a|)', values, error);
          expectObservable(sub1$)
            .toBe('-------#', values, error);
          expectObservable(p.inProgress$)
            .toBe('f-t-ft-f', values);
          expectObservable(p.success$).toBe('----a---', values);
          expectObservable(p.error$)
            .toBe('--n-nn-e', { ...values, e: error });
        });
      },
    },
  },
  ['--exec(----a)----exec(--#)']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
      /**
     * The user click something,
     * before the result is resolved
     * the user clicks something else.
     * Both requests resolve at the same time,
     * but the second one errors
     */
      const p = createProcess();
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
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['--exec(----a)----exec(--#)']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('------(a|)', values, error);
          expectObservable(sub1$)
            .toBe('--------#', values, error);
          expectObservable(p.inProgress$)
            .toBe('f-t---(ft)-f', values);
          expectObservable(p.success$).toBe('------a--', values);
          expectObservable(p.error$)
            .toBe('--n---(nn)-e', { ...values, e: error });
        });
      },
      concurrent: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['--exec(----a)----exec(--#)']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('------(a|)', values, error);
          expectObservable(sub1$)
            .toBe('------#', values, error);
          expectObservable(p.inProgress$)
            .toBe('f-t---f', values);
          expectObservable(p.success$).toBe('------a--', values);
          expectObservable(p.error$)
            .toBe('--n-n-(ne)', { ...values, e: error });
        });
      },
    },
  },
  ['--exec(------a)----exec(--#)']: {
    scenario: (
      createProcess: <T>() => Process<T>,
      cold: ColdCreator,
    ): [
    Process<unknown>,
    Observable<unknown>,
    Observable<unknown>,
    TestError,
  ] => {
    /**
     * The user click something,
     * before the result is resolved
     * the user clicks something else.
     * The second click is resolved before
     * the first click, and the second click errors
     */
      const p = createProcess();
      const error = new TestError('Test error');
      const sub$
    = cold('--a', values)
      .pipe(
        take(1),
        mergeMap(() => p.execute(
          () => cold('------a', values),
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
    behavior: {
      common: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['--exec(------a)----exec(--#)']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--------(a|)', values);
          expectObservable(sub1$)
            .toBe('----------#', values, error);
          expectObservable(p.inProgress$)
            .toBe('f-t-----(ft)-f', values);
          expectObservable(p.success$).toBe('--------a--', values);
          expectObservable(p.error$)
            .toBe('--n-----(nn)-e', { ...values, e: error });
        });
      },
      concurrent: (
        createProcess: <T>() => Process<T>,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ p, sub$, sub1$, error ]
                   = scenarios['--exec(------a)----exec(--#)']
                     .scenario(createProcess, cold);

          expectObservable(sub$)
            .toBe('--------(a|)', values);
          expectObservable(sub1$)
            .toBe('------#', values, error);
          expectObservable(p.inProgress$)
            .toBe('f-t-----f', values);
          expectObservable(p.success$).toBe('--------a--', values);
          expectObservable(p.error$)
            .toBe('--n-n-e-n', { ...values, e: error });
        });
      },
    },
  },
};

