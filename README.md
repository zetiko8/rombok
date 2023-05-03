# rombok

## Getting started

`npm i rombok`

```typescript
import { Process } from 'rombok';

const myProcess = new Process();

$button.onclick = () => myProcess.execute(() => loadData());

myProcess.data$.subscribe(data => /** display data */);
myProcess.inProcess$.subscribe(isLoading => /** show/hide loader */);
myProcess.error$.subscribe(errorOrNull => /** show/hide error state */);
```

## Why

Rombok is a library that like Lombok in java, offers less verbose solutions for common rxjs frontend use cases.
It focuses on solving three problems, that every responsible frontend developer needs to take into account.

### Loading

An observable stream is most often some async operation. While the async operation is being performed the user needs to be made aware of that via some kind of loading indicator.

There are many solutions already on the web but they often neglect the repeatability of something being loaded (for example when the user is paging a table, the loading indicator needs to appear every time, not just on the first page load)

The normal code to achieve this is something like:

```typescript
const inProcess$ = new BehaviorSubject(false);

const tableData$ = pagingData$
    .pipe(
        tap(() => inProcess$.next(true)),
        switchMap((pagingData) => callApi(pagingData)),
        catchError(() => {
            inProcess$.next(false);
            return EMPTY;
        }),
        tap(() => inProcess$.next(false)),
    );

tableData$.subscribe(data => /** display data */);
inProcess$.subscribe(isLoading => /** show/hide loader */);
```
One can see, that the only actual piece of business logic is the callApi part, everything else is just boilerplate code that needs to be repeated any time we have a stream of resource being loaded.

With rombok it is shortened to
```typescript
const tableDataProcess
    = new BoundProcess((pagingData) => callApi(pagingData));

pagingData$.subscribe(
    pagingData => tableDataProcess.execute(pagingData).subscribe());

tableDataProcess.success$.subscribe(data => /** display data */);
tableDataProcess.inProcess$.subscribe(isLoading => /** show/hide loader */);
```

### Error Handling

#### Non terminating streams
The problem with error handling in rxjs is, that the stream terminates as soon as an error is thrown. This is normally not a desired thing in frontend programming, where there are numerous
ways to recover from an error and keep the application running.
There are many, more or less complicated ways to prevent the termination and enable repeatability. Again they include a lot of boilerplate.
Example:

```typescript
const error$ = new BehaviorSubject(null);

const tableData$ = pagingData$
    .pipe(
        tap(() => error$.next(null)),
        switchMap((pagingData) => 
            callApi(pagingData)
            .pipe(
                // the catch error needs to be declared in the inner stream,
                // so that it does not terminate the outer one
                catchError(error => {
                    error$.next(error);
                    return EMPTY;
                }),
            )
        ),
        tap(() => error$.next(null)),
    );

tableData$.subscribe(data => /** display data */);
inProcess$.subscribe(errorOrNull => /** show/hide error state */);
```

With rombok it is shortened to
```typescript
const tableDataProcess
    = new BoundProcess((pagingData) => callApi(pagingData));

pagingData$.subscribe(
    pagingData => tableDataProcess.execute(pagingData).subscribe());

tableDataProcess.success$.subscribe(data => /** display data */);
tableDataProcess.error$.subscribe(errorOrNull => /** show/hide error state */);
```

#### Error reporting
The best way to handle errors is the following. Throw error wherever and always bubble it to the surface. The error needs to be handled in two ways. 1. Presentational - display the error to the user (handle it in the specific context i an way that is meaningful to the error), and 2. Reporting - catch the error globally and notify the error reporter.
That is why the `Process` in rombok separates error handling two two places. One place, has error as the state of application, and such an error can be displayed to the user - this is the `process.error$` stream,
the second place actually rethrows the error, so that it can be caught in the global scale. This is the subscriber of `process.execute(loadFn).subscribe`.

TODO - angular async pipes

### All the boiler plate code

```typescript
const error$ = new BehaviorSubject(null);
const inProcess$ = new BehaviorSubject(false);

const tableData$ = pagingData$
    .pipe(
        tap(() => {
            error$.next(null);
            inProcess$.next(true);
        ),
        switchMap((pagingData) => 
            callApi(pagingData)
            .pipe(
                catchError(error => {
                    error$.next(error);
                    inProcess$.next(false);
                    return EMPTY;
                }),
            )
        ),
        tap(() => {
            error$.next(null);
            inProcess$.next(false);
        ),
    );

tableData$.subscribe(data => /** display data */);
tableDataProcess.inProcess$.subscribe(isLoading => /** show/hide loader */);
inProcess$.subscribe(errorOrNull => /** show/hide error state */);
```

All this code needs to be repeated so many time in a typical app.
Every time it's repeated it can be repeated wrongly.

In rombok
```typescript
const tableDataProcess
    = new BoundProcess((pagingData) => callApi(pagingData));

pagingData$.subscribe(
    pagingData => tableDataProcess.execute(pagingData).subscribe(/**
        the error here is re-thrown if not handled
    */));

tableDataProcess.success$.subscribe(data => /** display data */);
tableDataProcess.inProcess$.subscribe(isLoading => /** show/hide loader */);
tableDataProcess.error$.subscribe(errorOrNull => /** show/hide error state */);
```

## Api Reference

### Process
`Process` is the main building block of rombok. It's a stream holder, that includes data$, inProgress$ and error$ stream with which the lifecycle of an async process can be described.

```typescript
const process = new Process();

process.execute(() => fromFetch('https://url')).subscribe({
    next: () => {/** some declarative logic (eg. reroute after from submition) */},
    error: () => {/** some declarative error handling (eg. log to console and rethrow to global error reporting)*/}
}));

process.data$.subscribe(data => /** display data */);
process.inProcess$.subscribe(isLoading => /** show/hide loader */);
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
By default: `SWITCH`
```typescript
// by default it uses MULTIPLE_EXECUTIONS_STRATEGY.SWITCH
// that is the same as using switchMap to handle the calls to process.execute()
const switchProcess = new Process();
process.execute(() => delay(200).pipe(mergeMap(() => of(1)))).subscribe();
process.execute(() => delay(100).pipe(mergeMap(() => of(2)))).subscribe();
// only the second request will resolve, the total execution time is 200 ms

// MULTIPLE_EXECUTIONS_STRATEGY.MERGE
// that is the same as using mergeMap to handle the calls to process.execute()
const mergeProcess = new Process({ 
    multiple_executions_strategy: MULTIPLE_EXECUTIONS_STRATEGY.MERGE,  
});
process.execute(() => delay(200).pipe(mergeMap(() => of(1)))).subscribe();
process.execute(() => delay(100).pipe(mergeMap(() => of(2)))).subscribe();
// first the second request will resolve, than the first, the total execution time is 200 ms

// MULTIPLE_EXECUTIONS_STRATEGY.CONCAT
// that is the same as using mergeMap to handle the calls to process.execute()
const mergeProcess = new Process({ 
    multiple_executions_strategy: MULTIPLE_EXECUTIONS_STRATEGY.CONCAT,  
});
process.execute(() => delay(200).pipe(mergeMap(() => of(1)))).subscribe();
process.execute(() => delay(100).pipe(mergeMap(() => of(2)))).subscribe();
// first the first request will resolve, than the second, the total execution time is 300 ms
```

The same options apply to BoundProcess.

### Resource


## Build

`npm run build`

Bundle in `/lib`

## Test

`npm run test`