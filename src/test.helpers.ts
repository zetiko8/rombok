import { TestScheduler } from 'rxjs/testing';
import { from, Observable, of } from 'rxjs';
import { delay, filter, map, concatMap } from 'rxjs';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import { SinonSandbox, SinonSpy } from 'sinon';
import { immediate$ } from './utils';
chai.use(sinonChai);
const expect = chai.expect;

export interface TResource {
  id: number,
  text: string,
}

export interface TLoadArgs {
  textContains: string,
}

export function getSpyWrapper(sinon: SinonSandbox): {
    fn: (args: TLoadArgs) => Observable<any>,
    setFn: (fn: (args: TLoadArgs) => Observable<any>) => void,
    spy: SinonSpy,
  } {
  let fn: (args: TLoadArgs) => Observable<any>;
  const setFn = (fnn: (args: TLoadArgs) => Observable<any>) => {
    fn = fnn;
  };

  const _fn = (args: TLoadArgs) => {
    return fn(args);
  };
  const spy = sinon.spy(_fn);
  return {
    fn: _fn,
    setFn,
    spy,
  }; 
}

export function prepareTestScheduler (): TestScheduler {
  return new TestScheduler((actual, expected) => {
    try {
      expect(actual).to.eql(expected);
    } catch (error) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawMarbleFromDefs (def: MarbleDef[]) {
  logDef(def);
  let expectedMarble = '.';
  let expectedFrame = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  def.forEach((ev) => {
    if (ev.frame === 0) {
      expectedMarble = formatEventValue(ev);  
    }
    else {
      if (ev.frame > expectedFrame) Array.from(new Array(ev.frame - (expectedFrame + 1))).forEach(() => expectedMarble += '.');
      expectedMarble += formatEventValue(ev);
    }
    expectedFrame = ev.frame;
  
  });
  return expectedMarble;
}
  
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatEventValue (ev: MarbleDef): string {
  if (ev.notification.value !== undefined) {
    if (ev.notification.value === null) return '_';
    if (ev.notification.value instanceof Error) return '€';
    return ev.notification.value as string;
  }
  if (ev.notification.error !== undefined) return '#';
  if (ev.notification.kind === 'C') return '|';
  return 'What is this is should not happen';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logDef (def: MarbleDef[]) {
  // let s = '';
  def.forEach(d => {
    console.log(`frame: ${d.frame} - ${d.notification.kind}: ${d.notification.error !== undefined ? d.notification.error : d.notification.value}`);
  });
  console.log('----------------------');
}

export const ignoreErrorSub = { 
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  error() {}, 
};

export class TestError extends Error {
  id = Math.random();
  constructor (message: string) {
    super(message);
  }
}

export function after (time: number, fn: () => void): void {
  immediate$().pipe(delay(time)).subscribe(fn);
}

export function myScheduler<T>(pattern: string, resultSet: { [key: string]: T }, interval: number, debug = ''): Observable<T> {
  return from(pattern).pipe(
    concatMap(item => of(item).pipe ( delay( interval ) )),
    filter(char => {
      const on = char !== '-';
      if ((debug)) {
        if (on) console.log(`(${debug}) ${char} `);
        else console.log(`(${debug}) -`);
      }
      return on;
    }),
    map(char => resultSet[char]),
  );
}