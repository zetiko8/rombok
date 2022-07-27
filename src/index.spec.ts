import { LoadableRx, LOAD_STRATEGY } from '.';
import { mergeMap, switchMap } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { expect } from 'chai';

interface TResource {
    id: number,
    text: string,
}

interface TLoadArgs {
    textContains: string,
}

const tLoadArgs: TLoadArgs = { textContains: 'word' };
const tResource = 'a';

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

  describe('Loading data', () => {
    it('should load the data, when a trigger happens', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const trigger$ = cold('--a', { a: tLoadArgs });
        const load$ = cold('--a', { a: tResource });
  
        const obs$ = LoadableRx
          .trigger(trigger$)
          .loadPipe(mergeMap(() => load$));
        expectObservable(obs$).toBe('----a', { a: tResource });
      });
    });
  
    it('should load the data, when a trigger happens twice', () => {
      scheduler.run(({ cold, expectObservable }) => {
  
        const trigger$ = cold('--a--a', { a: tLoadArgs });
        const load$ = cold('--a', { a: tResource });
  
        const obs$ = LoadableRx
          .trigger(trigger$)
          .loadPipe(mergeMap(() => load$));
        expectObservable(obs$).toBe('----a--a', { a: tResource });
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
            expectObservable(obs$).toBe(expectedPattern, { a: tResource });
          });
        });
      
      });

      describe('switchMap on loadFn', () => {
        const triggerPattern = '--a--a';
        const switchPattern = '----a';
        const expectedPattern = '---------a';

        it('normal switchMap', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const load$ = cold(switchPattern, { a: tResource });
      
            const trigger$ = cold(triggerPattern, { a: tLoadArgs })
              .pipe(switchMap(() => load$));
            
            expectObservable(trigger$).toBe(expectedPattern, { a: tResource });
          });
        });


        it('switchMap integration', () => {
          scheduler.run(({ cold, expectObservable }) => {      
            const trigger$ = cold(triggerPattern, { a: tLoadArgs });
            const load$ = cold(switchPattern, { a: tResource });
      
            const obs$ = LoadableRx
              .trigger(trigger$)
              .loadPipe(switchMap(() => load$));      
            expectObservable(obs$).toBe(expectedPattern, { a: tResource });
          });
        });
      });

      describe('No switch when switch map is not used', () => {
        describe('no switch map on trigger', () => {
          const triggerPattern = '--a--a';
          const noSwitchPattern = '----a';
          const expectedPattern = '------a--a';
  
          it('normal switchMap', () => {
            scheduler.run(({ cold, expectObservable }) => {
              const load$ = cold('a', { a: tResource });
        
              const trigger$ = cold(triggerPattern, { a: tLoadArgs })
                .pipe(
                  mergeMap(() => cold(noSwitchPattern, { a: tLoadArgs })),
                  mergeMap(() => load$),
                );
              
              expectObservable(trigger$).toBe(expectedPattern, { a: tResource });
            });
          });
  
          it('no switchMap integration', () => {
            scheduler.run(({ cold, expectObservable }) => {
              const load$ = cold('a', { a: tResource });
        
              const trigger$ = cold(triggerPattern, { a: tLoadArgs })
                .pipe(
                  mergeMap(() => cold(noSwitchPattern, { a: tLoadArgs })),
                );
              
              const obs$ = LoadableRx
                .trigger(trigger$)
                .loadPipe(mergeMap(() => load$));      
              expectObservable(obs$).toBe(expectedPattern, { a: tResource });
            });
          });
        
        });
  
        describe('no switchMap on loadFn', () => {
          const triggerPattern = '--a--a';
          const noSwitchPattern = '----a';
          const expectedPattern = '------a--a';
  
          it('normal no switchMap', () => {
            scheduler.run(({ cold, expectObservable }) => {
              const load$ = cold(noSwitchPattern, { a: tResource });
        
              const trigger$ = cold(triggerPattern, { a: tLoadArgs })
                .pipe(mergeMap(() => load$));
              
              expectObservable(trigger$).toBe(expectedPattern, { a: tResource });
            });
          });
  
  
          it('no switchMap integration', () => {
            scheduler.run(({ cold, expectObservable }) => {      
              const trigger$ = cold(triggerPattern, { a: tLoadArgs });
              const load$ = cold(noSwitchPattern, { a: tResource });
        
              const obs$ = LoadableRx
                .trigger(trigger$)
                .loadPipe(mergeMap(() => load$));      
              expectObservable(obs$).toBe(expectedPattern, { a: tResource });
            });
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
        obs$.subscribe();
        expectObservable(obs$.isLoading$).toBe('--t-f', { t: true, f: false  });
      });
    });

    it('should display a loader complicated case', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const load$ = cold('--a', { a: tResource });
        
        const trigger$ = cold('a-a-a---a', { a: tLoadArgs });
        const obs$ = LoadableRx
          .trigger(trigger$)
          .loadPipe(mergeMap(() => load$));  
        expectObservable(obs$).toBe('--a-a-a---a', { a: tResource });
        expectObservable(obs$.isLoading$).toBe('t-----f-t-f', { t: true, f: false  });
      });
    });

    it('should display a loader, switch map on loadFn', () => {
      const triggerPattern = '--a--a';
      const switchPattern = '----a';
      const expectedPattern = '---------a';
      scheduler.run(({ cold, expectObservable }) => {
        const trigger$ = cold(triggerPattern, { a: tLoadArgs });
        const load$ = cold(switchPattern, { a: tResource });
  
        const obs$ = LoadableRx
          .trigger(trigger$)
          .loadPipe(switchMap(() => load$), { loadStrategy: LOAD_STRATEGY.only_one_load_at_a_time });      
        expectObservable(obs$).toBe(expectedPattern, { a: tResource });
        expectObservable(obs$.isLoading$).toBe('--t------f', { t: true, f: false  });
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