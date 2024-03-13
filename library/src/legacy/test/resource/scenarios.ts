/* eslint-disable @typescript-eslint/no-empty-function */
import { TestScheduler } from 'rxjs/testing';
import { Observable, shareReplay, tap } from 'rxjs';
import { GLOBAL, TestError, after, ignoreErrorSub } from '../test.helpers';
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable';
import { Resource, ResourceOptions } from '../../src';
import { HotObservable } from 'rxjs/internal/testing/HotObservable';
import { expect } from 'chai';

export const test_values = {
  t: true, f: false, a: 'a', b: 'b', c: 'c', d: 'd', n: null, v: 'v' };


type ColdCreator = <T = string>(marbles: string, values?: {
    [marble: string]: T;
} | undefined, error?: unknown) => ColdObservable<T>;

type HotCreator = <T = string>(marbles: string, values?: {
    [marble: string]: T;
} | undefined, error?: unknown) => HotObservable<T>;

const fakeFn = (
  cold: ColdCreator,
  patterns: string[],
  error: TestError,
) => {
  const stack = [ ...patterns ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (args: string) => {
    return cold(
        stack.shift() as string,
        test_values,
        error,
    ) as Observable<string>;
  };
};

export const scenarios = {
  ['trigg(--t{--a})']: {
    scenario (
      resourceOptions: ResourceOptions,
      cold: ColdCreator,
    ): [ Resource<string, string>, TestError] {
      const error = new TestError('test error');
      const resource
         = new Resource(
          cold('--t', test_values) as Observable<string>,
          fakeFn(cold, ['--a'], error),
          resourceOptions,
         );

      return [ resource, error ];
    },
    behavior: {
      common: (
        resourceOptions: ResourceOptions,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ resource ]
            = scenarios['trigg(--t{--a})']
              .scenario(resourceOptions, cold);

          expectObservable(resource.data$)
            .toBe('----a', test_values);
          expectObservable(resource.inProgress$)
            .toBe('f-t-f', test_values);
          expectObservable(resource.error$)
            .toBe('--n-n', test_values);

        });
      },
    },
  },
  ['trigg(--t{--#})']: {
    scenario (
      resourceOptions: ResourceOptions,
      cold: ColdCreator,
    ): [ Resource<string, string>, TestError] {
      const error = new TestError('test error');
      const resource
         = new Resource(
          cold('--t', test_values) as Observable<string>,
          fakeFn(cold, ['--#'], error),
          resourceOptions,
         );

      return [ resource, error ];
    },
    behavior: {
      common: (
        resourceOptions: ResourceOptions,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ resource, error ]
            = scenarios['trigg(--t{--#})']
              .scenario(resourceOptions, cold);

          expectObservable(resource.data$)
            .toBe('-----', test_values);
          expectObservable(resource.inProgress$)
            .toBe('f-t-f', test_values);
          expectObservable(resource.error$)
            .toBe('--n-e', { ...test_values, e: error });

        });
      },
    },
  },
  ['trigg(-t---t{-a})']: {
    scenario (
      resourceOptions: ResourceOptions,
      cold: ColdCreator,
    ): [ Resource<string, string>, TestError] {
      const error = new TestError('test error');
      const resource
         = new Resource(
          cold('-t---t', test_values) as Observable<string>,
          fakeFn(cold, ['-a', '-a'], error),
          resourceOptions,
         );

      return [ resource, error ];
    },
    behavior: {
      common: (
        resourceOptions: ResourceOptions,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ resource ]
            = scenarios['trigg(-t---t{-a})']
              .scenario(resourceOptions, cold);

          expectObservable(resource.data$)
            .toBe('--a---a', test_values);
          expectObservable(resource.inProgress$)
            .toBe('ftf--tf', test_values);
          expectObservable(resource.error$)
            .toBe('-nn--nn', test_values);
        });
      },
    },
  },
  ['trigg(-t---t{-#})']: {
    scenario (
      resourceOptions: ResourceOptions,
      cold: ColdCreator,
    ): [ Resource<string, string>, TestError] {
      const error = new TestError('test error');
      const resource
         = new Resource(
          cold('-t---t', test_values, error) as Observable<string>,
          fakeFn(cold, ['-#', '-#'], error),
          resourceOptions,
         );

      return [ resource, error ];
    },
    behavior: {
      common: (
        resourceOptions: ResourceOptions,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ resource, error ]
            = scenarios['trigg(-t---t{-#})']
              .scenario(resourceOptions, cold);

          expectObservable(resource.data$)
            .toBe('-------', test_values, error);
          expectObservable(resource.inProgress$)
            .toBe('ftf--tf', test_values);
          expectObservable(resource.error$)
            .toBe('-ne--ne', { ...test_values, e: error });
        });
      },
    },
  },
  ['trigg(-t---t{(-#)(-a)})']: {
    scenario (
      resourceOptions: ResourceOptions,
      cold: ColdCreator,
    ): [ Resource<string, string>, TestError] {
      const error = new TestError('test error');
      const resource
         = new Resource(
          cold('-t---t', test_values, error) as Observable<string>,
          fakeFn(cold, ['-#', '-a'], error),
          resourceOptions,
         );

      return [ resource, error ];
    },
    behavior: {
      common: (
        resourceOptions: ResourceOptions,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ resource, error ]
            = scenarios['trigg(-t---t{(-#)(-a)})']
              .scenario(resourceOptions, cold);

          expectObservable(resource.data$)
            .toBe('------a', test_values, error);
          expectObservable(resource.inProgress$)
            .toBe('ftf--tf', test_values);
          expectObservable(resource.error$)
            .toBe('-ne--nn', { ...test_values, e: error });
        });
      },
    },
  },
  ['trigg(-t-t{(---a)(-b)})']: {
    scenario (
      resourceOptions: ResourceOptions,
      cold: ColdCreator,
    ): [ Resource<string, string>, TestError] {
      /**
       * The second resource gets resolved in same
       * frame as the first one
       */
      const error = new TestError('test error');
      const resource
         = new Resource(
          cold('-t-t', test_values, error) as Observable<string>,
          fakeFn(cold, ['---a', '-b'], error),
          resourceOptions,
         );

      return [ resource, error ];
    },
    behavior: {
      common: (
        resourceOptions: ResourceOptions,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ resource, error ]
            = scenarios['trigg(-t-t{(---a)(-b)})']
              .scenario(resourceOptions, cold);

          expectObservable(resource.data$)
            .toBe('----ab', test_values, error);
          expectObservable(resource.inProgress$)
            .toBe('ft--(ft)f', test_values);
          expectObservable(resource.error$)
            .toBe('-n--(nn)n', { ...test_values, e: error });
        });
      },
      concurrent: (
        resourceOptions: ResourceOptions,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ resource, error ]
            = scenarios['trigg(-t-t{(---a)(-b)})']
              .scenario(resourceOptions, cold);

          expectObservable(resource.data$)
            .toBe('----(ab)', test_values, error);
          expectObservable(resource.inProgress$)
            .toBe('ft--f', test_values);
          expectObservable(resource.error$)
            .toBe('-n-n(nn)', { ...test_values, e: error });
        });
      },
      switch: (
        resourceOptions: ResourceOptions,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ resource, error ]
            = scenarios['trigg(-t-t{(---a)(-b)})']
              .scenario(resourceOptions, cold);

          expectObservable(resource.data$)
            .toBe('----b', test_values, error);
          expectObservable(resource.inProgress$)
            .toBe('ft--f', test_values);
          expectObservable(resource.error$)
            .toBe('-n-nn', { ...test_values, e: error });
        });
      },
    },
  },
  ['trigg(-t-t{(-----a)(-b)})']: {
    scenario (
      resourceOptions: ResourceOptions,
      cold: ColdCreator,
    ): [ Resource<string, string>, TestError] {
      /**
       * The second resource gets resolved sooner
       * than the first one
       */
      const error = new TestError('test error');
      const resource
         = new Resource(
          cold('-t-t', test_values, error) as Observable<string>,
          fakeFn(cold, ['-----a', '-b'], error),
          resourceOptions,
         );

      return [ resource, error ];
    },
    behavior: {
      common: (
        resourceOptions: ResourceOptions,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ resource, error ]
            = scenarios['trigg(-t-t{(-----a)(-b)})']
              .scenario(resourceOptions, cold);

          expectObservable(resource.data$)
            .toBe('------ab', test_values, error);
          expectObservable(resource.inProgress$)
            .toBe('ft----(ft)f', test_values);
          expectObservable(resource.error$)
            .toBe('-n----(nn)n', { ...test_values, e: error });
        });
      },
      concurrent: (
        resourceOptions: ResourceOptions,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ resource, error ]
            = scenarios['trigg(-t-t{(-----a)(-b)})']
              .scenario(resourceOptions, cold);

          expectObservable(resource.data$)
            .toBe('----b-a', test_values, error);
          expectObservable(resource.inProgress$)
            .toBe('ft----f', test_values);
          expectObservable(resource.error$)
            .toBe('-n-nn-n', { ...test_values, e: error });
        });
      },
      switch: (
        resourceOptions: ResourceOptions,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable }) => {
          const [ resource, error ]
            = scenarios['trigg(-t-t{(-----a)(-b)})']
              .scenario(resourceOptions, cold);

          expectObservable(resource.data$)
            .toBe('----b', test_values, error);
          expectObservable(resource.inProgress$)
            .toBe('ft--f', test_values);
          expectObservable(resource.error$)
            .toBe('-n-nn', { ...test_values, e: error });
        });
      },
    },
  },
  ['shareReplay - late to party folks - data$']: {
    scenario (
      resourceOptions: ResourceOptions,
      cold: ColdCreator,
      hot: HotCreator,
    ): [ Resource<string, string>, TestError] {
      const error = new TestError('test error');

      const orig$ = (cold(
        '---t---t---t---t---t',
        test_values, error) as Observable<string>)
        .pipe(shareReplay(1));

      orig$.subscribe();

      const resource
         = new Resource(
           orig$,
           fakeFn(cold, ['-a', '-b', '-#', '-d', '-a'], error),
           resourceOptions,
         );

      return [ resource, error ];
    },
    behavior: {
      common: (
        resourceOptions: ResourceOptions,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable, hot }) => {
          const [ resource, error ]
            = scenarios['shareReplay - late to party folks - data$']
              .scenario(resourceOptions, cold, hot);

          after(cold('-------t', test_values), () => {
            expectObservable(resource.data$)
              .toBe('--------a---b-------d', test_values, error);
          });
          after(cold('---------------t', test_values), () => {
            expectObservable(resource.data$)
              .toBe('---------------b----d', test_values, error);
          });
        });
      },
    },
  },
  ['shareReplay - late to party folks - error$']: {
    scenario (
      resourceOptions: ResourceOptions,
      cold: ColdCreator,
      hot: HotCreator,
    ): [ Resource<string, string>, TestError] {
      const error = new TestError('test error');

      const orig$ = (cold(
        '---t---t---t---t---t',
        test_values, error) as Observable<string>)
        .pipe(shareReplay(1));

      orig$.subscribe();

      const resource
         = new Resource(
           orig$,
           fakeFn(cold, ['-#', '-#', '-#', '-#', '-#'], error),
           resourceOptions,
         );

      return [ resource, error ];
    },
    behavior: {
      common: (
        resourceOptions: ResourceOptions,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable, hot }) => {
          const [ resource, error ]
            = scenarios['shareReplay - late to party folks - error$']
              .scenario(resourceOptions, cold, hot);

          resource.data$.subscribe(ignoreErrorSub);
          after(cold('-------t', test_values), () => {
            expectObservable(resource.error$)
              .toBe('-------ne--ne--ne--ne',
                { ...test_values, e: error });
          });
          after(cold('-------------t', test_values), () => {
            expectObservable(resource.error$)
              .toBe('-------------e-ne--ne',
                { ...test_values, e: error });
          });
        });
      },
    },
  },
  ['memoryLeak']: {
    scenario (
      resourceOptions: ResourceOptions,
      cold: ColdCreator,
      hot: HotCreator,
    ): [ Resource<string, string>, TestError] {
      const error = new TestError('test error');

      const orig$ = (cold(
        '---t---t---t---t---t',
        test_values, error) as Observable<string>)
        .pipe(
          tap(() => { GLOBAL.sideEffect0Count++; }),
        );

      const resource
         = new Resource(
           orig$,
           fakeFn(cold, ['-a', '-a', '-a', '-a', '-a'], error),
           resourceOptions,
         );

      return [ resource, error ];
    },
    behavior: {
      common: (
        resourceOptions: ResourceOptions,
        scheduler: TestScheduler,
      ): void => {
        scheduler.run(({ cold, expectObservable, hot }) => {
          const [ resource, error ]
            = scenarios['memoryLeak']
              .scenario(resourceOptions, cold, hot);

          const sub$ = resource.data$
            .subscribe(ignoreErrorSub);
          after(
            cold('------t', test_values), () => {
              sub$.unsubscribe();
            });
        });
        expect(GLOBAL.sideEffect0Count)
          .to.equal(1);
      },
    },
  },
};

