import { TestScheduler } from 'rxjs/testing';
import { expect } from 'chai';

export interface TResource {
    id: number,
    text: string,
}

export interface TLoadArgs {
    textContains: string,
}

export function prepareTestScheduler (): TestScheduler {
  return new TestScheduler((actual, expected) => {
    try {
      expect(actual).to.eql(expected);
    } catch (error) {
      throw Error(`
          E: ${drawMarbleFromDefs(expected)}
          A: ${drawMarbleFromDefs(actual)}
          `);
    }
  });
}

function drawMarbleFromDefs (def: any) {
  console.log(def);
  let expectedMarble = '.';
  let expectedFrame = 0;
  def.forEach((ev: any) => {
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
  
function formatEventValue (ev: any): string {
  if (ev.notification.value !== undefined) {
    if (ev.notification.value === null) return '_';
    if (ev.notification.value instanceof Error) return '€';
    return ev.notification.value;
  }
  if (ev.notification.error !== undefined) return '#';
  if (ev.notification.kind === 'C') return '|';
  return 'What is this is should not happen';
}