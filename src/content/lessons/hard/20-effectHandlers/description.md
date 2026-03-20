Effect Handlers

Effect handlers are non-local control operations that allow programs to pause and resume execution. They are similar to exceptions but extend them in a sense that you
can resume the code flow from the line where the effect got performed if you wish, while for exceptions the code flow only continues downward. Exceptions are thrown, while
effects are "performed." Exceptions are caught, while effects are handled. Effect handlers allow smooth implementation of different things, like dependency injection,
custom concurrency, memoization, etc.

Every effect must implement Command<T> interface, where T is the type of value that is returned by resume
We can also define a custom handler. The way it works is that if an effect is not handled and has defaultImpl, then that method gets called. If effect is not
handled but there is no defaultImpl, exception is thrown (demonstrated in the last example).






In addition to changing control flow, perform can return a value and resume can take an argument










Effect handlers have similar behaviour to exceptions when it comes to handler resolution. When we perform an effect, the runtime searches up the stack for the first
handler that handles the type of effect we have performed. However, the resume command returns the flow of control at the point where the effect was performed rather
than exit the handler as is the case with exceptions.
