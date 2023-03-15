import { ProficiencyRank } from "@item/data";
import { ProficiencyWithoutLevel } from "@system/proficiency-without-level";
import { Rarity } from "./data";

/**
 * Implementation of Difficulty Classes https://2e.aonprd.com/Rules.aspx?ID=552
 * and variant rule Proficiency Without Level https://2e.aonprd.com/Rules.aspx?ID=1370
 */

type NegativeDCAdjustment = "incredibly easy" | "very easy" | "easy" | "normal";

type PositiveDCAdjustment = "normal" | "hard" | "very hard" | "incredibly hard";

type DCAdjustment = NegativeDCAdjustment | PositiveDCAdjustment;

const adjustmentScale: DCAdjustment[] = [
    "incredibly easy",
    "very easy",
    "easy",
    "normal",
    "hard",
    "very hard",
    "incredibly hard",
];

const dcAdjustments = new Map<DCAdjustment, number>([
    ["incredibly easy", -10],
    ["very easy", -5],
    ["easy", -2],
    ["normal", 0],
    ["hard", 2],
    ["very hard", 5],
    ["incredibly hard", 10],
]);

const dcByLevel = new Map([
    [-1, 13],
    [0, 14],
    [1, 15],
    [2, 16],
    [3, 18],
    [4, 19],
    [5, 20],
    [6, 22],
    [7, 23],
    [8, 24],
    [9, 26],
    [10, 27],
    [11, 28],
    [12, 30],
    [13, 31],
    [14, 32],
    [15, 34],
    [16, 35],
    [17, 36],
    [18, 38],
    [19, 39],
    [20, 40],
    [21, 42],
    [22, 44],
    [23, 46],
    [24, 48],
    [25, 50],
]);

const simpleDCs = new Map<ProficiencyRank, number>([
    ["untrained", 10],
    ["trained", 15],
    ["expert", 20],
    ["master", 30],
    ["legendary", 40],
]);

function rarityToDCAdjustment(rarity: Rarity = "common"): PositiveDCAdjustment {
    switch (rarity) {
        case "uncommon":
            return "hard";
        case "rare":
            return "very hard";
        case "unique":
            return "incredibly hard";
        default:
            return "normal";
    }
}

function adjustDC(dc: number, adjustment: DCAdjustment = "normal") {
    return dc + (dcAdjustments.get(adjustment) ?? 0);
}

function adjustDCByRarity(dc: number, rarity: Rarity = "common") {
    return adjustDC(dc, rarityToDCAdjustment(rarity));
}

interface DCOptions {
    rarity?: Rarity;
}

/**
 * Normal Level Based DCs
 * @param level
 */
function calculateDC(level: number, { rarity = "common" }: DCOptions = {}): number {
    // assume level 0 if garbage comes in. We cast level to number because the backing data may actually have it
    // stored as a string, which we can't catch at compile time
    const dc: number = ProficiencyWithoutLevel.applyDC(dcByLevel.get(level) ?? 14, level);
    return adjustDCByRarity(dc, rarity);
}

function calculateSimpleDC(rank: ProficiencyRank): number {
    return ProficiencyWithoutLevel.applySimpleDC(simpleDCs.get(rank) ?? 10);
}

function calculateSpellDC(spellLevel: number): number {
    return calculateDC(spellLevel * 2 - 1, {});
}

/**
 * Used to shift DCs around the adjustment table Rarity increases
 * the adjustment while Lores reduce it.
 * This function determines which adjustment you start from when you
 * create a difficulty scale from incredibly easy to very hard
 *
 * Important: this operation is not associative because
 * of the lower and upper bounds
 */
function combineDCAdjustments(first: DCAdjustment, second: DCAdjustment): DCAdjustment {
    const startingIndex = adjustmentScale.indexOf(first);
    const lowerByIndex = adjustmentScale.indexOf(second);
    // -3 because index 3 (normal) is our 0
    const resultIndex = Math.min(Math.max(startingIndex + lowerByIndex - 3, 0), 6);
    return adjustmentScale[resultIndex];
}

/**
 * Given a DC made starting at an adjustment create an array of
 * growing difficulties starting from the adjusted position in
 * the table at https://2e.aonprd.com/Rules.aspx?ID=555
 */
function createDifficultyScale(dc: number, startAt: DCAdjustment): number[] {
    const beginAtIndex = adjustmentScale.indexOf(startAt);
    return adjustmentScale.filter((_value, index) => index >= beginAtIndex).map((value) => adjustDC(dc, value));
}

export {
    DCAdjustment,
    DCOptions,
    NegativeDCAdjustment,
    PositiveDCAdjustment,
    adjustDC,
    adjustDCByRarity,
    calculateDC,
    calculateSimpleDC,
    calculateSpellDC,
    combineDCAdjustments,
    createDifficultyScale,
    rarityToDCAdjustment,
};
