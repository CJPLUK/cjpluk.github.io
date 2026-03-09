---
title: Effect Handlers
route: effectHandlersIntro
---

# Effect Handlers

Here in the UK team for Cangjie, one of the big themes underpinning our work is *effect handlers*.

## Where they come from?

*Effect handlers* have emerged as a powerful, modular abstraction for managing side effects in mostly functional programming languages.
They originate from the theory of algebraic effects developed by Gordon Plotkin and John Power in the early 2000s as a more convenient way to deal with
side effects in functional code without resorting to monad transformers.

## Effect Handlers in Cangjie

Before the Cangjie programming language, *effect handlers* were only found in functional-style programming languages, many of which were bespoke research projects.
Although the Cangjie programming language is not purely functional, we believe that *effect handlers* have a place in multi-paradigm general purpose languages, just like how other ideas from functional programming have influenced mainstream languages (such as closures, algebraic data types, lazy evaluation...).
*Effect handlers* are an upcoming experimental feature in Cangjie, but you can try it now using the [build](https://github.com/CJPLUK/cangjie_sdk/releases) of our [fork of the Cangjie SDK](https://github.com/CJPLUK/cangjie_sdk).
If you are involved with a research project involving *effect handlers* are are interested in using Cangjie, feel free to [reach out to us]()!
To see it in action, check out the [tutorial](https://github.com/CJPLUK/effects-tutorial).

## Effect Handler Use Cases

*Effect handlers*, as a programming language feature, is certainly not widespread.
Here are ways to use them to inspire your next *effect*ful program.

### Avoid Prop Drilling

Sometimes a large section of your code operates operates with some shared context:
there is some dynamic[^1] functionality that you depend on, requiring you to pass around a classic context object `ctx` to every other function.
Maybe you even end up having copies of this context object across different objects just to make sure that the relevant method has access to this context (e.g. the `.next()` method of an iterator does not take any context argument).

To sidestep this, you could just create a global variable for the context data, but the 60s called and is trying to sell you a COBOL support contract...
but seriously, this would throw a spanner in the works of any future attempts to refactor into parallel workloads, and clarity takes a real hit when shared mutable data can be referenced all across the codebase.

<table>
<tr>
<td valign="top">

```cangjie
var count = 0

func foo() {
    // count event
    count++
}
```
</td>
<td valign="top">

```cangjie
func crash() {
    // report current count
    // and reset
    println(count)
    count = 0
}
```
</td>
<td valign="top">

```cangjie
func bar() {
    // report current count
    // and do not reset
    println(count)
}
```
</td>
</tr>
</table>

For the above example, understanding the usage of the variable `count` relies on finding all its references.
In order to maintain locality of behaviour, we may write something like the following with **effect handlers** in Cangjie:

<table>
<tr>
<td valign="top">

```cangjie
func scope() {
    let count = Box(0)
    try {
        crash()
        bar()
    } handle (add: Add) {
        count.value += add.number
        resume
    } handle (comp: Complete) {
        // subtask complete, do
        // relevant cataloguing
        // then reset
        count.value = 0
        resume
    } handle (_: SeeCount) {
        resume with count.value
    }
}
```
</td>
<td valign="top">

```cangjie
func crash() {
    perform Add(5)
    perform Complete()
}
```
</td>
<td valign="top">

```cangjie
func bar() {
    // report current count
    // and do not reset
    println(perform SeeCount())
}
```
</td>
</tr>
</table>


[^1] ... so you cannot just define plain functions exposed by a module

### Scoped Event Handling

You could pass objects around who's methods are used to trigger/handle "events". But leftover references to these objects could unintentionally allow the program to emit these events well after the intended scope.

Instead use effects for these events:
```cangjie
try {
    // ...
    perform Event()
    // ...
} handle (e: Event) {
    // handle event
    if (/* ok */) {
        resume
    }
    // Don't resume in problematic case
}
```

### Pausable Coroutines

The `handle` clause can contain an explicit `Resumption` object. We call these "deferred handlers". This allows you to hold a resumption aside to resume (or not) later outside of the handler.

```cangjie
let continuation: Box<?Resumption<Val, Unit>> = Box(None)

try {
    try {
        // stuff
    } handle (r: Request) {
        if (/* can deal with request */) {
            resume with value
        } else {
            perform Pause()
        }
    }
} handle (_: Pause, r: Resumption<Val, Unit>) {
    continuation.value = r
}

while (let Some(cont) <- continuation.value) {
    // Do other stuff do be able to handle
    // request
    resume cont with  value
}
```
A good showcase for this is the [Coroutine library](https://gitcode.com/2501_94045070/cangjie_generators/tree/coordinate) which, among other things, allows you to write generator functions in the Cangjie programming language and use them as normal iterators.


## Effect Handler Projects
- [tutorial](https://github.com/CJPLUK/effects-tutorial)
- [Coroutine library](https://gitcode.com/2501_94045070/cangjie_generators/tree/coordinate)
- [Upload4cj fork](https://gitcode.com/2501_94045070/upload4cj/tree/effects-implant)
- [Structured Concurrency (concj)](https://gitcode.com/2501_94045070/concj)
