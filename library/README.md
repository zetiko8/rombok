# rombok

Rombok is a library that like Lombok in java, offers less verbose solutions for common rxjs frontend use cases.

## Getting started

```bash
`npm i rombok`
```

## Api reference
### AsyncProcess
`AsyncProcess` is a wrapper around an asynchronous observable, that includes data$, inProgress$ and error$ stream with which the lifecycle of an async process can be described.

```typescript
import { AsyncProcess } from 'rombok';

const asyncProcess = new AsyncProcess(endpoint => fromFetch('https://url/' + endpoint));

$button.onclick = () => asyncProcess.execute('todos').subscribe({
    next: () => {/** some declarative logic */},
    error: () => {/** some declarative error handling  */},
});

asyncProcess.data$.subscribe(data => /** display data */);
asyncProcess.inProgress$.subscribe(isLoading => /** show/hide loader */);
asyncProcess.error$.subscribe(errorOrNull => /** show/hide error state */);
```

#### AsyncProcess.share
`AsyncProcess.share` is same as `AsyncProcess.execute` but the returned observable
is shared preventing duplicated api calls.

```typescript
import { AsyncProcess } from 'rombok';

const asyncProcess = new AsyncProcess(
    endpoint => fromFetch('https://url/' + endpoint));

const shared$ = asyncProcess.share('todos')

shared$.subscribe(data => /** display data in one part of GUI */);
shared$.subscribe(data => /** display data in another part of GUI */);
```

#### AsyncProcess.(static)on
`AsyncProcess.on` returns an `AsyncProcessLike` that is triggered by the given `trigger$` observable.

```typescript
import { AsyncProcess } from 'rombok';
import { Subject } from 'rxjs';

const trigger$ = new Subject<string>();
const asyncProcess = new AsyncProcess.on(
    trigger$,
    endpoint => fromFetch('https://url/' + endpoint),
);

const shared$ = asyncProcess.share('todos')

shared$.subscribe(data => /** display data in GUI */);
```

### Process (@Deprecated)
`Process` is a stream holder, that includes success$, inProgress$ and error$ stream with which the lifecycle of an async process can be described.

```typescript
import { Process } from 'rombok';

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
import { Process } from 'rombok';

const process = new Process();
$button1.onclick = () => process.execute(() => fromFetch('url1')).subscribe();
$button2.onclick = () => process.execute(() => fromFetch('url2')).subscribe();
```
With bound process you can reuse the common logic - less code.
```typescript
import { BoundProcess } from 'rombok';

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
