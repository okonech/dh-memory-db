
import { MemoryDb } from './Database';

let database: MemoryDb;

beforeEach(() => {
    // reset database between tests
    database = new MemoryDb();
});

test('Example #1', () => {
    expect(database.query('GET a')).toStrictEqual('NULL');
    database.query('SET a foo');
    database.query('SET b foo');
    expect(database.query('COUNT foo')).toStrictEqual(2);
    expect(database.query('COUNT bar')).toStrictEqual(0);
    database.query('DELETE a');
    expect(database.query('COUNT foo')).toStrictEqual(1);
    database.query('SET b baz');
    expect(database.query('COUNT foo')).toStrictEqual(0);
    expect(database.query('GET b')).toStrictEqual('baz');
    expect(database.query('GET B')).toStrictEqual('NULL');
});

test('Example #2', () => {
    database.query('SET a foo');
    database.query('SET a foo');
    expect(database.query('COUNT foo')).toStrictEqual(1);
    expect(database.query('GET a')).toStrictEqual('foo');
    database.query('DELETE a');
    expect(database.query('GET a')).toStrictEqual('NULL');
    expect(database.query('COUNT foo')).toStrictEqual(0);
});

test('Example #3', () => {
    database.query('BEGIN');
    database.query('SET a foo');
    expect(database.query('GET a')).toStrictEqual('foo');
    database.query('BEGIN');
    database.query('SET a bar');
    expect(database.query('GET a')).toStrictEqual('bar');
    database.query('SET a baz');
    database.query('ROLLBACK');
    expect(database.query('GET a')).toStrictEqual('foo');
    database.query('ROLLBACK');
    expect(database.query('GET a')).toStrictEqual('NULL');
});

test('Example #4', () => {
    database.query('SET a foo');
    database.query('SET b baz');
    database.query('BEGIN');
    expect(database.query('GET a')).toStrictEqual('foo');
    database.query('SET a bar');
    expect(database.query('COUNT bar')).toStrictEqual(1);
    database.query('BEGIN');
    expect(database.query('COUNT bar')).toStrictEqual(1);
    database.query('DELETE a');
    expect(database.query('GET a')).toStrictEqual('NULL');
    expect(database.query('COUNT bar')).toStrictEqual(0);
    database.query('ROLLBACK');
    expect(database.query('GET a')).toStrictEqual('bar');
    expect(database.query('COUNT bar')).toStrictEqual(1);
    database.query('COMMIT');
    expect(database.query('GET a')).toStrictEqual('bar');
    expect(database.query('GET b')).toStrictEqual('baz');
});
