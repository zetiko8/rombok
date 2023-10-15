import { TestScheduler } from 'rxjs/testing';
import {
  EMPTY,
  merge,
  Observable,
  of,
  OperatorFunction,
  pipe,
  throwError,
} from 'rxjs';
import { tap, catchError, finalize, map, take } from 'rxjs/operators';
import * as chai from 'chai';
import { SinonSandbox, SinonSpy } from 'sinon';
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable';
import { CreateProcessFunction, Process } from '../src/index';
const expect = chai.expect;

export interface NormalTestReturns {
  processFn: SinonSpy<[value: string], Observable<string>>,
  success$: Observable<string>,
}

export const getNormalTestReturns = (
  sbx: SinonSandbox,
  operator: MultipleExecutionsStrategyOperator<string, string>,
  getProccesFn: () => (value: string) => Observable<string>,
  triggers: Observable<string>[],
): NormalTestReturns => {

  const spyWrapper
  = spy(sbx, getProccesFn());

  const normalData$ = merge(...triggers)
    .pipe(
      operator(
        (arg) => spyWrapper
          .fn(arg)
          .pipe(
            catchError(() => EMPTY),
          ),
      ),
    );

  return {
    processFn: spyWrapper.spy,
    success$: normalData$,
  };
};

export interface ProcessorTestReturns {
  processFn: SinonSpy<[value: string], Observable<string>>,
  success$: Observable<string>,
  inProgress$: Observable<boolean>,
  error$: Observable<Error | null>,
}

export const getProcessorTestReturns = (
  sbx: SinonSandbox,
  createProcessFunction: CreateProcessFunction<string, string>,
  getProccesFn: () => (value: string) => Observable<string>,
  triggers: Observable<string>[],
): ProcessorTestReturns => {
  const spyWrapper
    = spy(sbx, getProccesFn());

  const proccesor = createProcessFunction(
    wrap => merge(...triggers)
      .pipe(
        wrap(
          (arg) => spyWrapper.fn(arg),
        ),
      ),
  );

  return {
    success$: proccesor.data$,
    inProgress$: proccesor.inProgress$,
    error$: proccesor.error$,
    processFn: spyWrapper.spy,
  };
};

export const getProcessTestReturns = (
  sbx: SinonSandbox,
  process: Process<string>,
  getProcessFn: () => (value: string) => Observable<string>,
  triggers: Observable<string>[],
): {
  processFn: SinonSpy<[value: string], Observable<string>>
} => {
  const spyWrapper = spy(sbx, getProcessFn());
  function onWrite (value: string) {
    process.execute(
      () => spyWrapper.fn(value))
      .subscribe(ignoreErrorSub);
  }

  // user writes
  triggers.forEach(t => t.subscribe(onWrite));

  return {
    processFn: spyWrapper.spy,
  };
};

export const debugTicks = (
  cold: ColdCreator,
  numberOfTicks = 15,
): void => {
  let lines = '-';
  for (let i = 0; i < numberOfTicks; i++) {
    cold(lines + 't')
      .subscribe(
        // eslint-disable-next-line no-console
        () => console.log('_____'),
      );
    lines += '-';
  }
};
export interface MultipleExecutionsStrategyOperator<T, R> {
  (
    project: (
      value: T, index: number
    ) => Observable<R>): OperatorFunction<T, R>
}

export type TestScenarioReturn = {
  processLegacy: {
    processFn: SinonSpy<[value: string], Observable<string>>,
  },
  wrapProcess: ProcessorTestReturns,
  normalOperator: NormalTestReturns,
  error: TestError,
  after: Observable<void>
}

export const logger = {
  logLevel: 0,
  debug (...args: unknown[]): void {
    // eslint-disable-next-line no-console
    if (this.logLevel > 3) console.log(...args);
  },
  log (...args: unknown[]): void {
    // eslint-disable-next-line no-console
    if (this.logLevel > 2) console.log(...args);
  },
  warn (...args: unknown[]): void {
    // eslint-disable-next-line no-console
    if (this.logLevel > 1) console.log(...args);
  },
  error (...args: unknown[]): void {
    // eslint-disable-next-line no-console
    if (this.logLevel > 0) console.log(...args);
  },
};

export const values = {
  t: true, f: false, a: 'a', b: 'b', c: 'c', n: null, v: 'v',
  w: 'w',
  o: 'o', p: 'p', r: 'r', s: 's', u: 'u',
};

export type ColdCreator = <T = string>(marbles: string, values?: {
  [marble: string]: T;
} | undefined, error?: unknown) => ColdObservable<T>;

export function fakeApiCall<T> (
  source$: Observable<T>,
): Observable<T> {
  return source$.pipe(take(1));
}

export function spy<T>(
  sinon: SinonSandbox,
  fn: T,
): {
  spy: T extends (...args: infer TArgs)
    => infer TReturnValue ? SinonSpy<TArgs, TReturnValue>
    : SinonSpy<unknown[], unknown>;
  fn: T;
} {
  const wrapper = {
    fn,
  };
  return {
    spy: sinon.spy(wrapper, 'fn'),
    fn: wrapper.fn,
  };
}

export function assertCallCount (
  spy: SinonSpy,
  callCount: number,
): void {
  expect(spy.callCount)
    .to.equal(callCount, 'Expected call count');
}

function getNumberOfSyncGroupings (
  expected: unknown,
) {

  const e = expected as { frame: number }[];
  const dict: Record<number, number> = {};
  e.forEach(u => {
    if (!dict[u.frame]) {
      dict[u.frame] = 0;
    }
    dict[u.frame]++;
  });

  return dict;
}

export function prepareTestScheduler (): TestScheduler {
  return new TestScheduler((actual, expected) => {
    try {
      try {
        expect(actual).to.eql(expected);
      } catch (error) {
        const dictOfSyncGroupings = getNumberOfSyncGroupings(expected);

        Object.entries(dictOfSyncGroupings)
          .forEach(([key, val]) => {
            if (val > 1) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              expected.forEach((frameDef: any) => {
                if (frameDef.frame > Number(key)) {
                  frameDef.frame -= (val + 1);
                }
              });
            }
          });

        // console.log(expected);
        expect(actual).to.eql(expected);
      }
    } catch (error) {

      // eslint-disable-next-line no-console
      // console.log(expected);
      // eslint-disable-next-line no-console
      // console.log(actual);
      const e = Error(`E: ${drawMarbleFromDefs(expected)}
     A: ${drawMarbleFromDefs(actual)}`);
      e.stack = '';
      throw e;
    }
  });
}

interface MarbleDef {
  frame: number,
  notification: { kind: 'N'|'C'|'E', value: unknown, error: Error | undefined }
}

function drawMarbleFromDefs (def: MarbleDef[]) {
  logDef(def);
  let expectedMarble = '.';
  let expectedFrame = 0;
  let isDrawingGroup = false;
  def.forEach((ev, index) => {
    let addOpeningParenthesis = false;
    let addClosingParenthesis = false;
    const next = (def.length - 1) === index ? null : def[index + 1];
    if (next === null && isDrawingGroup)
      addClosingParenthesis = true;

    if (
      !isDrawingGroup
      && next !== null
      && next.frame === ev.frame
    ) {
      isDrawingGroup = true;
      addOpeningParenthesis = true;
    }

    if (
      next !== null
      && next.frame !== ev.frame
    ) {
      if (isDrawingGroup) addClosingParenthesis = true;
      isDrawingGroup = false;
    }

    if (ev.frame === 0) {
      if (isDrawingGroup || addClosingParenthesis) {
        if (addOpeningParenthesis) {
          expectedMarble = '(';
        }
        expectedMarble += formatEventValue(ev);
      }
      else {
        expectedMarble = formatEventValue(ev);
      }
    }
    else {
      if (ev.frame > expectedFrame) {
        Array.from(
          new Array(ev.frame - (expectedFrame + 1)),
        ).forEach(() => expectedMarble += '.');
      }
      if (addOpeningParenthesis) expectedMarble += '(';
      expectedMarble += formatEventValue(ev);
    }
    expectedFrame = ev.frame;

    if (addClosingParenthesis) expectedMarble += ')';

  });

  return expectedMarble;
}

function formatEventValue (ev: MarbleDef): string {
  if (ev.notification.value !== undefined) {
    if (ev.notification.value === true) return 't';
    if (ev.notification.value === false) return 'f';
    if (ev.notification.value === null) return '_';
    if (ev.notification.value instanceof Error) return '€';
    return ev.notification.value as string;
  }
  if (ev.notification.error !== undefined) return '#';
  if (ev.notification.kind === 'C') return '|';

  return 'What is this is should not happen';
}

function logDef (def: MarbleDef[]) {
  // let s = '';
  def.forEach(d => {
    // eslint-disable-next-line no-console
    console.log(`frame: ${d.frame} - ${d.notification.kind}: ${d.notification.error !== undefined ? d.notification.error : d.notification.value}`);
  });
  // eslint-disable-next-line no-console
  console.log('----------------------');
}

export const ignoreErrorSub = {
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/explicit-module-boundary-types
  error() {},
};

export class TestError extends Error {
  id = Math.random();
  constructor (message: string) {
    super(message);
  }
}

/**
 * Creates an observable that will fire
 * after all the other observables are finished
 */
export function createAfter$ (
  cold: ColdCreator,
): Observable<undefined> {
  /**
   * The implementation is dumb
   *  - just make an observable that fires really late
   */
  return cold('-------------------------1')
    .pipe(map(() => undefined));
}

export function log<T>(
  sourceName: string, prop: string | null = null):
OperatorFunction<T, T> {
  return pipe(
    tap(value => {
      if (prop === null)
        // eslint-disable-next-line no-console
        console.log(sourceName, value);
      else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj = value as { [key: string]: any };
        try {
          // eslint-disable-next-line no-console
          console.log(sourceName, obj[prop]);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(sourceName, value);
        }
      }
    }),
    catchError(error => {
      // eslint-disable-next-line no-console
      console.log(sourceName, 'ERROR', error.message);
      return throwError(error);
    }),
    // eslint-disable-next-line no-console
    finalize(() => console.log(sourceName, 'COMPLETED')),
  );
}

export const immediate$
 = (): Observable<string> => of('immediate');