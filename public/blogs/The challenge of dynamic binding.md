# The challenge of dynamic binding

Dynamic binding shatters the predictability of conventional programming languages by letting code decide its own destiny at runtime.

Instead of following fixed, compile-time control paths, dynamic binding defers decisions about which method or function to execute until the very last moment, creating immense flexibility but also chaos for static type systems, compilers, and optimizers. It blurs boundaries between types, undermines early error detection, and demands sophisticated runtime machinery, posing a significant practical and methodological languages to most programming languages.

Early programming languages such as FORTRAN always used static (compile time) binding for functions, but LISP in the late 1950s pioneered a new way of determination of function calls, at runtime. Many people believe this was an accidental design or even a mistake, as it was removed from newer versions of the language. However, it enabled applications such as symbolic computation, which subsequently influenced object-oriented design. This shift allowed programs to be more adaptable at runtime, rather than being locked into compile-time decisions. By the 1980s and 1990s, object-oriented languages such as Smalltalk, C++, and Java used the concept of dynamic binding as embodied into virtual method invocation. This was deemed to be essential for polymorphism, extensibility, and runtime adaptability in object oriented programming.

Virtual method invocation is a restricted form of dynamic binding because it limits runtime method resolution to a predefined set of methods within an inheritance hierarchy. In **general dynamic binding**, any function or method call may be resolved at runtime, as seen in highly dynamic languages like Lisp or Smalltalk. In contrast, virtual methods in languages such as C++ or Java are bound at runtime only if they are explicitly declared as `virtual` (C++) or non-`final` (Java), and the resolution is confined to the class hierarchy of the object's declared type.

Applications that require fully unrestricted dynamic binding are typically those that need additional flexibility at runtime, when behavior cannot be fully determined at compile time and requires contextual information that cannot be known at that stage. Examples include:

1.  **Scripting and automation environments:** Languages such as Python, Ruby, and JavaScript rely heavily on runtime method resolution to allow scripts to adapt dynamically to user input, plug-ins, or changing environments.
2.  **Interactive development tools and REPLs:** Systems such as Smalltalk or Lisp environments let developers modify and extend programs on the fly, requiring method and function calls to be fully resolved at runtime.
3.  **AI and symbolic computation:** Programs that manipulate code as data (e.g., symbolic reasoning, rule-based systems) often need to construct and invoke functions dynamically without any compile-time constraints.
4.  **Dynamic frameworks and plug-in architectures:** Most importantly, industrial applications like web servers, IDEs, or game engines often load modules at runtime, requiring calls to classes or functions that were not known when the program was compiled.

![Scenario in which dynamic binding is required: insufficient context information at compile time](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*fj7P6ayyVRvwWhOgrDBPOw.png)

In essence, any system that prioritizes **runtime flexibility, extensibility, or self-modifying behavior** benefits from fully unrestricted dynamic binding. Some leading examples of frameworks that use dynamic binding heavily are **Node.js** and **React** (web), **Unity** and **Unreal** (game engines), or **Java Spring** (dependency injection). In practical industrial applications, **dependency injection** is perhaps the most important design pattern that requires the full power of dynamic binding. In the absence of native language support for dynamic binding it is quite common for frameworks which require it to use metaprogramming or reflection instead.

Using **reflection** and **metaprogramming** gives powerful flexibility, but it comes with several key problems and trade-offs:

1.  **Performance Overhead:** Reflection often bypasses compile-time optimizations, making method calls and object instantiation slower. Metaprogramming can also add compile-time cost, memory usage, and longer startup times.
2.  **Loss of Compile-Time Safety:** Errors like calling non-existent methods, type mismatches, or incorrect field names may only surface at runtime, not during compilation. Even when safety is preserved type errors are relative to generated rather than original code, making them difficult to interpret. This undermines the guarantees and conveniences normally provided by strongly typed languages.
3.  **Complexity and Maintainability:** Code that uses reflection or metaprogramming can be **harder to read, understand, and debug**, because behavior is not explicit in the source code. Tracing dependencies or figuring out program flow often requires understanding runtime behavior rather than static code.
4.  **Security Risks:** Reflection can access private fields or methods, which may expose sensitive data or allow unintended modification. Malicious code could exploit reflection or dynamic evaluation if inputs are not properly controlled.
5.  **Tooling Limitations:** IDEs, linters, and static analyzers often have difficulty analyzing code that depends heavily on runtime behavior. Features like refactoring, autocompletion, or static verification can break when classes and methods are resolved dynamically.

In short, reflection and metaprogramming trade **safety, clarity, and performance** for **runtime flexibility** in languages that have no native support for dynamic binding.

Two simple concrete examples
----------------------------

Lets illustrate this problem with two simple yet challenging examples often encountered in practice.

Logging
-------

Logging is a cross-cutting concern for virtually all industrial-sized applications. Therefore, several logging frameworks are available for various languages (e.g. **SLF4J** for Java, **Serilog** for .NET, or **Winston** for JavaScript).

Logging is the _‘hello world_’ of dependency injection and dynamic binding. It simply means that we want to instrument our code with calls such as **log(message)** which will record information about the execution of the program to be used for debugging, profiling, security, etc.

If we are developing a logging framework then system details about how logging is to be performed need to be controllable at runtime:

*   logging to console is the simplest way to log, but a console may be unavailable on mobile or embedded devices
*   logging to file requires path, permissions, opening and closing mechanism, but files may be unavailable on embedded devices and restricted on mobile devices
*   logging by opening dialog boxes requires access to UI infrastructure and may be unavailable on console-mode devices
*   logging by sending messages across devices such as email requires a network stack and access to a mail server

Covering all these choices in a single library is impractical, especially as new runtime situation can occur (e.g. log using a particular database): **all details about the actual recording of the log must be deferred to the execution context.**

Deep refactoring
----------------

Another situation that can benefit from dynamic binding is what we shall call ‘_deep refactoring_’. Imagine a sequence of function calls tracing back to the main function of the program. And imagine deep down the call stack a call to some function `qux()`. Let us consider the consequences of this function call changing, and now requiring **a new parameter** which is only known at runtime, `qux(m)`.

For instance, we want this:

```
func foo() { bar() }
func bar() { baz() }
func baz() { qux() }
func main() { foo() } 
```

To become something like this, **but with a way to make** `**m**` **reach** `**qux**`**.**

```
func foo() { bar() }
func bar() { baz() }
func baz() { qux(m) }
func main() { m = get(); foo() }
```

The intervening functions on the call stack (`foo`, `bar`) may not be modifiable because they may belong to modules used elsewhere, therefore modifying them in order to deal with the new argument for `qux` may be impossible. Ad hoc and dangerous solutions such as the introduction of global variables to pass information, or expensive refactorings may be unavoidable. In order for the value `m` to be provided by the calling context to `baz`, dynamic binding can give an easier solution, as we shall soon see.

Introduction to effect handlers in Cangjie (CJ)
-----------------------------------------------

For general information regarding the CJ language please visit its official site [https://cangjie-lang.cn/](https://cangjie-lang.cn/) .

Effect handlers have a more detailed documentation provided in the open source [repository](https://gitcode.com/Cangjie/cangjie_stdx/blob/main/doc/libs_stdx_en/effect/effect_package_overview.md) of the language.

Effect handlers are a novel but intensely studied programming language construct that generalizes exceptions, coroutines, and other control-flow mechanisms. Originally they were motivated by enriching pure functional programs with new behaviour in a principled way. Instead of hardwiring behaviors like state, I/O, or backtracking into the runtime, effect handlers let programmers describe these operations abstractly (as _effects_) and then specify how they should be handled in a composable and modular way. This separation of effectful operations from their interpretations makes programs more flexible, expressive, and easier to reason about, since the same effectful code can be reused under different handlers to achieve different behaviors.

In the new programming language CJ, the syntax of effect handlers closely resembles that of exceptions, following a `try–handle` style structure. In this model, the keyword `throw` is replaced by `perform`, while `Exception` corresponds to `Command<T>`, and `catch` is expressed as `handle`. Unlike traditional exception handling, effect handlers introduce an additional argument known as the _resumption_, which captures the current execution context at the point of the effect and allows the computation to be resumed under controlled conditions. Furthermore, handlers can be defined locally or installed globally, enabling fine-grained control over effect interpretation across different program scopes.

A resumption represents the captured execution context at the point of an effect invocation, and it can be manipulated in several ways. It may be _ignored_, yielding control flow behavior equivalent to an exception. Alternatively, it can be _resumed_, in which case the stored execution context is reinstated, effectively performing a non-local jump. A resumption may also be _saved_ for deferred execution, allowing the computation to be resumed at a later time. In certain cases, resumptions can be treated as _implicit_, meaning they are locally applied without being referenced by the program. A key limitation, however, is that a resumption can currently be invoked at most once, constraining the extent to which captured continuations can be reused.

```
try {
  ...
  perform e
  ...
} handle (e: E, r: Resumption<U, V>) {
  ...
}
```

A resumption `r`can be invoked as `resume r with t` where `t`is of the type `T`in `Command<T>`. If `T`is `Unit` then `resume r` with no arguments is allowed. Finally, if the resumption `r: Resumption<U, V>` is unspecified in the handle then the syntax is `resume with t` or just `resume` `Unit` type. Such implicit resumptions cannot be stored so they must be either used immediately or discarded.

For the purpose of implementing dynamic binding we only need to concern ourselves with **immediately used implicit resumptions.**

When an effect is performed, the corresponding resumption is captured at the point of invocation, but its definition exists outside the lexical scope of the handler. This means that unlike typical function calls, where control flow and binding are governed by static lexical structure, the resumption reflects the _dynamic_ state of the program at runtime. As a result, effect handlers provide a principled mechanism for _dynamic binding:_ the choice of how an effect is interpreted depends not on where the effectful operation is written in source code, but on which handler is active in the dynamic call stack at the time of execution. This separation yields a clean and modular alternative to ad-hoc dynamic scoping, since the resumption encapsulates the continuation precisely and reifies it as a first-class value, making dynamic behavior explicit and controllable without sacrificing program structure or composability.

Dynamic binding using effect handlers
-------------------------------------

Because an effect handler embodies dynamic binding, no further elaboration is needed in the language, and no frameworks or additional mechanisms such as reflection or metaprogramming are needed. We can now examine how our previous two simple yet challenging examples can be immediately solved.

But before we proceed let us briefly introduce a helpful auxiliary syntax of Cangjie, _trailing lambdas._ It allows a function’s final argument, when it is itself a lambda (or anonymous function), to be written _outside_ the usual parentheses of the function call. This improves readability, especially when the lambda body is large or contains control-flow constructs, since it visually separates the function’s main arguments from the block of code representing its behavior. Trailing lambdas are commonly used in APIs that expect a callback, handler, or computation block, making the code look more like a structured control-flow statement than a nested function call.

Logging with effect handlers
----------------------------

In the presence of effect handlers our logging function can be given a trivial implementation:

```
class Log <: Command<Unit> {
   var m: String
   init(m: String) { this.m = m }
}
func log(string m) { perform Log(m) }
```

1.  First a new effect _(command)_ called Log is defined, which stores a string to be logged.
2.  Then the logging function simply performs that command, which means that it raises it into the calling context which must handle it appropriately.

A simple effect handler may log the message by printing it to the console:

```
func withConsole(fn: ()->Unit) {
  try { fn() } 
  handle (e: Log) {
    println(e)
    resume
  }
}
```

Taking advantage of trailing lambda syntax any arbitrary fragment of code can be instrumented so that the logging function is handled by the console printer:

```
withConsole {
  ...
  log(someMessage)
  ...
}
```

To emphasize, the logging function need not be in the lexical scope of the handler but, just like for exceptions, can be within function calls. Also just like in the case of exceptions handlers it can be nested, so that behaviour can be locally changed.

Assuming we also have a trivial handler which simply ignores logging, we can use it to turn logging on and off conveniently:

```
func suspendLog(fn: ()->Unit) {
  try { fn() }
  handle (_: Log) { resume }
}
...
withConsole() { 
  // log to console
  ...
  suspendLog() {
    // no logging
    ...
  }
  // log to console again
  ...
}
```

A realistic implementation of logging using effect handler is the _EventBus_ Cangjie framework available at [https://gitcode.com/jdwood/eventbus4cj](https://gitcode.com/jdwood/eventbus4cj) .

Deep refactoring with effect handlers
-------------------------------------

It will come as no surprise to the astute reader that deep refactoring can be similarly implementing by using an effect to require the _context_ to provide the missing argument:

```
func baz() {
  let m = perform GetContext()
  qux(m)
}
func main() {
  ...
  m = get()
  try { foo() } 
  handle (e: GetContext) { resume with m }
}
```

The function `baz` will request the missing `m` by raising an effect `GetContext`into the calling context, handled in this case at the top level by `main`, which will provide it by using the syntax `resume with m`.

Since the overhead incurred by an immediate handler with implicit resumptions is similar to that of a virtual function call, this solution is not only simple and concise but also efficient.

A bump in the road
------------------

We think of the interface between a function and its calling context as described by its type, which specifies the inputs it consumes and the outputs it produces. However, this characterization is incomplete in practice, since communication via global variables is not captured by the type system. This is one of the reasons global state is considered unsafe and unreliable. With the introduction of algebraic effects, an additional implicit interface arises: a function may interact with its context not only through its explicit type signature but also by _raising_ effects to be _handled_ externally. This raises the question of whether such hidden channels of interaction compromise reasoning about program behavior, much like global variables do, or whether they can be disciplined through type systems and effect annotations to preserve modularity and reliability. Three points can be made regarding this issue.

First, we have the prior experience of _checked exceptions_ in Java, which are a basic effect type system documenting the exceptions thrown by a method. Java checked exceptions are not universally accepted as good language design and they are often misused in practice. The main criticism is that they impose a heavy syntactic and semantic burden on developers: every method that may throw a checked exception must explicitly declare it in its signature, and callers are forced to either handle or re-declare the exception, leading to verbose and repetitive code. In large codebases, this often results in “exception laundering,” where developers wrap checked exceptions into unchecked ones to avoid clutter, thereby defeating the purpose of checked exceptions altogether. Furthermore, checked exceptions do not compose well with higher-order abstractions such as functional interfaces, streams, or asynchronous programming constructs, since these often assume a uniform return type and do not easily propagate checked exceptions. While the original motivation was to make exceptional control flow explicit and type-safe, in practice the rigidity of checked exceptions can harm modularity and evolution of APIs, leading many language designers and developers to prefer effect systems or unchecked exceptions as more flexible alternatives.

The counterpoint to the above is that recent advances in **effect type systems** mitigate many of the problems of Java checked exceptions. Unlike Java’s rigid declaration mechanism, modern effect systems can track and annotate the possible effects of a computation in a more compositional and fine-grained manner, often leveraging type inference to reduce annotation overhead. This allows the effectful behavior of higher-order functions, polymorphic abstractions, and asynchronous workflows to be described without sacrificing expressiveness or modularity. Furthermore, effect systems integrate naturally with algebraic effects and handlers, providing explicit yet flexible specifications of side effects such as state, I/O, or nondeterminism, while allowing different interpretations of those effects in different contexts. As a result, effect types preserve the benefits of explicit error and effect tracking, but avoid the verbosity, inflexibility, and poor composability that made Java checked exceptions unpopular in practice.

Finally, conventional type systems are used both to prevent severely unsafe behavior in programming languages, such as adding an integer to a function, which can be impossible to define, and to enable various compiler optimizations that rely on the guarantees of the type system. It remains to be seen how effect type system in an already effect-rich programming language such as Cangjie can be used for safety and optimizations. It will be a future design decision for Cangjie whether to adopt such a system or not.

Conclusion
----------

Dynamic binding is a powerful technique enabling programs to defer certain binding decisions until runtime. This flexibility underpins key programming idioms such as dependency injection, aspect-oriented programming, or configurable middleware. However, in most languages, implementing dynamic binding requires complex infrastructure, such as metaprogramming facilities, runtime reflection, or external frameworks. These approaches introduce overhead, both in performance and in maintainability, since they obscure program structure and push critical binding logic outside of the language’s core semantics. As a result, while dynamic binding is essential in real-world applications, its traditional implementations are often brittle and difficult to reason about informally.

Effect handlers provide a clean, language-native abstraction that greatly simplifies the implementation of dynamic binding and its most common applications. By reifying operations as _effects_ and allowing their interpretation to be specified dynamically through _handlers_, effect handlers make it straightforward to express patterns like dependency injection, resource management, and configurable control flow without resorting to reflection or invasive metaprogramming. This approach integrates dynamic flexibility into the type system and runtime directly, preserving clarity, composability, and safety. Cangjie stands out as one of the few mainstream programming languages to incorporate effect handlers as a first-class feature, giving developers a significant advantage: they can write flexible, dynamically configurable code in a way that is both semantically transparent and efficiently supported by the language runtime. This reduces boilerplate, eliminates reliance on fragile external mechanisms, and enables developers to focus on business logic rather than infrastructure.