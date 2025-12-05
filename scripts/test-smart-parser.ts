
import { VariantParser } from '../src/lib/variant-parser';

// Mock descriptions
const sizeExamples: string[] = [
    "PRIORITY GTX JACKET - BLACK (S)",
    "PRIORITY GTX JACKET - BLACK (M)",
    "PRIORITY GTX JACKET - BLACK (L)",
    "PRIORITY GTX JACKET - BLACK (XL)"
];

const singleExample: string[] = [
    "JACKET PRIORITY GTX BLACK/IRON GREY M"
];

const userExample: string[] = [
    "JACKET PRIORITY GTX BLACK/IRON GREY M",
    "JACKET PRIORITY GTX BLACK/IRON GREY L",
    "JACKET PRIORITY GTX BLACK/IRON GREY XL"
];

function runTest(name: string, input: string[]) {
    console.log(`\n--- Test Case: ${name} ---`);
    const result = VariantParser.detectCommonPattern(input);
    console.log("Detected Option Name:", result.optionName);
    console.log("Common Base Name:", result.commonBaseName);
    console.log("Variants:");
    result.variants.forEach((v: any) => {
        console.log(`  - [${v.optionValue}] (Base: "${v.baseName}")`);
    });
}

runTest("Sizes", sizeExamples);
runTest("User Example", userExample);
