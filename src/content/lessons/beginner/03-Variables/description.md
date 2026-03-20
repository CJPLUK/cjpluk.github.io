Variables

You can declare variables with one of two modifiers: var or let.
var makes the variable mutable, while let makes it immutable.


Cangjie can infer the type of the variable most of the time, in this case from a string literal. Because we defined `a` with the `var` modifier, we can change its value after initialization.

To specify the type of a variable, place `:` after its name followed by its type.
In this case `f` is of type `String`. Pay attention that `f` has the `let` modifier, therefore we cannot modify it after initialization.


Thanks to pattern matching in Cangjie, we can declare multiple variables at the same time using tuples. Because we declared a tuple using var modifier, both b and c are also mutable.


Until `e` is initialized with a value, we cannot use it in any expressions. Calling `println(e)` would cause an error.
