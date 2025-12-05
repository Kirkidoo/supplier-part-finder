import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), '..', 'itlCanada.csv');
console.log(`Reading ${filePath}`);
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');
let found = 0;
for (const line of lines) {
    if (line.toLowerCase().includes('jacket')) {
        console.log(`Found match:`);
        console.log(line);
        found++;
        if (found > 5) break;
    }
}

if (found === 0) {
    console.log("Jacket NOT found in raw file via script scan.");
}
