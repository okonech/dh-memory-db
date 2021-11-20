import ReadLine from 'readline';
import { DatabaseError } from './errors/DatabaseError';
import { QueryParseError } from './errors/QueryParseError';
import { MemoryDb } from "./models/Database";

const readlineInterface = ReadLine.createInterface({
    input: process.stdin,
    output: process.stdout
})

/**
 * Block until user enters a line from stdin and return a promise with the typed response
 * @param query Text to place in front of prompt cursor
 * @returns string of the typed response
 */
const linePrompt = (query: string): Promise<string> => {
    return new Promise(resolve => readlineInterface.question(query, (ans: string) => resolve(ans)));
}

async function main() {
    const database = new MemoryDb();
    try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const lineIn = await linePrompt(">> ");
            if (lineIn === 'END') {
                break;
            }
            const query = database.query(lineIn);
            if (query) {
                console.log(query);
            }
        }
    } catch (err) {
        if (err instanceof QueryParseError || err instanceof DatabaseError) {
            console.error(err.message);
        } else {
            throw err;
        }
    }
    readlineInterface.close();
}

// run the main loop
main();
