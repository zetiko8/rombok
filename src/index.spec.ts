/* eslint-disable @typescript-eslint/no-empty-function */
import { loadableRx, LoadableRx } from '.';
import { ERROR_STRATEGY } from './error-handling';
import { mergeMap, switchMap, shareReplay } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import * as chai from 'chai';
import { createSandbox, SinonSandbox } from 'sinon';
import * as sinonChai from 'sinon-chai';
import { of, EMPTY } from 'rxjs';
import { after, getSpyWrapper, ignoreErrorSub, myScheduler, prepareTestScheduler, TestError, TLoadArgs } from './test.helpers';
import { logger } from './debug-helpers';
chai.use(sinonChai);
const expect = chai.expect;

logger.logLevel = 3;

const tLoadArgs: TLoadArgs = { textContains: 'word' };
const tLoadArgsThatThrow: TLoadArgs = { textContains: 'throw-error' };
const tResource = 'a';

describe('LoadableResource', () => {

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

  describe('Loading data', () => {
    it('should load the data, when a trigger happens', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const trigger$ = cold('--a', { a: tLoadArgs });
        const load$ = cold('--a', { a: tResource });
  
        const obs$ = trigger$
          .pipe(loadableRx(new LoadableRx(() => load$)));
        expectObservable(obs$).toBe('----a', { a: tResource });
      });
    });
  
    it('should load the data, when a trigger happens twice', () => {
      scheduler.run(({ cold, expectObservable }) => {
  
        const trigger$ = cold('--a--a', { a: tLoadArgs });
        const load$ = cold('--a', { a: tResource });
  
        const obs$ = trigger$
          .pipe(loadableRx(new LoadableRx(() => load$)));
        expectObservable(obs$).toBe('----a--a', { a: tResource });
      });
    });

    it('the load pipe should get the correct parameters', () => {
      scheduler.run(({ cold, expectObservable }) => {
  
        const trigger$ = cold('--a', { a: tLoadArgs });
        const load$ = cold('--a', { a: tResource });
  
        const obs$ = trigger$
          .pipe(loadableRx(new LoadableRx(args => {
            expect((args as any).textContains).to.equal('word');
            return load$;
          })));
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
            
            const obs$ = trigger$
              .pipe(loadableRx(new LoadableRx(() => load$)));     
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
      
            const obs$ = trigger$
              .pipe(loadableRx(new LoadableRx(() => load$, { switch: true })));    
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
              
              const obs$ = trigger$
                .pipe(loadableRx(new LoadableRx(() => load$)));      
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
        
              const obs$ = trigger$
                .pipe(loadableRx(new LoadableRx(() => load$))); 
              expectObservable(obs$).toBe(expectedPattern, { a: tResource });
            });
          });
        });
      });
    });

    describe('shareReplay integration', () => {
      describe('no loadableRx', () => {
        it('no share replay', () => {
          const spyWrapper = getSpyWrapper(sbx);
          const spy = spyWrapper.spy;
          scheduler.run(({ cold, expectObservable }) => {
            const trigger$ = cold('--a', { a: tLoadArgs });
            const load$ = cold('--a', { a: tResource });
            spyWrapper.setFn(() => load$);
            
            const obs$ = trigger$.pipe(mergeMap(spy));
            expectObservable(obs$).toBe('----a', { a: tResource });
            expectObservable(obs$).toBe('----a', { a: tResource });
  
          });
          expect(spy).to.have.been.calledTwice;
        });
        it('normal share replay', () => {
          const spyWrapper = getSpyWrapper(sbx);
          const spy = spyWrapper.spy;
          scheduler.run(({ cold, expectObservable }) => {
            const trigger$ = cold('--a', { a: tLoadArgs });
            const load$ = cold('--a', { a: tResource });
            spyWrapper.setFn(() => load$);
            
            const obs$ = trigger$.pipe(mergeMap(spy), shareReplay(1));
            expectObservable(obs$).toBe('----a', { a: tResource });
            expectObservable(obs$).toBe('----a', { a: tResource });
  
          });
          expect(spy).to.have.been.calledOnce;
        });
      });
      describe('integration', () => {
        it('no share replay', () => {
          const spyWrapper = getSpyWrapper(sbx);
          const spy = spyWrapper.spy;
          scheduler.run(({ cold, expectObservable }) => {
            const trigger$ = cold('--a', { a: tLoadArgs });
            const load$ = cold('--a', { a: tResource });
            spyWrapper.setFn(() => load$);
      
            const obs$ = trigger$
              .pipe(loadableRx(new LoadableRx(spy))); 
            expectObservable(obs$).toBe('----a', { a: tResource });
            expectObservable(obs$).toBe('----a', { a: tResource });
          });
          expect(spy).to.have.been.calledTwice;
        });
        it('share replay', () => {
          const spyWrapper = getSpyWrapper(sbx);
          const spy = spyWrapper.spy;
          scheduler.run(({ cold, expectObservable }) => {
            const trigger$ = cold('--a', { a: tLoadArgs });
            const load$ = cold('--a', { a: tResource });
            spyWrapper.setFn(() => load$);
      
            const obs$ = trigger$
              .pipe(
                loadableRx(new LoadableRx(spy)),
                shareReplay(1),
              );
            expectObservable(obs$).toBe('----a', { a: tResource });
            expectObservable(obs$).toBe('----a', { a: tResource });
          });
          expect(spy).to.have.been.calledOnce;
        });
      });
    });
  });

  describe('Loader', () => {
    it('should display a loader while data is loading', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const trigger$ = cold('--a', { a: tLoadArgs });
        const load$ = cold('--a', { a: tResource });
        const lrx = new LoadableRx(() => load$);

        const obs$ = trigger$
          .pipe(loadableRx(lrx));
        obs$.subscribe();
        expectObservable(lrx.isLoading$).toBe('--t-f', { t: true, f: false  });
      });
    });

    it('should display a loader complicated case', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const load$ = cold('--a', { a: tResource });
        
        const trigger$ = cold('a-a-a---a', { a: tLoadArgs });
        const lrx = new LoadableRx(() => load$);

        const obs$ = trigger$
          .pipe(loadableRx(lrx));
        expectObservable(obs$).toBe('--a-a-a---a', { a: tResource });
        expectObservable(lrx.isLoading$).toBe('t-----f-t-f', { t: true, f: false  });
      });
    });

    it('should display a loader, switch map on loadFn', () => {
      const triggerPattern = '--a--a';
      const switchPattern = '----a';
      const expectedPattern = '---------a';
      scheduler.run(({ cold, expectObservable }) => {
        const trigger$ = cold(triggerPattern, { a: tLoadArgs });
        const load$ = cold(switchPattern, { a: tResource });
  
        const lrx = new LoadableRx(() => load$, { switch: true });

        const obs$ = trigger$
          .pipe(loadableRx(lrx));
        expectObservable(obs$).toBe(expectedPattern, { a: tResource });
        expectObservable(lrx.isLoading$).toBe('--t------f', { t: true, f: false  });
      });
    });

    it('switchMap integration - TODO - better name for this test', () => {
      const triggerPattern = '--a--a';
      const switchPattern = '----a';
      scheduler.run(({ cold, expectObservable }) => {
        const error = new TestError('Test error');
        const load$ = cold('a', { a: tResource }, error);
  
        const trigger$ = cold(triggerPattern, { a: tLoadArgs })
          .pipe(switchMap(() => cold(switchPattern, { a: tLoadArgs })));
        
        const lrx = new LoadableRx(() => load$);

        const obs$ = trigger$
          .pipe(loadableRx(lrx));
        obs$.subscribe(ignoreErrorSub);
        expectObservable(lrx.isLoading$).toBe('---------(tf)', { t: true, f: false  });
      });
    });

  });

  describe('Error handling', () => {
    describe('error on trigger', () => {
      it('should throw an error', () => {
        scheduler.run(({ cold, expectObservable }) => {
          const error = new TestError('Test error');
          const trigger$ = cold('--#', { a: tLoadArgs }, error);
          const load$ = cold('--a', { a: tResource });
      
          const lrx = new LoadableRx(() => load$);

          const obs$ = trigger$
            .pipe(loadableRx(lrx));
          expectObservable(obs$).toBe('--#', { a: tResource }, error);
          expectObservable(lrx.loadingError$).toBe('n-e', { e: error, n: null });
        });
      });
      it('should terminate the stream', () => {
        scheduler.run(({ cold, expectObservable }) => {
          const error = new TestError('Test error');
          const trigger$ = cold('--#--a', { a: tLoadArgs }, error);
          const load$ = cold('--a', { a: tResource });
      
          const lrx = new LoadableRx(() => load$);

          const obs$ = trigger$
            .pipe(loadableRx(lrx));
          expectObservable(obs$).toBe('--#', { a: tResource }, error);
          expectObservable(lrx.loadingError$).toBe('n-e', { e: error, n: null });
        });
      });
      it('test of non terminate pattern that does not throw an error, that the user needs to take care for', () => {
        scheduler.run(({ cold, expectObservable }) => {
          const validateTrigger = (loadArgs: TLoadArgs) => loadArgs.textContains === 'throw-error' ? EMPTY : of(loadArgs);

          const error = new TestError('Test error');
          const trigger$ = cold('--e--a', { a: tLoadArgs, e: tLoadArgsThatThrow }, error)
            .pipe(mergeMap(loadArgs => validateTrigger(loadArgs)));
          const load$ = cold('--a', { a: tResource });
      
          const lrx = new LoadableRx(() => load$);

          const obs$ = trigger$
            .pipe(loadableRx(lrx));
          expectObservable(obs$).toBe('-------a', { a: tResource }, error);
          expectObservable(lrx.loadingError$).toBe('n', { e: error, n: null });
        });
      });
    });
    describe('error on loadFunction', () => {
      describe('test of ERROR_STRATEGY.terminate', () => {
        it('should throw an error', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const error = new TestError('Test error');
            const trigger$ = cold('--a--a', { a: tLoadArgs });
            const load$ = cold('--#', { a: tResource }, error);
            
            const lrx = new LoadableRx(() => load$);

            const obs$ = trigger$
              .pipe(loadableRx(lrx));  
            expectObservable(obs$).toBe('----#', { a: tResource }, error);
          });
        });
        it('should terminate the stream', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const error = new TestError('Test error');
            const trigger$ = cold('--a--a', { a: tLoadArgs });
            const load$ = cold('--#', { a: tResource }, error);
            
            const lrx = new LoadableRx(() => load$);

            const obs$ = trigger$
              .pipe(loadableRx(lrx));  
            obs$.subscribe(ignoreErrorSub);
            expectObservable(lrx.loadingError$).toBe('n---e', { e: error, n: null });
          });
        });
      });
      describe('test of ERROR_STRATEGY.non_terminating', () => {
        it('should not throw an error', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const error = new TestError('Test error');
            const trigger$ = cold('--a--a', { a: tLoadArgs });
            const load$ = cold('--#', { a: tResource }, error);
            
            const lrx = new LoadableRx(() => load$, { errorStrategy: ERROR_STRATEGY.non_terminating });

            const obs$ = trigger$
              .pipe(loadableRx(lrx));  
            expectObservable(obs$).toBe('-----', { a: tResource }, error);
          });
        });
        it('should not terminate the stream', () => {
          scheduler.run(({ cold, expectObservable }) => {
            const error = new TestError('Test error');
            const trigger$ = cold('--a--a', { a: tLoadArgs });
            const load$ = cold('--#', { a: tResource }, error);
            
            const lrx = new LoadableRx(() => load$, { errorStrategy: ERROR_STRATEGY.non_terminating });

            const obs$ = trigger$
              .pipe(loadableRx(lrx));  
            obs$.subscribe();
            expectObservable(lrx.loadingError$).toBe('n---en-e', { e: error, n: null });
          });
        });
      });
    });
  });

  describe('Error + Loading', () => {
    it('not start loading if an error is thrown in trigger', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const error = new TestError('Test error');
        const trigger$ = cold('--#', { a: tLoadArgs }, error);
        const load$ = cold('--a', { a: tResource });
    
        const lrx = new LoadableRx(() => load$);

        const obs$ = trigger$
          .pipe(loadableRx(lrx));
        obs$.subscribe(ignoreErrorSub);

        expectObservable(lrx.isLoading$).toBe('', { t: true, f: false  });
      });
    });
    it('should stop loading if an error is thrown', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const error = new TestError('Test error');
        const trigger$ = cold('--a--a', { a: tLoadArgs });
        const load$ = cold('--#', { a: tResource }, error);
        
        const lrx = new LoadableRx(() => load$);

        const obs$ = trigger$
          .pipe(loadableRx(lrx));
        obs$.subscribe(ignoreErrorSub);
        expectObservable(lrx.isLoading$).toBe('--t-f', { t: true, f: false  });
      });
    });
    it('should stop loading if an error is thrown, but start loading again on second trigger', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const error = new TestError('Test error');
        const trigger$ = cold('--a--a', { a: tLoadArgs });
        const load$ = cold('--#', { a: tResource }, error);
        
        const lrx = new LoadableRx(() => load$, { errorStrategy: ERROR_STRATEGY.non_terminating });

        const obs$ = trigger$
          .pipe(loadableRx(lrx));
        obs$.subscribe();
        expectObservable(lrx.loadingError$).toBe('n---en-e', { e: error, n: null });
        expectObservable(lrx.isLoading$).toBe('--t-ft-f', { t: true, f: false  });
      });
    });

    it('should display a loader, switch map on loadFn + error', () => {
      const triggerPattern = '--a--a';
      const switchPattern = '----#';
      const expectedPattern = '---------a';
      scheduler.run(({ cold, expectObservable }) => {
        const error = new TestError('Test error');
        const trigger$ = cold(triggerPattern, { a: tLoadArgs });
        const load$ = cold(switchPattern, { a: tResource }, error);
  
        const lrx = new LoadableRx(() => load$, { switch: true });

        const obs$ = trigger$
          .pipe(loadableRx(lrx));
        obs$.subscribe(ignoreErrorSub);
        expectObservable(lrx.isLoading$).toBe('--t------f', { t: true, f: false  });
      });
    });

    it('should display a loader, switch map on trigger$ + error', () => {
      const triggerPattern = '--a--a';
      const switchPattern = '----a';
      scheduler.run(({ cold, expectObservable }) => {
        const error = new TestError('Test error');
        const load$ = cold('#', { a: tResource }, error);
  
        const trigger$ = cold(triggerPattern, { a: tLoadArgs })
          .pipe(switchMap(() => cold(switchPattern, { a: tLoadArgs })));
        
        const lrx = new LoadableRx(() => load$);

        const obs$ = trigger$
          .pipe(loadableRx(lrx));
        obs$.subscribe(ignoreErrorSub);
        expectObservable(lrx.isLoading$).toBe('---------(tf)', { t: true, f: false  });
      });
    });
  });

  describe('shareReplay + loading', () => {
    it('should give the correct loading indicators, despite shareReplay being used', () => {
      scheduler.run(({ cold, expectObservable }) => {
        const load$ = cold('--a', { a: tResource });
        
        const trigger$ = cold('a-a-a---a', { a: tLoadArgs });
        const lrx = new LoadableRx(() => load$);

        const obs$ = trigger$
          .pipe(loadableRx(lrx), shareReplay(1));
        expectObservable(obs$).toBe('--a-a-a---a', { a: tResource });
        expectObservable(obs$).toBe('--a-a-a---a', { a: tResource });
        expectObservable(lrx.isLoading$).toBe('t-----f-t-f', { t: true, f: false  });
      });
    });
  });

  describe('unsubscribe', () => {
    const delayT = 20;
    const afterTime = delayT * 15;
    // watch out the tests tak3 f-n 310ms, also it is important to correctly
    // set the mocha timeout in .mocharc.json
    it('(slowtest) no unsubscribe - once', done => {
      const trigger$ = myScheduler('--a', { a: tLoadArgs }, delayT);
      const load$ = myScheduler('--a', { a: tLoadArgs }, delayT);
      const spy = sbx.spy(() => {});

      trigger$
        .pipe(loadableRx(new LoadableRx(() => load$)))
        .subscribe({ next: spy });

      after(afterTime, () => {
        expect(spy).to.have.been.calledOnce;
        done();
      });
      
    });
    it('(slowtest) unsubscribe - once', done => {
      const trigger$ = myScheduler('--a', { a: tLoadArgs }, delayT);
      const load$ = myScheduler('--a', { a: tLoadArgs }, delayT);
      const spy = sbx.spy(() => {});

      const sub = trigger$
        .pipe(loadableRx(new LoadableRx(() => load$)))
        .subscribe({ next: spy });
      sub.unsubscribe();

      after(afterTime, () => {
        expect(spy).to.not.have.been.called;
        done();
      });
    });
    it('(slowtest) no unsubscribe - twice', done => {
      const trigger$ = myScheduler('--a--a', { a: tLoadArgs }, delayT);
      const load$ = myScheduler('--a', { a: tResource }, delayT);
      const spy = sbx.spy(() => {});

      trigger$
        .pipe(
          loadableRx(new LoadableRx(() => load$)),
        )
        .subscribe({ next: spy });

      after(afterTime, () => {
        expect(spy).to.have.been.calledTwice;
        done();
      });
      
    });
    it('(slowtest) unsubscribe - twice', done => {
      const trigger$ = myScheduler('--a--a', { a: tLoadArgs }, delayT);
      const load$ = myScheduler('--a', { a: tResource }, delayT);
      const spy = sbx.spy(() => {});
      
      const sub = trigger$
        .pipe(loadableRx(new LoadableRx(() => load$)))
        .subscribe(spy);
      myScheduler('-----a', {}, delayT)
        .subscribe(() => sub.unsubscribe());

      after(afterTime, () => {
        expect(spy).to.have.been.calledOnce;
        done();
      });
    });
    it('unsubscribe + shareReplay');
  });

});
