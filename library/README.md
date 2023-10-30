# rombok

Rombok is a library that like Lombok in java, offers less verbose solutions for common rxjs frontend use cases.

## Getting started

```bash
`npm i rombok`
```

```typescript
import { of, delay, BehaviorSubject } from 'rxjs';
import { createMergeProcess } from '../../src/index';

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
```

## Api Reference

### wrapProcess
`CreateProcessFunction`s provide a wrapper around async processes for accessing their data$, inProgress$ and error$ state.

```typescript
import { of } from 'rxjs';
import { createMergeProcess } from '../../src/index';

const { 
    data$, // the resolved value
    inProgress$, // true / false
    error$  // Error / null
}
        // generic <Argument> and <ReturnType> need to be provided
      = createMergeProcess<string, string>(
        wrap => trigger$ // trigger (Observable<Argument>)
          .pipe(
            wrap(
              // a function that returns an Observable<ReturnType>
              (arg) => of('foo'),
              // options <WrapProcessOptions>
              { 
                // share results to different subscribers
                // see rxjs multicasting
                // by default - false
                share: false,
                // invoke subscribers.error function
                // when an error is emitted and terminate the stream.
                // If set to false, the error will be swallowed and
                // the stream will keep emitting on trigger$.next
                // by default - false
                terminateOnError: true,
                // throw any error emitted to global scope
                // (for use in case of global error handling)
                throwErrorToGlobal: false,
              },
            ),
          ));
```
#### Handle multiple request at the same time

Use `createMergeProcess` for handling concurrent requests like `mergeMap` handles them.
Use `createConcatProcess`, `createSwitchProcess` for handling concurrent requests like `concatMap`, `switchMap` accordingly.

```typescript
import { of } from 'rxjs';
import { createMergeProcess, createConcatProcess, createSwitchProcess  } from '../../src/index';

const mergeProcess
      = createMergeProcess<string, string>(
        wrap => trigger$.pipe(wrap((arg) => of('foo'))));
const concatProcess
      = createConcatProcess<string, string>(
        wrap => trigger$.pipe(wrap((arg) => of('foo'))));
const switchProcess
      = createSwitchProcess<string, string>(
        wrap => trigger$.pipe(wrap((arg) => of('foo'))));
```

#### WrapProcessOptions

```typescript
{ 
  // share results to different subscribers
  // see rxjs multicasting
  // by default - false
  share: false,
  // invoke subscribers.error function
  // when an error is emitted and terminate the stream.
  // If set to false, the error will be swallowed and
  // the stream will keep emitting on trigger$.next
  // by default - false
  terminateOnError: true,
  // throw any error emitted to global scope
  // (for use in case of global error handling)
  throwErrorToGlobal: false,
}
```

### Process (@Deprecated)
`Process` is a stream holder, that includes success$, inProgress$ and error$ stream with which the lifecycle of an async process can be described.

```typescript
const process = new Process();

process.execute(() => fromFetch('https://url')).subscribe({
    next: () => {/** some declarative logic (eg. reroute after from submition) */},
    error: () => {/** some declarative error handling (eg. log to console and rethrow to global error reporting)*/}
}));

process.success$.subscribe(data => /** display data */);
process.inProgress$.subscribe(isLoading => /** show/hide loader */);
process.error$.subscribe(errorOrNull => /** show/hide error state */);
```

#### BoundProcess
Is same as process, but the loading function is always the same. With process one can do the following:
```typescript
const process = new Process();
$button1.onclick = () => process.execute(() => fromFetch('url1')).subscribe();
$button2.onclick = () => process.execute(() => fromFetch('url2')).subscribe();
```
With bound process you can reuse the common logic - less code.
```typescript
const process = new BoundProcess(url => fromFetch(url));
$button1.onclick = () => process.execute('url1').subscribe();
$button2.onclick = () => process.execute('url2').subscribe();
```

#### Process options
##### MULTIPLE_EXECUTIONS_STRATEGY
How to deal with multiple calls to execute. See rxjs switchMap, mergeMap, concatMap
By default: `MERGE_MAP`
```typescript
// by default it uses MULTIPLE_EXECUTIONS_STRATEGY.MERGE_MAP
// that is the same as using mergeMap to handle the calls to process.execute()
const mergeProcess = new Process({ 
    multiple_executions_strategy: MULTIPLE_EXECUTIONS_STRATEGY.MERGE_MAP,  
});
process.execute(() => delay(200).pipe(mergeMap(() => of(1)))).subscribe();
process.execute(() => delay(100).pipe(mergeMap(() => of(2)))).subscribe();
// only the second request will resolve, the total execution time is 200 ms

// MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP
// that is the same as using switchMap to handle the calls to process.execute()
const switchProcess = new Process({ 
    multiple_executions_strategy: MULTIPLE_EXECUTIONS_STRATEGY.SWITCH_MAP,  
});
process.execute(() => delay(200).pipe(mergeMap(() => of(1)))).subscribe();
process.execute(() => delay(100).pipe(mergeMap(() => of(2)))).subscribe();
// first the second request will resolve, than the first, the total execution time is 200 ms

// MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP
// that is the same as using mergeMap to handle the calls to process.execute()
const mergeProcess = new Process({ 
    multiple_executions_strategy: MULTIPLE_EXECUTIONS_STRATEGY.CONCAT_MAP,  
});
process.execute(() => delay(200).pipe(mergeMap(() => of(1)))).subscribe();
process.execute(() => delay(100).pipe(mergeMap(() => of(2)))).subscribe();
// first the first request will resolve, than the second, the total execution time is 300 ms
```

The same options apply to BoundProcess.

## Development

Clone and `npm install`

### Test

`npm run test`

### Build

`npm run build`

Bundle in `/library/dist`
