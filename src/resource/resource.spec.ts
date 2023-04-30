/* eslint-disable @typescript-eslint/no-empty-function */
import { Resource, ResourceOptions } from '.';
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
import { of } from 'rxjs';

chai.use(sinonChai);
const expect = chai.expect;

logger.logLevel = 3;

describe('Resource', () => {

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
      const p = new Resource(of('a'), () => of('b'));
      expect(p).to.be.ok;
    });
  });

  describe('MULTIPLE_EXECUTIONS_STRATEGY.SWITCH', () => {
    const resourceOptions: ResourceOptions = {
      multiple_executions_strategy:
        MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP,
    };
    it('trigg(--t{--a})', () => scenarios['trigg(--t{--a})']
      .behavior.common(resourceOptions, scheduler));
    it('trigg(--t{--#})', () => scenarios['trigg(--t{--#})']
      .behavior.common(resourceOptions, scheduler));
    it('trigg(-t---t{-a})', () => scenarios['trigg(-t---t{-a})']
      .behavior.common(resourceOptions, scheduler));
    it('trigg(-t---t{-#})', () => scenarios['trigg(-t---t{-#})']
      .behavior.common(resourceOptions, scheduler));
    it('trigg(-t---t{(-#)(-a)})', () => scenarios['trigg(-t---t{(-#)(-a)})']
      .behavior.common(resourceOptions, scheduler));
    it('trigg(-t-t{(---a)(-b)})', () => scenarios['trigg(-t-t{(---a)(-b)})']
      .behavior.switch(resourceOptions, scheduler));
    it('trigg(-t-t{(-----a)(-b)})', () => scenarios['trigg(-t-t{(-----a)(-b)})']
      .behavior.switch(resourceOptions, scheduler));
  });

  describe('MULTIPLE_EXECUTIONS_STRATEGY.ONE_BY_ONE', () => {
    const resourceOptions: ResourceOptions = {
      multiple_executions_strategy:
        MULTIPLE_EXECUTIONS_STRATEGY.ONE_BY_ONE,
    };
    it('trigg(--t{--a})', () => scenarios['trigg(--t{--a})']
      .behavior.common(resourceOptions, scheduler));
    it('trigg(--t{--#})', () => scenarios['trigg(--t{--#})']
      .behavior.common(resourceOptions, scheduler));
    it('trigg(-t---t{-a})', () => scenarios['trigg(-t---t{-a})']
      .behavior.common(resourceOptions, scheduler));
    it('trigg(-t---t{-#})', () => scenarios['trigg(-t---t{-#})']
      .behavior.common(resourceOptions, scheduler));
    it('trigg(-t---t{(-#)(-a)})', () => scenarios['trigg(-t---t{(-#)(-a)})']
      .behavior.common(resourceOptions, scheduler));
    it('trigg(-t-t{(---a)(-b)})', () => scenarios['trigg(-t-t{(---a)(-b)})']
      .behavior.common(resourceOptions, scheduler));
    it('trigg(-t-t{(-----a)(-b)})', () => scenarios['trigg(-t-t{(-----a)(-b)})']
      .behavior.common(resourceOptions, scheduler));
  });

  describe('MULTIPLE_EXECUTIONS_STRATEGY.CONCURRENT', () => {
    const resourceOptions: ResourceOptions = {
      multiple_executions_strategy:
        MULTIPLE_EXECUTIONS_STRATEGY.CONCURRENT,
    };
    it('trigg(--t{--a})', () => scenarios['trigg(--t{--a})']
      .behavior.common(resourceOptions, scheduler));
    it('trigg(--t{--#})', () => scenarios['trigg(--t{--#})']
      .behavior.common(resourceOptions, scheduler));
    it('trigg(-t---t{-a})', () => scenarios['trigg(-t---t{-a})']
      .behavior.common(resourceOptions, scheduler));
    it('trigg(-t---t{-#})', () => scenarios['trigg(-t---t{-#})']
      .behavior.common(resourceOptions, scheduler));
    it('trigg(-t---t{(-#)(-a)})', () => scenarios['trigg(-t---t{(-#)(-a)})']
      .behavior.common(resourceOptions, scheduler));
    it('trigg(-t-t{(---a)(-b)})', () => scenarios['trigg(-t-t{(---a)(-b)})']
      .behavior.concurrent(resourceOptions, scheduler));
    it('trigg(-t-t{(-----a)(-b)})', () => scenarios['trigg(-t-t{(-----a)(-b)})']
      .behavior.concurrent(resourceOptions, scheduler));
  });
});
