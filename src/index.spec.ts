import { LoadableResource, LoadableRx } from '.';
import { map, mergeMap, Observable, of, Subject, switchMap } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { expect } from 'chai';

interface TResource {
    id: number,
    text: string,
}

interface TLoadArgs {
    textContains: string,
}

const tLoadFunction = (args: TLoadArgs): Observable<TResource[]> => of([{ id: 0, text: 'text0' }, { id: 1, text: 'text1' }]);
const tLoadArgs: TLoadArgs = { textContains: 'word' };
const tResource: TResource[] = [{ id: 0, text: 'text0' }, { id: 1, text: 'text1' }];

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

describe.only('LoadableResource', () => {

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

  describe('Smoke', () => {
    it('should smoke', () => {
      new LoadableResource<TResource[], TLoadArgs>(tLoadFunction);
    });
  });

  describe('Loading data', () => {
    it('should load the data, when a trigger happens', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const trigger$ = cold('--a', { a: tLoadArgs });
        const load$ = cold('--a', { a: tResource });
  
        const obs$ = LoadableRx
          .trigger(trigger$)
          .loadPipe(mergeMap(() => load$));
        expectObservable(obs$.data$).toBe('----a', { a: tResource });
      });
    });
  
    it('should load the data, when a trigger happens twice', () => {
      scheduler.run(({ cold, expectObservable }) => {
  
        const trigger$ = cold('--a--a', { a: tLoadArgs });
        const load$ = cold('--a', { a: tResource });
  
        const obs$ = LoadableRx
          .trigger(trigger$)
          .loadPipe(mergeMap(() => load$));
        expectObservable(obs$.data$).toBe('----a--a', { a: tResource });
      });
    });

    describe('switch map integration', () => {
      describe('switch map on trigger', () => {
        const triggerPattern = '--a--a';
        const switchPattern = '----a';
        const expectedPattern = '---------a';

        it('normal switchMap', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const load$ = cold('a', { a: tResource });
      
            const trigger$ = cold(triggerPattern, { a: tLoadArgs })
              .pipe(
                switchMap(() => cold(switchPattern, { a: tLoadArgs })),
                mergeMap(() => load$),
              );
            
            expectObservable(trigger$).toBe(expectedPattern, { a: tResource });
          });
        });


        it('switchMap integration', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const load$ = cold('a', { a: tResource });
      
            const trigger$ = cold(triggerPattern, { a: tLoadArgs })
              .pipe(
                switchMap(() => cold(switchPattern, { a: tLoadArgs })),
              );
            
            const obs$ = LoadableRx
              .trigger(trigger$)
              .loadPipe(mergeMap(() => load$));      
            expectObservable(obs$.data$).toBe(expectedPattern, { a: tResource });
          });
        });
      
      });

      describe('switchMap on loadFn', () => {
        const triggerPattern = '--a--a';
        const switchPattern = '----a';
        const expectedPattern = '---------a';

        it('normal switchMap', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const load$ = of('immediate').pipe(switchMap(() => cold(switchPattern, { a: tResource })));
      
            const trigger$ = cold(triggerPattern, { a: tLoadArgs })
              .pipe(
                switchMap(() => load$),
              );
            
            expectObservable(trigger$).toBe(expectedPattern, { a: tResource });
          });
        });


        it('switchMap integration', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const load$ = cold('a', { a: tResource });
      
            const trigger$ = cold(triggerPattern, { a: tLoadArgs })
              .pipe(
                switchMap(() => cold(switchPattern, { a: tLoadArgs })),
              );
            
            const obs$ = LoadableRx
              .trigger(trigger$)
              .loadPipe(mergeMap(() => load$));      
            expectObservable(obs$.data$).toBe(expectedPattern, { a: tResource });
          });
        });
      });
    });

  
  });

  describe('Loader', () => {
    it('should display a loader while data is loading', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const trigger$ = cold('--a', { a: tLoadArgs });
        const load$ = cold('--a', { a: tResource });
  
        const obs$ = LoadableRx
          .trigger(trigger$)
          .loadPipe(mergeMap(() => load$));
        obs$.data$.subscribe(); // TODO - remove
        expectObservable(obs$.isLoading$).toBe('--t-f', { t: true, f: false  });
      });
    });

    it.skip('should display a loader switchMap case // not applicable (maybe not even testable)', () => { // not applicable (maybe not even testable)
      const triggerPattern = '--a--a';
      const switchPattern = '----a';
      const expectedPattern = '---------a';
      scheduler.run(({ cold, expectObservable }) => {
        const load$ = cold('a', { a: tResource });
    
        const trigger$ = cold(triggerPattern, { a: tLoadArgs })
          .pipe(
            switchMap(() => cold(switchPattern, { a: tLoadArgs })),
          );
        
        const obs$ = LoadableRx
          .trigger(trigger$)
          .loadPipe(mergeMap(() => load$));      
        expectObservable(obs$.data$).toBe(expectedPattern, { a: tResource });
        expectObservable(obs$.isLoading$).toBe('---------tf', { t: true, f: false  });
      });
    });

  });

});

function drawMarbleFromDefs (def: any) {
  console.log(def);
  let expectedMarble = '-';
  let expectedFrame = 0;
  def.forEach((ev: any) => {
    if (ev.frame === 0) {
      expectedMarble = ev.notification.value;  
    }
    else {
      if (ev.frame > expectedFrame) Array.from(new Array(ev.frame - (expectedFrame + 1))).forEach(tick => expectedMarble += '-');
      expectedMarble += ev.notification.value;
    }
    expectedFrame = ev.frame;

  });
  return expectedMarble;
}