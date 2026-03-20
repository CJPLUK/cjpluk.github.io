Monitors

Monitor is a built-in data structure that binds a mutex to a single related condition variable (wait queue). Monitor can block a thread and wait for a signal from another thread to resume execution. This mechanism uses shared variables to synchronize threads.

Monitor initialization.
Condition variable.



Lock the monitor.


Unlock the monitor and wait for notify to continue.





Try to acquire lock.

Change the condition variable.




Notify that condition variable has changed, and maybe other thread can resume its computation.


Wait for the new thread to finish.
