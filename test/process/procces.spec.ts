// /* eslint-disable @typescript-eslint/no-empty-function */
// import { Process } from '../../src';
// import { MULTIPLE_EXECUTIONS_STRATEGY } from '../../src/loading-handling';
// import { TestScheduler } from 'rxjs/testing';
// import * as chai from 'chai';
// import { createSandbox, SinonSandbox } from 'sinon';
// import * as sinonChai from 'sinon-chai';
// import { prepareTestScheduler } from '../test.helpers';
// import { scenarios } from './scenarios';

// chai.use(sinonChai);
// const expect = chai.expect;

// describe('Process', () => {

//   let scheduler: TestScheduler;
//   let sbx: SinonSandbox;
//   beforeEach(() => {
//     scheduler = prepareTestScheduler();
//     sbx = createSandbox();
//   });
//   afterEach(() => {
//     scheduler = prepareTestScheduler();
//     sbx.restore();
//   });

//   describe('smoke', () => {
//     it('should not smoke', () => {
//       const p = new Process();
//       expect(p).to.be.ok;
//     });
//   });

//   describe('MULTIPLE_EXECUTIONS_STRATEGY.ONE_BY_ONE', () => {
//     const createProcess
//       = () => new Process<any>() as any;
//     it('--a', () => scenarios['--a']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(--a)', () => scenarios['--exec(--a)']
//       .behavior.common(createProcess, scheduler));
//     it('--#', () => scenarios['--#']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(--#)', () => scenarios['--exec(--#)']
//       .behavior.common(createProcess, scheduler));
//     it('sync((--a)(--b))', () => scenarios['sync((--a)(--b))']
//       .behavior.common(createProcess, scheduler));
//     it('sync((--#)(--b))', () => scenarios['sync((--#)(--b))']
//       .behavior.common(createProcess, scheduler));
//     it('sync((--a)(--#))', () => scenarios['sync((--a)(--#))']
//       .behavior.common(createProcess, scheduler));
//     it('sync((-a)(--b))', () => scenarios['sync((-a)(--b))']
//       .behavior.common(createProcess, scheduler));
//     it('sync((-#)(--b))', () => scenarios['sync((-#)(--b))']
//       .behavior.common(createProcess, scheduler));
//     it('sync((--a)(-b))', () => scenarios['sync((--a)(-b))']
//       .behavior.common(createProcess, scheduler));
//     it('sync((--#)(-b))', () => scenarios['sync((--#)(-b))']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(--a)-----exec(--b)', () => scenarios['--exec(--a)-----exec(--b)']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(----a)----exec(--b)', () => scenarios['--exec(----a)----exec(--b)']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(------a)----exec(--b)', () => scenarios['--exec(------a)----exec(--b)']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(--#)-----exec(--b)', () => scenarios['--exec(--#)-----exec(--b)']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(----#)----exec(--b)', () => scenarios['--exec(----#)----exec(--b)']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(------#)----exec(--b)', () => scenarios['--exec(------#)----exec(--b)']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(--a)-----exec(--#)', () => scenarios['--exec(--a)-----exec(--#)']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(----a)----exec(--#)', () => scenarios['--exec(----a)----exec(--#)']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(------a)----exec(--#)', () => scenarios['--exec(------a)----exec(--#)']
//       .behavior.common(createProcess, scheduler));
//     // TODO - shareReplay tests for other strategies
//     it('shareReplay - success as an event',
//       () => scenarios['shareReplay - success as an event']
//         .behavior.common(createProcess, scheduler));
//     it('shareReplay - error as state',
//       () => scenarios['shareReplay - error as state']
//         .behavior.common(createProcess, scheduler));
//     it('shareReplay - loading as state',
//       () => scenarios['shareReplay - loading as state']
//         .behavior.common(createProcess, scheduler));
//     it('memoryLeak',
//       () => scenarios['memoryLeak']
//         .behavior.common(createProcess, scheduler));
//   });
//   describe('MULTIPLE_EXECUTIONS_STRATEGY.CONCURRENT', () => {
//     const createProcess
//       = () => new Process({
//         multipleExecutionsStrategy: MULTIPLE_EXECUTIONS_STRATEGY
//           .CONCURRENT,
//       }) as any;
//     it('--a', () => scenarios['--a']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(--a)', () => scenarios['--exec(--a)']
//       .behavior.common(createProcess, scheduler));
//     it('--#', () => scenarios['--#']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(--#)', () => scenarios['--exec(--#)']
//       .behavior.common(createProcess, scheduler));
//     it('sync((--a)(--b))', () => scenarios['sync((--a)(--b))']
//       .behavior.concurrent(createProcess, scheduler));
//     it('sync((--#)(--b))', () => scenarios['sync((--#)(--b))']
//       .behavior.concurrent(createProcess, scheduler));
//     it('sync((--a)(--#))', () => scenarios['sync((--a)(--#))']
//       .behavior.concurrent(createProcess, scheduler));
//     it('sync((-a)(--b))', () => scenarios['sync((-a)(--b))']
//       .behavior.concurrent(createProcess, scheduler));
//     it('sync((-#)(--b))', () => scenarios['sync((-#)(--b))']
//       .behavior.concurrent(createProcess, scheduler));
//     it('sync((--a)(-b))', () => scenarios['sync((--a)(-b))']
//       .behavior.concurrent(createProcess, scheduler));
//     it('sync((--#)(-b))', () => scenarios['sync((--#)(-b))']
//       .behavior.concurrent(createProcess, scheduler));
//     it('--exec(--a)-----exec(--b)', () => scenarios['--exec(--a)-----exec(--b)']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(----a)----exec(--b)', () => scenarios['--exec(----a)----exec(--b)']
//       .behavior.concurrent(createProcess, scheduler));
//     it('--exec(------a)----exec(--b)', () => scenarios['--exec(------a)----exec(--b)']
//       .behavior.concurrent(createProcess, scheduler));
//     it('--exec(--#)-----exec(--b)', () => scenarios['--exec(--#)-----exec(--b)']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(----#)----exec(--b)', () => scenarios['--exec(----#)----exec(--b)']
//       .behavior.concurrent(createProcess, scheduler));
//     it('--exec(------#)----exec(--b)', () => scenarios['--exec(------#)----exec(--b)']
//       .behavior.concurrent(createProcess, scheduler));
//     it('--exec(--a)-----exec(--#)', () => scenarios['--exec(--a)-----exec(--#)']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(----a)----exec(--#)', () => scenarios['--exec(----a)----exec(--#)']
//       .behavior.concurrent(createProcess, scheduler));
//     it('--exec(------a)----exec(--#)', () => scenarios['--exec(------a)----exec(--#)']
//       .behavior.concurrent(createProcess, scheduler));
//   });
//   describe('MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP', () => {
//     const createProcess
//       = () => new Process({
//         multipleExecutionsStrategy: MULTIPLE_EXECUTIONS_STRATEGY
//           .SWITCH_MAP,
//       }) as any;
//     it('--a', () => scenarios['--a']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(--a)', () => scenarios['--exec(--a)']
//       .behavior.common(createProcess, scheduler));
//     it('--#', () => scenarios['--#']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(--#)', () => scenarios['--exec(--#)']
//       .behavior.common(createProcess, scheduler));
//     it('sync((--a)(--b))', () => scenarios['sync((--a)(--b))']
//       .behavior.switch(createProcess, scheduler));
//     it('sync((--#)(--b))', () => scenarios['sync((--#)(--b))']
//       .behavior.concurrent(createProcess, scheduler));
//     it('sync((--a)(--#))', () => scenarios['sync((--a)(--#))']
//       .behavior.switch(createProcess, scheduler));
//     it('sync((-a)(--b))', () => scenarios['sync((-a)(--b))']
//       .behavior.switch(createProcess, scheduler));
//     it('sync((-#)(--b))', () => scenarios['sync((-#)(--b))']
//       .behavior.concurrent(createProcess, scheduler));
//     it('sync((--a)(-b))', () => scenarios['sync((--a)(-b))']
//       .behavior.switch(createProcess, scheduler));
//     it('sync((--#)(-b))', () => scenarios['sync((--#)(-b))']
//       .behavior.concurrent(createProcess, scheduler));
//     it('--exec(--a)-----exec(--b)', () => scenarios['--exec(--a)-----exec(--b)']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(----a)----exec(--b)', () => scenarios['--exec(----a)----exec(--b)']
//       .behavior.switch(createProcess, scheduler));
//     it('--exec(------a)----exec(--b)', () => scenarios['--exec(------a)----exec(--b)']
//       .behavior.switch(createProcess, scheduler));
//     it('--exec(--#)-----exec(--b)', () => scenarios['--exec(--#)-----exec(--b)']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(----#)----exec(--b)', () => scenarios['--exec(----#)----exec(--b)']
//       .behavior.concurrent(createProcess, scheduler));
//     it('--exec(------#)----exec(--b)', () => scenarios['--exec(------#)----exec(--b)']
//       .behavior.concurrent(createProcess, scheduler));
//     it('--exec(--a)-----exec(--#)', () => scenarios['--exec(--a)-----exec(--#)']
//       .behavior.common(createProcess, scheduler));
//     it('--exec(----a)----exec(--#)', () => scenarios['--exec(----a)----exec(--#)']
//       .behavior.switch(createProcess, scheduler));
//     it('--exec(------a)----exec(--#)', () => scenarios['--exec(------a)----exec(--#)']
//       .behavior.switch(createProcess, scheduler));
//   });
// });
