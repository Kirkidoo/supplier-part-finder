export interface ParsedVariant {
    baseName: string;
    optionValue: string;
    optionName: string;
}

export class VariantParser {
    // Regex strategies
    // 1. (Size/Color) at end:  "JACKET BLACK (L)" -> Base: "JACKET BLACK", Option: "L"
    // 2. - Color (Size): "JACKET - BLACK (L)" -> Base: "JACKET", Option: "Black (L)"? Or split?

    // Let's start with a generic approach that aims to "normalize" the string.

    static parse(description: string): ParsedVariant {
        // Safe defaults
        let baseName = description;
        let optionValue = 'Default';
        let optionName = 'Title';

        if (!description) {
            return { baseName: '', optionValue: 'Default', optionName: 'Title' };
        }

        // Strategy 0: Look for " - " separator (Name - Variant)
        // Example: "PRIORITY GTX JACKET - BLACK/GREY (S)"
        const dashIndex = description.lastIndexOf(' - ');
        if (dashIndex > 0) {
            baseName = description.substring(0, dashIndex).trim();
            optionValue = description.substring(dashIndex + 3).trim();
            optionName = 'Variant'; // Generic, as it might be Color + Size

            // Refinement: If optionValue looks like just a size "(S)", treat as size
            if (/^\([^)]+\)$/.test(optionValue)) {
                optionName = 'Size';
                optionValue = optionValue.replace(/[()]/g, '');
            }
            // If it contains Color and Size: "BLACK/GREY (S)" -> leave as is?
            // "BLACK/GREY (S)" is a good Option Value for Shopify.
            return { baseName, optionValue, optionName };
        }

        // Strategy 1: Look for parenthesis at the end enclosing short alphanumeric text
        // Used for Sizes often: (S), (XL), (10), (110/90-19)
        const parenRegex = /\s*\(([^)]+)\)$/;
        const parenMatch = description.match(parenRegex);

        if (parenMatch) {
            const content = parenMatch[1];
            // Heuristic: If content is very long, it might be a description note, not a variant option.
            // But for now, let's assume it's the option.
            if (content.length < 20) {
                optionValue = content;
                baseName = description.replace(parenRegex, '').trim();
                optionName = 'Size'; // Guessing Size mostly
            } else {
                // Maybe check if it looks like a Tire Size? 120/70-17
                if (/^\d{3}\/\d{2}.?\d{2}$/.test(content)) {
                    optionValue = content;
                    baseName = description.replace(parenRegex, '').trim();
                    optionName = 'Tire Size';
                }
            }
        }

        return { baseName, optionValue, optionName };
    }

    /**
     * Group a list of items by their normalized base name.
     * @param items List of items with a 'description' property
     */
    static groupItems<T extends { description: string }>(items: T[]): Map<string, T[]> {
        const groups = new Map<string, T[]>();

        items.forEach(item => {
            const parsed = VariantParser.parse(item.description);
            const key = parsed.baseName;

            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)?.push(item);
        });

        return groups;
    }

    /**
     * Smartly detects common patterns in a list of variant descriptions.
     * Returns the detected structure for each variant.
     */
    static detectCommonPattern(descriptions: string[]): {
        optionName: string;
        commonBaseName: string;
        variants: ParsedVariant[];
    } {
        if (descriptions.length === 0) {
            return { optionName: 'Option', commonBaseName: '', variants: [] };
        }

        if (descriptions.length === 1) {
            const parsed = this.parse(descriptions[0]);
            return { optionName: parsed.optionName, commonBaseName: parsed.baseName, variants: [parsed] };
        }

        // 1. Find Longest Common Prefix
        let prefix = descriptions[0];
        for (let i = 1; i < descriptions.length; i++) {
            while (descriptions[i].indexOf(prefix) !== 0) {
                prefix = prefix.substring(0, prefix.length - 1);
                if (prefix === "") break;
            }
        }

        // Refine Prefix: Don't split words/numbers.
        // If the prefix ends in an alphanumeric char, and the next char in ANY description is also alphanumeric,
        // then we likely split a token (e.g. "Size 11" vs "Size 12" -> "Size 1").
        // We should backtrack to the last separator.
        if (prefix.length > 0 && /[a-zA-Z0-9]$/.test(prefix)) {
            // Check if we need to backtrack
            const cutsToken = descriptions.some(d => {
                const nextChar = d[prefix.length];
                return nextChar && /[a-zA-Z0-9]/.test(nextChar);
            });

            if (cutsToken) {
                // Backtrack to last safe separator
                const lastSeparator = prefix.search(/[^a-zA-Z0-9][a-zA-Z0-9]*$/);
                if (lastSeparator >= 0) {
                    prefix = prefix.substring(0, lastSeparator + 1); // Keep the separator
                } else {
                    // No separator found, maybe the whole thing is one changing word?
                    // e.g. "Apple" vs "Application" -> "Appl". Retain nothing?
                    // Or maybe it's "Item1", "Item2". If we backtrack, we get "".
                    prefix = "";
                }
            }
        }

        const results: ParsedVariant[] = descriptions.map(desc => {
            let variablePart = desc.substring(prefix.length).trim();

            // Cleanup: Remove leading/trailing non-alphanumerics often left by split
            // e.g. Prefix "Jacket", desc "Jacket - Red", variable "- Red" -> "Red"
            variablePart = variablePart.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');

            // Fallback if variable part is empty (e.g. strict duplicates)
            if (!variablePart) variablePart = 'Default';

            return {
                baseName: prefix.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''),
                optionValue: variablePart,
                optionName: 'Option' // Placeholder
            };
        });

        // 3. Guess Option Name from the variable parts
        const values = results.map(r => r.optionValue);
        const optionName = this.guessOptionName(values);

        results.forEach(r => r.optionName = optionName);

        // If prefix was empty, it means descriptions were totally different. 
        // Fallback to individual parse or keep as is?
        // If prefix length is < 3, it's probably not a real "Brand/Model" prefix. 
        if (prefix.length < 3) {
            // Fallback to per-item parsing if no commonality found
            const fallbackResults = descriptions.map(d => this.parse(d));
            // Try to unify option names? 
            // If all are "Size", use Size. If mixed, use "Option".
            const names = new Set(fallbackResults.map(r => r.optionName));
            const val = names.values().next().value;
            const consensusName = (names.size === 1 && val) ? val : 'Option';
            return {
                optionName: consensusName,
                commonBaseName: fallbackResults[0].baseName, // Best guess
                variants: fallbackResults.map(r => ({ ...r, optionName: consensusName }))
            };
        }

        const commonBaseName = prefix.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');

        return {
            optionName,
            commonBaseName,
            variants: results
        };
    }

    private static guessOptionName(values: string[]): string {
        // Heuristics
        const isSize = values.every(v =>
            // Matches: S, M, L, XL, XS, 2XL, 3XL, XXL, XXS, 2XS
            /^(?:(?:[1-5]?X)?[SL]|M|(?:[1-5]?X)L)$/i.test(v) ||
            // Matches: 32, 10.5, 10-1/2, 110/90
            /^\d+(?:[.,/-]\d+)?(?:cm|mm|in|"|'|oz|lbs)?$/i.test(v)
        );
        if (isSize) return 'Size';

        const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'grey', 'gray', 'silver', 'gold', 'chrome', 'beige', 'tan', 'brown', 'pink'];
        const isColor = values.every(v =>
            colors.some(c => v.toLowerCase().includes(c))
        );
        if (isColor) return 'Color';

        return 'Option';
    }
}
