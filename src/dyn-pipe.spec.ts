import { map, mergeMap, Observable, of, switchMap } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { expect } from 'chai';
import { DynPipe } from './dyn-pipe';

interface TResource {
    id: number,
    text: string,
}

interface TLoadArgs {
    textContains: string,
}

const tLoadFunction = (args: TLoadArgs): Observable<TResource[]> => of([{ id: 0, text: 'text0' }, { id: 1, text: 'text1' }]);

const dict = {
  a: 'a',
  b: 'b',
  c: 'c',
  d: 'd',
  e: 'e',
  f: 'f',
  g: 'g',
  h: 'h',
};

describe('DynPipeObservable', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      // console.log(expected);
      // console.log(actual);
      // console.log('E', drawMarbleFromDefs(expected));
      // console.log('A', drawMarbleFromDefs(actual));
      try {
        expect(actual).to.eql(expected);
      } catch (error) {
        throw Error(`
        E: ${drawMarbleFromDefs(expected)}
        A: ${drawMarbleFromDefs(actual)}
        `);
      }
    });
  });

  // afterEach(() => scheduler.flush());

  it('should let the observable through when pipe is empty', () => {
    scheduler.run(({ cold, expectObservable }) => {

      const dynPipe = new DynPipe([]);
      const result$ = cold('a', { a: 'test' })
        .pipe(dynPipe.pipe());
      expectObservable(result$).toBe('a', { a: 'test' });
    });
  });

  it('should apply one pipe', () => {
    scheduler.run(({ cold, expectObservable }) => {

      const dynPipe = new DynPipe([ map(v => v + '-test') ]);
      const result$ = cold('a', { a: 'test' })
        .pipe(dynPipe.pipe());

      expectObservable(result$).toBe('a', { a: 'test-test' });
    });
  });

  it('should apply two pipes', () => {
    scheduler.run(({ cold, expectObservable }) => {

      const dynPipe = new DynPipe([ 
        map(v => v + '-test'),
        map(v => v + '-test'),
      ]);
      const result$ = cold('a', { a: 'test' })
        .pipe(dynPipe.pipe());

      expectObservable(result$).toBe('a', { a: 'test-test-test' });
    });
  });

  describe('mergeMap', () => {
    it('normal merge map', () => {
      scheduler.run(({ cold, expectObservable }) => {
  
        const source$ = cold('a--a--a', { a: 'a', b: 'b', c: 'c' });
        const merge$ = cold('a', { a: '1', b: '2', c: '3' });
        const result$ = source$
          .pipe(mergeMap(() =>merge$));
  
        expectObservable(result$).toBe('a--a--a', { a: '1' });
      });
    });
  });

  describe('switchMap', () => {
    it('normal switch map', () => {
      scheduler.run(({ cold, expectObservable }) => {
  
        const source$ = cold('a--a--a', { a: 'a', b: 'b', c: 'c' });
        const switch$ = cold('a', { a: '1', b: '2', c: '3' });
        const result$ = source$
          .pipe(switchMap(() =>switch$));
  
        expectObservable(result$).toBe('a--a--a', { a: '1' });
      });
    });

    it('dynPipe switch map', () => {
      scheduler.run(({ cold, expectObservable }) => {
  
        const source$ = cold('a--a--a', { a: 'a', b: 'b', c: 'c' });
        const switch$ = cold('a', { a: '1', b: '2', c: '3' });
        const result$ = source$
          .pipe(new DynPipe([ switchMap(() =>switch$) ]).pipe());
  
        expectObservable(result$).toBe('a--a--a', { a: '1' });
      });
    });
  
    it('delayed normal switch map', () => {
      scheduler.run(({ cold, expectObservable }) => {
  
        const source$ = cold('a--a--a', dict);
        const switch$ = cold('---b', dict);
        const result$ = source$
          .pipe(switchMap(() =>switch$));
  
        expectObservable(result$).toBe('---------b', dict);
      });
    });

    it('delayed dynPipe switch map', () => {
      scheduler.run(({ cold, expectObservable }) => {
  
        const source$ = cold('a--a--a', dict);
        const switch$ = cold('---b', dict);
        const result$ = source$
          .pipe(new DynPipe([ switchMap(() =>switch$) ]).pipe());
  
        expectObservable(result$).toBe('---------b', dict);
      });
    });
  });

});

function log(sourceName: string) {
  return function<T>(source: Observable<T>): Observable<T> {
    return new Observable(subscriber => {
      source.subscribe({
        next(value) {
          console.log(sourceName, value);
          subscriber.next(value);
        },
        error(error) {
          subscriber.error(error);
        },
        complete() {
          subscriber.complete();
        },
      });
    });
  };
}

function drawMarbleFromDefs (def: any) {
  let expectedMarble = '';
  let expectedFrame = 0;
  def.forEach((ev: any) => {
    if (ev.frame === expectedFrame) {
      // do nothing
    } else {
      if (ev.frame > expectedFrame) Array.from(new Array(ev.frame - expectedFrame)).forEach(tick => expectedMarble += '-');
    }
    expectedFrame = ev.frame;

    expectedMarble += ev.notification.value;
  });
  return expectedMarble;
}