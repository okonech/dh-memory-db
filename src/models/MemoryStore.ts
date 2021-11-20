import LinkedList from 'singly-linked-list';

export class MemoryStore {
    private dataMap = new Map<string, LinkedList>();
    private valueCountMap = new Map<string, number>();

    get(key: string): string | null {

        const head = this.dataMap.get(key);
        return head?.head?.data || null
    }

    /**
     * Set a value in the key value pair map.
     * If not in a transaction, will replace head data.
     * If in a transaction, will insert current value as new head and shift data down 
     */
    set(key: string, value: string, txnCommit = false): void {

        const list = this.dataMap.get(key);

        // new value for key, initialize list ,increment new value count
        if (!list) {
            // create new list with value as head
            const newList = new LinkedList();
            newList.insert(value);
            // increment new value
            this._incrementValueCount(value);
            this.dataMap.set(key, newList);
        } else {
            // list exists, update value, decrement old value, increment new value counts
            const oldVal = list.head.getData();
            // do nothing if oldval is the same and not in a txn
            if (oldVal === value && !txnCommit) {
                return;
            }

            // store new data
            txnCommit ? list.insertFirst(value) : list.head.data = value;
            // decrement old value count 
            this._decrementValueCount(oldVal);
            // increment new value count
            this._incrementValueCount(value);
        }
    }

    /**
     * Delete a value in the key value pair map.
     * If not in a transaction, deletes the linkedlist value.
     * If in a transaction, and a list exists, inserts a null value as the head of the linked list and shifts data down
     */
    delete(key: string, txnCommit = false): void {
        // decrement deleted value
        this._decrementValueCount(this.get(key));

        const list = this.dataMap.get(key);

        if (!list) {
            return;
        }

        // insert null value for rollback purposes in a txn
        txnCommit ? list.insertFirst(null) : this.dataMap.delete(key);
    }

    /**
     * Return a count of occurrences of the value in they key value pair structure
     */
    count(value: string): number {
        return this.valueCountMap.get(value) || 0;
    }

    /**
     * For a given key, in the value linked list, remove the current head and shift data up
     * Used to rollback a value from a commit
     */
    revert(key: string): void {
        const list = this.dataMap.get(key);

        if (!list) {
            return;
        }

        // decrement old head data count prior to removal
        this._decrementValueCount(list.head.data);

        // if no next value to revert to, entry is rolling back to null and should be deleted
        if (!list.head.next) {
            this.delete(key);
            return;
        }

        // replace current head with the previously stored value for this key
        list.head = list.head.next;
        // increment new head data count after revert
        this._incrementValueCount(list.head.data);
    }

    /**
     * For a given key, in the value linked list, clear all pointers from head
     * Removes all txn history on a commit
     */
    flatten(key: string): void {
        const list = this.dataMap.get(key);

        if (!list) {
            return;
        }

        // if current head value is null, the key was deleted in a txn and should be deleted here
        if (!list.head.data) {
            this.delete(key);
        } else {
            // non null value, remove all txn history data and keep only the latest
            list.head.next = null;
        }

    }


    private _decrementValueCount(value: string) {
        if (!value) {
            return;
        }

        const valCount = this.valueCountMap.get(value);

        if (!valCount) {
            return;
        }

        if (valCount === 1) {
            this.valueCountMap.delete(value);
        } else {
            this.valueCountMap.set(value, valCount - 1);
        }
    }

    private _incrementValueCount(value: string) {
        if (!value) {
            return;
        }

        this.valueCountMap.set(value, this.count(value) + 1);
    }
}