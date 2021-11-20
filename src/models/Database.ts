import { QueryParseError } from '../errors/QueryParseError';
import { MemoryStore } from "./MemoryStore";

export class MemoryDb {

    private _memoryStore: MemoryStore;

    /**
     * Keeps track of if at least 1 transaction has begun and has not been committed
     */
    private _txnExists = false;

    /**
     * Keeps a stack of sets containing modified keys. 
     * A set contains all keys modified in the current txn (until COMMIT or next BEGIN)
     */
    private _txnVariablesStack: Set<string>[] = [];

    constructor() {
        this._memoryStore = new MemoryStore();
    }

    /**
     * Execute the desired query command, parsed from a string
     * @param qry the user entered string to parse
     * @returns a value from implemented db functions to return to the user
     */
    query(qry: string): unknown {
        const [cmd, key, value, ...rest] = qry.split(' ');
        if (rest.length > 0) {
            throw new QueryParseError(`Query ${qry} has too many arguments`);
        }
        switch (cmd.toLowerCase()) {
            case 'set':
                return this.set(key, value);
            case 'get':
                return this.get(key);
            case 'delete':
                return this.delete(key);
            case 'count':
                return this.count(key);
            case 'begin':
                return this.begin();
            case 'rollback':
                return this.rollback();
            case 'commit':
                return this.commit();
            default:
                throw new QueryParseError(`Unable to parse query: ${qry}`);
        }
    }

    get(key: string): string {
        if (!key) {
            throw new QueryParseError(`Invalid query. A key must be specified for GET command`);
        }
        // TODO: should probably return a null symbol to avoid confusion on value of 'NULL' string
        return this._memoryStore.get(key) || 'NULL';
    }

    set(key: string, value: string): void {
        if (!key || !value) {
            throw new QueryParseError(`Invalid query. A key and value must be specified for SET command`);
        }
        this._memoryStore.set(key, value, this._shouldStackForTxn(key));
        // mark current key as modified in txn if txn exists
        this._updateModifiedKeyForTxn(key);
    }

    delete(key: string): void {
        if (!key) {
            throw new QueryParseError(`Invalid query. A key must be specified for DELETE command`);
        }
        this._memoryStore.delete(key, this._shouldStackForTxn(key));
        // mark current key as modified in txn if txn exists
        this._updateModifiedKeyForTxn(key);
    }

    count(value: string): number {
        if (!value) {
            throw new QueryParseError(`Invalid query. A value must be specified for COUNT command`);
        }
        return this._memoryStore.count(value);
    }

    begin(): void {
        this._txnExists = true;
        this._txnVariablesStack.push(new Set());
    }

    rollback(): void {
        const modifiedVars = this._txnVariablesStack.pop() || [];

        // roll back values for each key modified in this transaction
        modifiedVars.forEach(key => this._memoryStore.revert(key));

        if (this._txnVariablesStack.length === 0) {
            this._txnExists = false;
        }
    }

    commit(): void {
        // collect each modified var from all current transactions
        const modifiedVars = this._txnVariablesStack.reduce((acc, curr) => {
            return new Set([...acc, ...curr]);
        }, new Set<string>());
        modifiedVars.forEach(key => this._memoryStore.flatten(key));

        // no transactions can exist after a commit
        this._txnVariablesStack = [];
        this._txnExists = false;
    }

    /**
     * If a transaction exists, add the key to the set of keys modified in the current transaction
     */
    private _updateModifiedKeyForTxn(key: string) {
        if (!this._txnExists) {
            return;
        }
        this._txnVariablesStack[this._txnVariablesStack.length - 1].add(key);
    }

    /**
     * If a transaction exists and the current variable was already edited in it, return false
     * Treats a variable as though it was not in a transaction so it's current value will be overwritten rather than saved
     */
    private _shouldStackForTxn(key: string): boolean {
        if (!this._txnExists) {
            return false;
        }
        // key update should stack if it's not included in the current transaction already
        return !this._txnVariablesStack[this._txnVariablesStack.length - 1].has(key);
    }

}