import { LoadableResource } from '.';
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
        const loadFn = (args: TLoadArgs) => cold('--a', { a: tResource });
  
        const loadable = new LoadableResource<TResource[], TLoadArgs>(loadFn, trigger$);
        expectObservable(loadable.data$).toBe('----a', { a: tResource });
      });
    });
  
    it('should load the data, when a trigger happens twice', () => {
      scheduler.run(({ cold, expectObservable }) => {
  
        const trigger$ = cold('--a--a', { a: tLoadArgs });
        const loadFn = (args: TLoadArgs) => cold('--a', { a: tResource });
  
        const loadable = new LoadableResource<TResource[], TLoadArgs>(loadFn, trigger$);
        expectObservable(loadable.data$).toBe('----a--a', { a: tResource });
      });
    });
  
    it('should load the data, when loadData is called', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const loadFn = (args: TLoadArgs) => cold('--a', { a: tResource });
  
        const loadable = new LoadableResource<TResource[], TLoadArgs>(loadFn);
        loadable.loadData(tLoadArgs);
        expectObservable(loadable.data$).toBe('--a', { a: tResource });
      });
    });
  
    it('should load the data, when loadData is called twice', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const loadFn = (args: TLoadArgs) => cold('--a', { a: tResource });
  
        const loadable = new LoadableResource<TResource[], TLoadArgs>(loadFn);
        loadable.loadData(tLoadArgs);
        cold('--a', dict).subscribe(() => loadable.loadData(tLoadArgs));
        expectObservable(loadable.data$).toBe('--a-a', { a: tResource });
      });
    });
  
    it('should load the data, when loadData is called and when trigger is called', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const loadFn = (args: TLoadArgs) => cold('--a', { a: tResource });
  
        const trigger$ = cold('--a', { a: tLoadArgs });
        const loadable = new LoadableResource<TResource[], TLoadArgs>(loadFn, trigger$);
        loadable.loadData(tLoadArgs);
        expectObservable(loadable.data$).toBe('--a-a', { a: tResource });
      });
    });
  
    it('should load the data, when loadData is called and when trigger is called twice', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const loadFn = (args: TLoadArgs) => cold('--a', { a: tResource });
  
        const trigger$ = cold('--a-----a', { a: tLoadArgs });
        const loadable = new LoadableResource<TResource[], TLoadArgs>(loadFn, trigger$);
        loadable.loadData(tLoadArgs);
        cold('----a', dict).subscribe(() => loadable.loadData(tLoadArgs));
        expectObservable(loadable.data$).toBe('--a-a-a---a', { a: tResource });
      });
    });

    describe('switch map integration', () => {
      describe('switch map on trigger', () => {
        const triggerPattern = '--a--a';
        const switchPattern = '----a';
        const expectedPattern = '---------a';

        it('normal switchMap', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const loadFn = (args: TLoadArgs) => cold('a', { a: tResource });
      
            const trigger$ = cold(triggerPattern, { a: tLoadArgs })
              .pipe(
                switchMap(() => cold(switchPattern, { a: tLoadArgs })),
                mergeMap(() => loadFn(tLoadArgs)),
              );
            
            expectObservable(trigger$).toBe(expectedPattern, { a: tResource });
          });
        });


        it('switchMap integration', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const loadFn = (args: TLoadArgs) => cold('a', { a: tResource });
      
            const trigger$ = cold(triggerPattern, { a: tLoadArgs })
              .pipe(
                switchMap(() => cold(switchPattern, { a: tLoadArgs })),
              );
            
            const loadable = new LoadableResource<TResource[], TLoadArgs>(loadFn, trigger$);      
            expectObservable(loadable.data$).toBe(expectedPattern, { a: tResource });
          });
        });
      
      });

      describe('switchMap on loadFn', () => {
        const triggerPattern = '--a--a';
        const switchPattern = '----a';
        const expectedPattern = '---------a';

        it('normal switchMap', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const loadFn = (args: TLoadArgs) => of('immediate').pipe(switchMap(() => cold(switchPattern, { a: tResource })));
      
            const trigger$ = cold(triggerPattern, { a: tLoadArgs })
              .pipe(
                switchMap(() => loadFn(tLoadArgs)),
              );
            
            expectObservable(trigger$).toBe(expectedPattern, { a: tResource });
          });
        });


        it('switchMap integration', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const loadFn = (args: TLoadArgs) => cold('a', { a: tResource });
      
            const trigger$ = cold(triggerPattern, { a: tLoadArgs })
              .pipe(
                switchMap(() => cold(switchPattern, { a: tLoadArgs })),
              );
            
            const loadable = new LoadableResource<TResource[], TLoadArgs>(loadFn, trigger$);      
            expectObservable(loadable.data$).toBe(expectedPattern, { a: tResource });
          });
        });
      });
    });

  
  });

  describe('Loader', () => {
    it('should display a loader while data is loading', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const trigger$ = cold('--a', { a: tLoadArgs });
        const loadFn = (args: TLoadArgs) => cold('--a', { a: tResource });
  
        const loadable = new LoadableResource<TResource[], TLoadArgs>(loadFn, trigger$);
        loadable.data$.subscribe(); // TODO - remove
        expectObservable(loadable.isLoading$).toBe('--t-f', { t: true, f: false  });
      });
    });
    
    it('should display a loader complicated case', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const loadFn = (args: TLoadArgs) => cold('--a', { a: tResource });
        
        const trigger$ = cold('--a-----a', { a: tLoadArgs });
        const loadable = new LoadableResource<TResource[], TLoadArgs>(loadFn, trigger$);
        loadable.data$.subscribe(); // TODO - remove
        loadable.loadData(tLoadArgs);
        cold('----a', dict).subscribe(() => loadable.loadData(tLoadArgs));
        expectObservable(loadable.data$).toBe('--a-a-a---a', { a: tResource });
        expectObservable(loadable.isLoading$).toBe('t-----f-t-f', { t: true, f: false  });
      });
    });

    it.skip('should display a loader switchMap case // not applicable (maybe not even testable)', () => { // not applicable (maybe not even testable)
      const triggerPattern = '--a--a';
      const switchPattern = '----a';
      const expectedPattern = '---------a';
      scheduler.run(({ cold, expectObservable }) => {
        const loadFn = (args: TLoadArgs) => cold('a', { a: tResource });
    
        const trigger$ = cold(triggerPattern, { a: tLoadArgs })
          .pipe(
            switchMap(() => cold(switchPattern, { a: tLoadArgs })),
          );
        
        const loadable = new LoadableResource<TResource[], TLoadArgs>(loadFn, trigger$);      
        expectObservable(loadable.data$).toBe(expectedPattern, { a: tResource });
        expectObservable(loadable.isLoading$).toBe('---------tf', { t: true, f: false  });
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