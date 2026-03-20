Atomic Operations

An atomic operation is an indivisible and uninterruptible unit of work that either completes entirely or has no effect, guaranteeing data consistency in concurrent environments. It prevents race conditions by ensuring that no other thread can observe or interfere with the operation's intermediate states.


We initialize an `Atomic` variable.






We create 1000 threads, where each one increments the count counter by 1.







We save the result of each thread in a list.


We make sure that each thread finishes.

We check the value of the atomic variable. (it will be exactly 1000)


Note: If we did not use an atomic variable, the value of `count` would probably be smaller than 1000 due to race conditions.
