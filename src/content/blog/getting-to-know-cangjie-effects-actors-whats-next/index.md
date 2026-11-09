---
title: "Getting to Know Cangjie: Effects, Actors, and What's Next"
description: "Dr Steven Cheung surveys Cangjie's memory safety, effect handlers, actor concurrency, and the language features now under development."
date: "29/10/2026"
authors:
  - "Cangjie UK Team"
tags:
  - "Conference"
  - "OpenHarmony"
  - "Research"
descriptionImage: "./figures/cover.jpg"
---

# Getting to Know Cangjie: Effects, Actors, and What's Next

*From the talk at the OpenHarmony Technical Conference (Global), Prague, October 2026*

Dr Steven Cheung · October 26, 2026

What does a modern programming language need? Memory safety, concurrency, expressive abstractions, and increasingly, ways to work with AI agents. Cangjie is exploring all of these, combining established programming language features with some interesting new ideas.

Earlier this month, I gave a talk at the OpenHarmony Technical Conference (Global) in Prague, introducing Cangjie and some of the work our team in Edinburgh has been doing. We covered everything from effect handlers and distributed actors to experimental type system features and AI-assisted program migration.

This post takes a closer look at these topics, starting with a brief introduction to Cangjie before exploring a few features through examples and looking at what's coming next.

![Getting to Know Cangjie: Effects, Actors, and What's Next](./figures/figure-1.jpg)

Meet Cangjie

Cangjie (pronounced "Tsang-jie") is a general-purpose programming language developed by Huawei, named after the mythical figure credited with inventing Chinese characters.

![Getting to Know Cangjie: Effects, Actors, and What's Next](./figures/figure-2.jpg)

It is statically typed, type-safe, memory-safe, and garbage-collected, with a concurrent GC. It compiles natively to Linux, macOS, Windows, and HarmonyOS. You can already build complete HarmonyOS applications in Cangjie, including their user interfaces.

![Getting to Know Cangjie: Effects, Actors, and What's Next](./figures/figure-3.jpg)

Cangjie is multi-paradigm, combining procedural, object-oriented, and functional programming. Some of its notable features include:

- Algebraic data types, similar to those in OCaml and Haskell.
- Unboxed value types, which can avoid heap allocation.
- Type extensions, allowing existing types to implement additional interfaces, similar in spirit to Rust traits or Haskell type classes.
- User-level (green) threads, multiplexed onto OS threads.
- Token-level macros, used to build frameworks such as Cangjie's UI framework, unit-test framework, and Cangjie Magic agent framework.
- Effect handlers, an experimental feature we're currently developing.

![Getting to Know Cangjie: Effects, Actors, and What's Next](./figures/figure-4.jpg)

The compiler and libraries are open source on [GitCode](https://gitcode.com/Cangjie).

Of these features, effect handlers are particularly interesting because a single mechanism can express several seemingly unrelated programming abstractions.

Effect handlers: exceptions you can resume

Most programmers are familiar with exceptions. When something goes wrong, a program throws an exception, and control transfers to a handler.

For example, consider a function that throws when dividing by zero:

```cangjie
func foo(x: Int64, y: Int64) {
    if (y == 0) { throw DivideByZeroExn() }
    x / y
}

main() {
    try {
        println(foo(42, 0))
    } catch (e: DivideByZeroExn) {
        e.printStackTrace()
    }
}
```

Once the exception is caught, the computation inside foo is abandoned. There is no way to return to where the exception was thrown.

Effect handlers extend this idea by allowing the handler to resume the suspended computation.

```cangjie
func foo(x: Int64, y: Int64) {
    if (y == 0) {
        perform DivideByZeroEff()
    } else {
        x / y
    }
}

main() {
    try {
        println(foo(42, 0))
    } handle (e: DivideByZeroEff) {
        e.printStackTrace()
        resume with 0
    }
}
```

The syntax looks similar, but the behaviour is different.

When DivideByZeroEff is performed, execution is suspended and control passes to the matching handler. The handler prints a stack trace, then executes resume with 0.

This sends 0 back to the suspended computation, allowing foo to return that value and println to print it.

Under the hood, performing an effect captures a continuation: the rest of the computation from the point where the effect was performed. The handler can discard this continuation, just like an exception handler, or resume it with a value.

This seemingly small difference turns out to be surprisingly powerful.

Dependency injection with effect handlers

Consider logging in a cross-platform application. On desktop, we might want to print messages to the console. On mobile, we might prefer a dialog box. Each platform has its own APIs, but ideally our application logic shouldn't need to know about them.

With effect handlers, the application simply expresses its intention to log:

```cangjie
func foo() {
    ...
    perform Log(message)
}
```

The code doesn't specify how logging works. That decision belongs to the handler.

For a desktop application, we can provide a console handler:

```cangjie
func withConsole<T>(fn: () -> T) {
    try { fn() }
    handle (e: Log) {
        println(e.message)
        resume
    }
}
```

For mobile, we can handle the same effect differently:

```cangjie
func withDialog<T>(fn: () -> T) {
    try { fn() }
    handle (e: Log) {
        Dialog.alert(e.message)
        resume
    }
}
```

The same foo works in both environments without modification.

This is essentially dependency injection through effects. The application describes what it wants to do, while the surrounding context determines how it is done.

Unlike conventional dependency injection, there is no need to pass a logger object through every function that might need it.

Coroutines from stored continuations

Here's where things get more interesting.

An effect handler doesn't have to resume a continuation immediately. It can save the continuation and resume it later. This gives us everything we need to build a simple coroutine scheduler.

Consider two coroutines:

```cangjie
func co1() {
    println(1)
    perform Yield()
    println(3)
}

func co2() {
    println(2)
    perform Yield()
    println(4)
}
```

Each prints a number, yields, and then prints another.

We can implement a scheduler by handling Yield and storing the captured continuation in a queue:

```cangjie
func spawnTask(f: () -> Unit) {
    try { f() }
    handle (_: Yield, r: Resumption<Unit, Unit>) {
        // Store r in the queue
    }
}

spawnTask(co1)
spawnTask(co2)

while (...) { // Queue not empty
    // Resume the first continuation in the queue
}
```

Here's what happens:

1. spawnTask(co1) prints 1, then performs Yield. The handler stores the continuation containing println(3).
1. spawnTask(co2) prints 2, then stores the continuation containing println(4).
1. The scheduler resumes the first continuation, printing 3.
1. It resumes the second continuation, printing 4.

The result is 1, 2, 3, 4.

Of course, a production coroutine scheduler needs more machinery, but the essential idea is already there.

What's remarkable is that we've used the same language feature for three different purposes: exception handling, dependency injection, and coroutines.

Effect handlers can also be used to implement reactive, incremental, and probabilistic programming. They're a bit like the One Ring from The Lord of the Rings: one feature to rule them all, without requiring a dedicated language construct for every abstraction.

Effects meet AI agents

There's another interesting direction for effects: controlling what AI agents are allowed to do.

Consider a banking assistant. A user asks for their balance, and the agent queries a database before reporting that the balance is $300.

Now imagine the agent encounters a malicious prompt injection instructing it to send a million spam emails advertising a scam. If it has unrestricted access to both tools, it might perform the database query and send the emails.

What if we could describe the actions an agent is permitted to perform in its type?

Suppose database queries and email operations are represented as effects:

```text
CheckDB
SendEmail
```

An effect type system can track which effects a function may perform. If the agent is represented as a function, its effect type can describe the operations it might invoke.

A policy could permit CheckDB while rejecting SendEmail, preventing the agent from acquiring capabilities outside its intended role.

This requires more than effect handlers alone: the language also needs an effect type system and a mechanism for enforcing those restrictions.

Recent research, including ETAS: An Effect-Typed Language for Agent Systems (Tan et al., 2026), explores this direction.

We haven't decided whether Cangjie will adopt such a system, but it's an interesting possibility given our ongoing work on effect handlers.

Active objects: a different approach to concurrency

Effect handlers aren't the only feature our Edinburgh team has been working on. Another project explores active objects, also known as actors, for concurrent and distributed programming.

Traditional shared-memory concurrency requires developers to manage access to mutable state using locks and other synchronisation mechanisms. This can become complicated, particularly as the number of threads grows.

Actors take a different approach. Each actor owns its state, and only its own execution context can access that state directly. Other threads interact with it by sending messages.

In our Cangjie actor framework, an annotation can turn a class into an actor, isolating its member variables. Methods annotated as receivers provide controlled entry points.

Calling a receiver from another thread queues the operation and immediately returns a future. The actor processes its queued calls sequentially, and the caller can wait on the future when it needs the result.

This removes much of the explicit synchronisation normally required around shared mutable state.

## From a real application to actors

One of our clients had a Java application in which every incoming event spawned a new thread to invoke a stateful algorithm.

Because many threads could access the same state, the algorithm required extensive locking and synchronisation, creating complexity and performance bottlenecks.

We converted the algorithm into an actor.

Now the event listener simply invokes a receiver for each incoming event. The actor framework serialises access to the algorithm's state, allowing its implementation to focus on business logic rather than thread safety.

## Distributed actors and HarmonyOS

Actors also provide a natural abstraction for distributed programming.

Since actors communicate through messages rather than shared memory, the same programming model can be extended across processes and machines, although distributed execution introduces additional concerns such as network failures.

We've developed a [distributed actor framework for Cangjie](https://gitcode.com/Cangjie-SIG/distributed-actors-cj), in which a head node manages worker nodes while client nodes invoke actor methods through direct TCP connections.

Building on this, we're developing a HarmonyOS actor system that allows applications to expose stateful objects, such as shopping carts or calendars, to other applications and AI agents.

One particularly interesting feature is its integration with the Model Context Protocol (MCP).

For example, consider this actor interface:

```cangjie
@ActorInterface[
    distributed: true,
    description: "Provide calendar functionalities."
]
public interface CalendarService {
    @Receiver[
        description: "Check if datetime has no other appointments."
    ]
    func isAvailable(datetime: DateTime): Bool
}
```

The annotations and method signature provide enough information to generate an MCP tool definition, including its name, description, and input schema.

An AI agent can then invoke isAvailable on the calendar application through the actor system.

This allows existing application functionality to become accessible to agents without requiring developers to implement separate MCP tool interfaces manually.

What's next? Modal types and agentic migration

Beyond effect handlers and actors, we're exploring several other directions for Cangjie. Two particularly interesting ones are modal types and AI-assisted program migration.

![Getting to Know Cangjie: Effects, Actors, and What's Next](./figures/figure-5.jpg)

Both are ongoing research efforts rather than committed language features or finalised tools.

![Getting to Know Cangjie: Effects, Actors, and What's Next](./figures/figure-6.jpg)

## Modal types: making safety more expressive

Cangjie already provides memory safety through garbage collection, but some gaps remain.

Pointers created through the C foreign-function interface (FFI) can bypass language-level safety guarantees. Concurrency isn't safe by default either: mutability and global access are permitted, and the language doesn't enforce thread locality. Garbage collection also manages memory, not other resources such as file handles.

We're exploring whether modal types, inspired by recent work in OCaml, could address some of these limitations.

![Getting to Know Cangjie: Effects, Actors, and What's Next](./figures/figure-7.jpg)

The idea is to let programmers provide more information about how values may be used, so the compiler can enforce stronger guarantees and potentially optimise resource management.

For example, consider this experimental syntax:

```cangjie
func generate(): Image {
    let image: Image @local! = getSourceImage()
    let filter: Image @local! = pickFilter()

    // glbImg = filter

    let result: Image = image.applyFilter(filter)

    let signature: Signature @unique! @immutable? =
        Signature("author info")

    result.sign(signature)
    return result
}
```

![Getting to Know Cangjie: Effects, Actors, and What's Next](./figures/figure-8.jpg)

Here, image and filter are marked as local, meaning they cannot escape the scope of generate.

Assigning filter to a global variable would therefore be a compile-time error. Functions receiving a local value must also respect its locality restrictions.

With suitable lifetime guarantees, the compiler may be able to allocate these objects more efficiently and reduce pressure on the garbage collector.

We're also investigating modes such as unique, for ownership and move semantics, and immutable, for values that cannot be modified.

The broader goal is to give Cangjie stronger safety guarantees and finer control over resources while retaining the convenience of a garbage-collected language.

## Agentic migration: from Java and Swift to Cangjie

Another area we're investigating is using AI agents to migrate existing applications from languages such as Java and Swift to Cangjie.

There are two broad approaches to this problem.

Behavioural translation starts by extracting a specification of the original program's behaviour, then reimplementing it in the target language.

This approach is flexible, particularly when the source and target platforms differ significantly. However, the specification may miss important behaviour, and verifying the resulting implementation can be difficult. It may also produce a codebase with a very different architecture, increasing long-term maintenance costs.

Structural translation instead preserves the original program's organisation and translates it in smaller units, such as classes or functions.

This makes it possible to maintain a direct mapping between source and target code. Corresponding fragments can then be checked using differential testing: execute both versions with the same inputs and compare their observable behaviour.

The advantage is that translation errors can be discovered and localised earlier, rather than waiting until an entire application has been migrated.

Of course, not everything can be translated structurally. Some language features, such as Swift's built-in actors, depend on runtime semantics that don't map directly to Cangjie. Platform-specific APIs and UI frameworks present similar challenges.

We expect a practical solution to combine both approaches: preserving structure and verifying individual fragments where possible, while using behavioural translation where platform differences demand it.

Our aim is not simply to generate Cangjie code, but to make application migration more reliable, verifiable, and maintainable.

Final thoughts

Cangjie already brings together a range of modern programming-language features, from algebraic data types and green threads to macros and native HarmonyOS development.

What makes it particularly interesting to us is the opportunity to explore new abstractions on top of that foundation.

Effect handlers show how a single language mechanism can support everything from exceptions to coroutines. Actors offer a simpler way to structure concurrent and distributed applications. Modal types could strengthen safety and resource management, while agentic migration opens up new possibilities for bringing existing applications to Cangjie.

Some of these features are available today, while others are still experimental or under investigation. We're looking forward to seeing how these ideas develop.

Watch the talk

The full talk, An Intro to Cangjie and More, is available on YouTube with English and Chinese subtitles:

[https://www.youtube.com/watch?v=TX4u6cBO1Nk](https://www.youtube.com/watch?v=TX4u6cBO1Nk)

For those interested in specific topics:

- 05:33 — Effect handlers
- 13:01 — Effects and AI agents
- 15:43 — Active objects and distributed actors
- 21:34 — Modal types

## Links and references

- [Cangjie official website](https://cangjie-lang.cn/en)
- [Cangjie source code](https://gitcode.com/Cangjie)
- [Distributed actors for Cangjie](https://gitcode.com/Cangjie-SIG/distributed-actors-cj)
- Tan, H., Wang, Y., Zhang, P., Li, S. and Shen, J. (2026). ETAS: An Effect-Typed Language for Agent Systems. [arXiv:2607.17780](https://arxiv.org/abs/2607.17780).
