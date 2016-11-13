// Lookahead keys are 32Bit integers in the form
// TTTTTTTTT-ZZZZZZZZZZZZZZZ-YYYY-XXXX
// XXXX -> Occurrence Index bitmap.
// YYYY -> DSL Method Name bitmap.
// ZZZZZZZZZZZZZZZ -> Rule short Index bitmap.
// TTTTTTTTT -> alternation alternative index bitmap


export const BITS_FOR_METHOD_IDX = 4
export const BITS_FOR_OCCURRENCE_IDX = 4
export const BITS_FOR_RULE_IDX = 24
// TODO: validation, this means that there may at most 2^8 --> 256 alternatives for an alternation.
export const BITS_FOR_ALT_IDX = 8

// short string used as part of mapping keys.
// being short improves the performance when composing KEYS for maps out of these
// The 4 - 7 bits (16 possible values, are reserved for the DSL method indices)
/* tslint:disable */
export const OR_IDX = 1 << BITS_FOR_METHOD_IDX
export const OPTION_IDX = 2 << BITS_FOR_METHOD_IDX
export const MANY_IDX = 3 << BITS_FOR_METHOD_IDX
export const AT_LEAST_ONE_IDX = 4 << BITS_FOR_METHOD_IDX
export const MANY_SEP_IDX = 5 << BITS_FOR_METHOD_IDX
export const AT_LEAST_ONE_SEP_IDX = 6 << BITS_FOR_METHOD_IDX
/* tslint:enable */

// this actually returns a number, but it is always used as a string (object prop key)
export function getKeyForAutomaticLookahead(ruleIdx:number, dslMethodIdx:number, occurrence:number):number {
    /* tslint:disable */
    return occurrence | dslMethodIdx | ruleIdx
    /* tslint:enable */
}

const BITS_START_FOR_ALT_IDX = 32 - BITS_FOR_ALT_IDX
export function getKeyForAltIndex(ruleIdx:number, dslMethodIdx:number, occurrence:number, altIdx:number):number {
    /* tslint:disable */
    // alternative indices are zero based, thus must always add one (turn on one bit) to guarantee uniqueness.
    let altIdxBitMap = (altIdx + 1) << BITS_START_FOR_ALT_IDX
    return getKeyForAutomaticLookahead(ruleIdx, dslMethodIdx, occurrence) | altIdxBitMap
    /* tslint:enable */
}
