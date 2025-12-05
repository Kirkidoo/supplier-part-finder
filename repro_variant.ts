
import { VariantParser } from './src/lib/variant-parser';

const examples = [
    "VOYAGER DRYO JACKET - BLUE/GREY (L)",
    "VOYAGER DRYO JACKET - EARTH BROWN/BLACK (S)"
];

console.log("Parsing individual items:");
examples.forEach(ex => {
    const parsed = VariantParser.parse(ex);
    console.log(`"${ex}" -> Base: "${parsed.baseName}", Option: "${parsed.optionValue}"`);
});

const objects = examples.map(d => ({ description: d }));
const grouped = VariantParser.groupItems(objects);

console.log("\nGrouping results:");
grouped.forEach((items, key) => {
    console.log(`Key: "${key}" has ${items.length} items.`);
});

const detection = VariantParser.detectCommonPattern(examples);
console.log("\nCommon Pattern Detection:");
console.log(JSON.stringify(detection, null, 2));
