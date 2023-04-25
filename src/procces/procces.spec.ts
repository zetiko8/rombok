/* eslint-disable @typescript-eslint/no-empty-function */
import { Process } from '..';
import { MULTIPLE_EXECUTIONS_STRATEGY } from '../loading-handling';
import { TestScheduler } from 'rxjs/testing';
import * as chai from 'chai';
import { createSandbox, SinonSandbox } from 'sinon';
import * as sinonChai from 'sinon-chai';
import { prepareTestScheduler } from '../test.helpers';
import { logger } from '../debug-helpers';
import { scenarios } from './test/scenarios';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { log } from '../utils';

chai.use(sinonChai);
const expect = chai.expect;

logger.logLevel = 3;

describe('Process', () => {

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

  describe('smoke', () => {
    it('should not smoke', () => {
      const p = new Process();
      expect(p).to.be.ok;
    });
  });

  describe('MULTIPLE_EXECUTIONS_STRATEGY.ONE_BY_ONE', () => {
    const createProcess
      = () => new Process<any>();
    it('--a', () => scenarios['--a']
      .behavior.common(createProcess, scheduler));
    it('--exec(--a)', () => scenarios['--exec(--a)']
      .behavior.common(createProcess, scheduler));
    it('--#', () => scenarios['--#']
      .behavior.common(createProcess, scheduler));
    it('--exec(--#)', () => scenarios['--exec(--#)']
      .behavior.common(createProcess, scheduler));
    it('sync((--a)(--b))', () => scenarios['sync((--a)(--b))']
      .behavior.common(createProcess, scheduler));
    it('sync((--#)(--b))', () => scenarios['sync((--#)(--b))']
      .behavior.common(createProcess, scheduler));
    it('sync((--a)(--#))', () => scenarios['sync((--a)(--#))']
      .behavior.common(createProcess, scheduler));
    it('sync((-a)(--b))', () => scenarios['sync((-a)(--b))']
      .behavior.common(createProcess, scheduler));
    it('sync((-#)(--b))', () => scenarios['sync((-#)(--b))']
      .behavior.common(createProcess, scheduler));
    it('sync((--a)(-b))', () => scenarios['sync((--a)(-b))']
      .behavior.common(createProcess, scheduler));
    it('sync((--#)(-b))', () => scenarios['sync((--#)(-b))']
      .behavior.common(createProcess, scheduler));
    it('--exec(--a)-----exec(--b)', () => scenarios['--exec(--a)-----exec(--b)']
      .behavior.common(createProcess, scheduler));
    it('--exec(----a)----exec(--b)', () => scenarios['--exec(----a)----exec(--b)']
      .behavior.common(createProcess, scheduler));
    it('--exec(------a)----exec(--b)', () => scenarios['--exec(------a)----exec(--b)']
      .behavior.common(createProcess, scheduler));
    it('--exec(--#)-----exec(--b)', () => scenarios['--exec(--#)-----exec(--b)']
      .behavior.common(createProcess, scheduler));
    it('--exec(----#)----exec(--b)', () => scenarios['--exec(----#)----exec(--b)']
      .behavior.common(createProcess, scheduler));
    it('--exec(------#)----exec(--b)', () => scenarios['--exec(------#)----exec(--b)']
      .behavior.common(createProcess, scheduler));
    it('--exec(--a)-----exec(--#)', () => scenarios['--exec(--a)-----exec(--#)']
      .behavior.common(createProcess, scheduler));
    it('--exec(----a)----exec(--#)', () => scenarios['--exec(----a)----exec(--#)']
      .behavior.common(createProcess, scheduler));
    it('--exec(------a)----exec(--#)', () => scenarios['--exec(------a)----exec(--#)']
      .behavior.common(createProcess, scheduler));
  });
  describe('MULTIPLE_EXECUTIONS_STRATEGY.CONCURRENT', () => {
    const createProcess
      = () => new Process<any>({
        multipleExecutionsStrategy: MULTIPLE_EXECUTIONS_STRATEGY
          .CONCURRENT,
      });
    it('--a', () => scenarios['--a']
      .behavior.common(createProcess, scheduler));
    it('--exec(--a)', () => scenarios['--exec(--a)']
      .behavior.common(createProcess, scheduler));
    it('--#', () => scenarios['--#']
      .behavior.common(createProcess, scheduler));
    it('--exec(--#)', () => scenarios['--exec(--#)']
      .behavior.common(createProcess, scheduler));
    it('sync((--a)(--b))', () => scenarios['sync((--a)(--b))']
      .behavior.concurrent(createProcess, scheduler));
    it('sync((--#)(--b))', () => scenarios['sync((--#)(--b))']
      .behavior.concurrent(createProcess, scheduler));
    it('sync((--a)(--#))', () => scenarios['sync((--a)(--#))']
      .behavior.concurrent(createProcess, scheduler));
    it('sync((-a)(--b))', () => scenarios['sync((-a)(--b))']
      .behavior.concurrent(createProcess, scheduler));
    it('sync((-#)(--b))', () => scenarios['sync((-#)(--b))']
      .behavior.concurrent(createProcess, scheduler));
    it('sync((--a)(-b))', () => scenarios['sync((--a)(-b))']
      .behavior.concurrent(createProcess, scheduler));
    it('sync((--#)(-b))', () => scenarios['sync((--#)(-b))']
      .behavior.concurrent(createProcess, scheduler));
    it('--exec(--a)-----exec(--b)', () => scenarios['--exec(--a)-----exec(--b)']
      .behavior.common(createProcess, scheduler));
    it('--exec(----a)----exec(--b)', () => scenarios['--exec(----a)----exec(--b)']
      .behavior.concurrent(createProcess, scheduler));
    it('--exec(------a)----exec(--b)', () => scenarios['--exec(------a)----exec(--b)']
      .behavior.concurrent(createProcess, scheduler));
    it('--exec(--#)-----exec(--b)', () => scenarios['--exec(--#)-----exec(--b)']
      .behavior.common(createProcess, scheduler));
    it('--exec(----#)----exec(--b)', () => scenarios['--exec(----#)----exec(--b)']
      .behavior.concurrent(createProcess, scheduler));
    it('--exec(------#)----exec(--b)', () => scenarios['--exec(------#)----exec(--b)']
      .behavior.concurrent(createProcess, scheduler));
    it('--exec(--a)-----exec(--#)', () => scenarios['--exec(--a)-----exec(--#)']
      .behavior.common(createProcess, scheduler));
    it('--exec(----a)----exec(--#)', () => scenarios['--exec(----a)----exec(--#)']
      .behavior.concurrent(createProcess, scheduler));
    it('--exec(------a)----exec(--#)', () => scenarios['--exec(------a)----exec(--#)']
      .behavior.concurrent(createProcess, scheduler));
  });
});
