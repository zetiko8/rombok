import { ERROR_STRATEGY, LoadableRx } from '.';
import { mergeMap, switchMap, catchError, filter } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { expect } from 'chai';
import { of, throwError, EMPTY } from 'rxjs';
import { prepareTestScheduler, TLoadArgs } from './test.helpers';

const tLoadArgs: TLoadArgs = { textContains: 'word' };
const tLoadArgsThatThrow: TLoadArgs = { textContains: 'throw-error' };
const tResource = 'a';

describe('LoadableResource', () => {

  let scheduler: TestScheduler;
  beforeEach(() => scheduler = prepareTestScheduler());

  describe('Loading data', () => {
    it('should load the data, when a trigger happens', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const trigger$ = cold('--a', { a: tLoadArgs });
        const load$ = cold('--a', { a: tResource });
  
        const obs$ = LoadableRx
          .trigger(trigger$)
          .loadFunction(() => load$);
        expectObservable(obs$).toBe('----a', { a: tResource });
      });
    });
  
    it('should load the data, when a trigger happens twice', () => {
      scheduler.run(({ cold, expectObservable }) => {
  
        const trigger$ = cold('--a--a', { a: tLoadArgs });
        const load$ = cold('--a', { a: tResource });
  
        const obs$ = LoadableRx
          .trigger(trigger$)
          .loadFunction(() => load$);
        expectObservable(obs$).toBe('----a--a', { a: tResource });
      });
    });

    it('the load pipe should get the correct parameters', () => {
      scheduler.run(({ cold, expectObservable }) => {
  
        const trigger$ = cold('--a', { a: tLoadArgs });
        const load$ = cold('--a', { a: tResource });
  
        const obs$ = LoadableRx
          .trigger(trigger$)
          .loadFunction(args => {
            expect(args.textContains).to.equal('word');
            return load$;
          });
        expectObservable(obs$).toBe('----a', { a: tResource });
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
              .loadFunction(() => load$);      
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
              .loadFunction(() => load$, { switch: true });      
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
                .loadFunction(() => load$);      
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
                .loadFunction(() => load$);      
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
          .loadFunction(() => load$);
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
          .loadFunction(() => load$);  
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
          .loadFunction(() => load$, { switch: true });      
        expectObservable(obs$).toBe(expectedPattern, { a: tResource });
        expectObservable(obs$.isLoading$).toBe('--t------f', { t: true, f: false  });
      });
    });

  });

  describe('Error handling', () => {
    describe('error on trigger', () => {
      it('should throw an error', () => {
        scheduler.run(({ cold, expectObservable }) => {
          const error = Error('Test error');
          const trigger$ = cold('--#', { a: tLoadArgs }, error);
          const load$ = cold('--a', { a: tResource });
      
          const obs$ = LoadableRx
            .trigger(trigger$)
            .loadFunction(() => load$);
          expectObservable(obs$).toBe('--#', { a: tResource }, error);
          expectObservable(obs$.loadingError$).toBe('n-e', { e: error, n: null });
        });
      });
      it('should terminate the stream', () => {
        scheduler.run(({ cold, expectObservable }) => {
          const error = Error('Test error');
          const trigger$ = cold('--#--a', { a: tLoadArgs }, error);
          const load$ = cold('--a', { a: tResource });
      
          const obs$ = LoadableRx
            .trigger(trigger$)
            .loadFunction(() => load$);
          expectObservable(obs$).toBe('--#', { a: tResource }, error);
          expectObservable(obs$.loadingError$).toBe('n-e', { e: error, n: null });
        });
      });
      it('test of non terminate pattern that does not throw an error, that the user needs to take care for', () => {
        scheduler.run(({ cold, expectObservable }) => {
          const validateTrigger = (loadArgs: TLoadArgs) => loadArgs.textContains === 'throw-error' ? throwError(error) : of(loadArgs);

          const error = Error('Test error');
          const trigger$ = cold('--e--a', { a: tLoadArgs, e: tLoadArgsThatThrow }, error)
            .pipe(
              mergeMap(loadArgs => validateTrigger(loadArgs).pipe(catchError(() => of('ERROR_ENUM')))),
              filter(response => response !== 'ERROR_ENUM'),
            );
          const load$ = cold('--a', { a: tResource });
      
          const obs$ = LoadableRx
            .trigger(trigger$)
            .loadFunction(() => load$);
          expectObservable(obs$).toBe('-------a', { a: tResource }, error);
          expectObservable(obs$.loadingError$).toBe('n', { e: error, n: null });
        });
      });
    });
    describe('error on loadFunction', () => {
      describe('test of ERROR_STRATEGY.terminate', () => {
        it('should throw an error', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const error = Error('Test error');
            const trigger$ = cold('--a--a', { a: tLoadArgs });
            const load$ = cold('--#', { a: tResource }, error);
            
            const obs$ = LoadableRx
              .trigger(trigger$)
              .loadFunction(() => load$);
  
            expectObservable(obs$).toBe('----#', { a: tResource }, error);
          });
        });
        it('should terminate the stream', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const error = Error('Test error');
            const trigger$ = cold('--a--a', { a: tLoadArgs });
            const load$ = cold('--#', { a: tResource }, error);
            
            const obs$ = LoadableRx
              .trigger(trigger$)
              .loadFunction(() => load$);
  
            obs$.subscribe({ 
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              error(err) {}, 
            });
            expectObservable(obs$.loadingError$).toBe('n---e', { e: error, n: null });
          });
        });
      });
      describe('test of ERROR_STRATEGY.non_terminating', () => {
        it('should not throw an error', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const error = Error('Test error');
            const trigger$ = cold('--a--a', { a: tLoadArgs });
            const load$ = cold('--#', { a: tResource }, error);
            
            const obs$ = LoadableRx
              .trigger(trigger$)
              .loadFunction(() => load$, { errorStrategy: ERROR_STRATEGY.non_terminating });
  
            expectObservable(obs$).toBe('-----', { a: tResource }, error);
          });
        });
        it('should not terminate the stream', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const error = Error('Test error');
            const trigger$ = cold('--a--a', { a: tLoadArgs });
            const load$ = cold('--#', { a: tResource }, error);
            
            const obs$ = LoadableRx
              .trigger(trigger$)
              .loadFunction(() => load$, { errorStrategy: ERROR_STRATEGY.non_terminating });
  
            obs$.subscribe();
            expectObservable(obs$.loadingError$).toBe('n---en-e', { e: error, n: null });
          });
        });
      });
    });
  });

});
