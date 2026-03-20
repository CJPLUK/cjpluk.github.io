Generic Classes

To create a generic class in Cangjie, place any number of type parameters after the class name in `<>`. Then you can use your type parameter throughout your class. If you want to introduce type constraints, place them after `where`. (`T <: T` means absolutely nothing - each type fulfills that.)

Because we do not know what type `T` will be, we do not know whether it has a default constructor or value, so we have to use an option for initialization of the array (we set a default value of `None`).





Parameter variable 'value', has type T.







Return of function remove is also T.



getOrThrow is a function that operates on Options, and allows us to extract value from inside an option, as long as its not None.






We can instantiate `Queue` for strings using this syntax.


Adding elements to the queue is straightforward

Removing elements is also simple. (keep in mind remove() returns T)


Instantiation for `Int64`s is the same as for strings, with a different type.
