# dh-memory-db
Devoted health memory store db

Overall algorithm:

Could have been a directed acyclic graph containing immutable data with pointers to unchanged data for new heads, 
but for a flat structure list a key/value pair the pointer references between head nodes pretty much approach doubling memory for each txn.

Instead, I went with:

Map of <name,SinglyLinkedList<value>>
    For non txn uses, name points to a single head node whose value is updated.
    For txn uses:
        Update a variable within a txn works identically no non txn use. Head node's data is updated.
        New set for a txn creates a new head node, setting the previous head node to next. Data is shifted, and history is preserved.
            Ex. name: [oldVal] -> null    becomes name: [newVal] -> [oldVal] -> null
        Delete command stores null
            Ex. name: [oldVal] -> null    becomes name: [null] -> [oldVal] -> null
    If reverting to previous value with no other history, entry is deleted.
    If committing with a null value, entry is deleted.

Map of <value: occurrence count>
    Updated when nodes change.
    If value count is 0, entry is deleted from map.

Stack of Set<string> containing the variables modified in the current transaction.
    Used to determine if a variable was set/deleted multiple times within a transaction,
        so it can be overwritten instead of saving additional history
    On revert, the latest set is popped off and each modified key has it's linkedlist values reverted by 1.
    On commit, all sets are joined into 1, and all modified keys across all txns have their head.next nodes deleted, leaving no histories.

Time complexities:
GET
    O(1) avg case. Simple hashmap lookup and reading data from head node.
SET
    O(1) avg case. Simple hashmap lookup + count increments + head data modification. Nothing scaling on total data size.
DELETE
    O(1) avg case. Simple hashmap lookup + count increments + head data modification. Nothing scaling on total data size.
COUNT
    O(1) avg case. Simple hashmap lookup for counts.




## The Problem
Implement an in-memory database that has the following functions. We’ll be looking for your code to meet our functionality & performance requirements, be clear & easy to understand and be resilient to edge cases. Use libraries at will (but not database-like ones or actual databases). Use Google/Stack Overflow/online references at will as well. 
The database should be a command line program that reads values from STDIN line by line and executes the functions as they happen. Please also include a README explaining how to run your program. 
The name and value will be strings with no spaces in them.. 
Functions: 
SET [name] [value] 
Sets the name in the database to the given value 
GET [name] 
Prints the value for the given name. If the value is not in the database, prints NULL 
DELETE [name] 
Deletes the value from the database 
COUNT [value] 
Returns the number of names that have the given value assigned to them. If that value is not assigned anywhere, prints 0 
END 
Exits the database 
The database must also support transactions: 
BEGIN 
Begins a new transaction 
ROLLBACK 
Rolls back the most recent transaction. If there is no transaction to rollback, prints TRANSACTION NOT FOUND 
COMMIT 
Commits all of the open transactions 
Performance Requirements: 
The points in this section are goals for the performance of the solution. 
● Aim for GET, SET, DELETE, and COUNT to all have a runtime of less than O(log n), if not better (where n is the number of items in the database). 
● The memory usage of the database shouldn't be doubled for every transaction. Minimum Requirements:
The points in this section are the minimum requirements that a solution must meet in order to be scheduled for a live evaluation of the Tech Assessment. 
● The first 3 test cases (that are outlined on the last page of this prompt) must pass ● Neither an actual database nor a database library is used 
● The basic commands GET, SET, DELETE, and COUNT are implemented per the spec. They take the correct number of arguments and function properly.