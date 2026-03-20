Mutexes

A mutex (mutual exclusion) is a synchronization primitive that acts like a lock, ensuring only one thread can access a critical section of shared code or data at any given time. Threads acquire the mutex before entering the critical section and release it upon exiting, preventing race conditions and maintaining data integrity.

Mutex initialization.

Once again, we run 1000 threads each increasing a counter by 1.

We lock critical part of the code.
Perform increment.
Unlock the mutex.





Make sure all threads finish.



You can also manage locking and unlocking automatically by enclosing the critical
section of code in 'synchronized'.
