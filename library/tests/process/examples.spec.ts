import { of, BehaviorSubject } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { createMergeProcess } from '../../src/index';
import { TestScheduler } from 'rxjs/testing';
import { SinonSandbox, createSandbox } from 'sinon';
import { nTimes, prepareTestScheduler } from '../test.helpers';

const readableDelayed = (
  originalDelay: number, value: string): string => {
  let p = '';
  nTimes(originalDelay, () => p += '-');
  p += value;
  return p;
};

describe('Documentation examples', () => {
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


  it('Getting started', () => {
    /** not included */
    scheduler.run(({ expectObservable }) => {

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const $nextPageButton = { onclick: () => {} };

      /** included */
      //   import { of, delay, BehaviorSubject } from 'rxjs';
      //   import { createMergeProcess } from '../../src/index';

      const loadTableData
        = (page: number) => of({ foo: 'bar', page }).pipe(delay(1000));

      const paging$ = new BehaviorSubject(1);
      const { data$, inProgress$, error$ }
            = createMergeProcess<number, { foo: string, page: number }>(
              wrap => paging$
                .pipe(
                  wrap(
                    (page) => loadTableData(page),
                    { share: true, terminateOnError: false },
                  ),
                ));

      $nextPageButton.onclick = () => paging$.next(paging$.value + 1);

      data$.subscribe(data => {/** display data */});
      inProgress$.subscribe(isLoading => {/** show/hide loader */});
      error$.subscribe(errorOrNull => {/** show/hide error state */});

      /** not included */
      expectObservable(
        data$.pipe(map(d => d.page)))
        .toBe(readableDelayed(1000, '1'));
      expectObservable(inProgress$)
        .toBe('t' + readableDelayed(999, 'f'), { t: true, f: false });
      expectObservable(error$)
        .toBe('n', { n: null });
    });
  });
});