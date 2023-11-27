# Promise Chain Declaration (npm Module)

[![npm version](https://badge.fury.io/js/queued-promise.svg)](https://badge.fury.io/js/queued-promise)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview

`queued-promise` is an npm module designed to simplify the declaration of potentially complex promise chains. It allows users to declare a promise chain as a variable without immediate execution, providing a clean way to later handle the promises using `Promise.all` or `Promise.allSettled`.

The primary motivation behind this module is to enhance code readability by avoiding the need for inlining promises when using `Promise.all` or `Promise.allSettled`. Additionally, it helps prevent immediate execution of promises, reducing the risk of unhandled promise rejections that could crash the Node.js process.

## Example Problems

Performance

```Typescript
const containingFunc = async() => {
  // takes 3s
  const res1 = await promise1(arg1)
  // takes 2s
  const res2 = await promise2(arg1)
  return [res1, res2]
}

// takes ~5s due to serial await
const totalRes = await containingFunc()
```

Reliability

```Typescript
const containingFunc = async() => {
  // takes 3s
  const p1 = promise1(arg1)
  // takes 2s
  const p2 = promise2(arg1)

  // between the time those above two lines are evaluated and the below await is evaluated,
  // any throw in the promise chains will cause unhandledPromiseRejection. This will crash node >=15
  // and is not detected with any existing lint rules.

  return await Promise.all([p1, p2])
}

// takes ~3s if not crash since the await benefits from parallelism
const totalRes = await containingFunc()
```

Maintainability

```Typescript
const containingFunc = async() => {

  // hard to grok the more parallel/complex the chains get
  return await Promise.all([
        promise1(arg1),
        promise2(arg1)
            .then(postProcess)
            .finally(cleanup),
        promise3(arg1, arg2).catch((err: unknown) => {
            // some inline one-off catch clause that can get lengthy
        })
    ])
}

// takes ~3s as the await benefits from parallelism, and does not crash as there's
// no time between the creation of the promises and the assignment of their await handler
const totalRes = await containingFunc()

```

## Installation

Install the module using npm:

```bash
npm i queued-promise
```

## Usage

Example

```Typescript
import QueuedPromise from 'queued-promise'

// Declare a promise chain without immediate execution
// Constructor arg1 is the promise function itself.
// arg2...n is a spread of the arguments that should be passed to the asyncFunc when executed

const queuedPromise1 = new QueuedPromise(asyncFunc1, arg1);
// QueuedPromise implements Promise so .catch, .then, and .finally chains are supported
const queuedPromise2 = new QueuedPromise(asyncFunc2, arg1, arg2, arg3).then(postProcess).catch(handleErr).finally(cleanup)

// Later, use Promise.all or Promise.allSettled to handle the promises started by invoking .enqueue
// on the QueuedPromise object.
const results = await Promise.all([queuedPromise1.enqueue(), queuedPromise2.enqueue()]);

```
