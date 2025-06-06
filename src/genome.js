// genome.js
import { config } from "./config.js";

export function generateRandomGenome() {
    const directions = [1, 2, 3, 4];
    let moveRules = [];
    let survivalRules = [];
    let birthRules = [];
    let actionRules = [];

    // Provide default actionRules (two sets for N,S,E,W)
    // let actionRules = [
    //     [5], [6], [7], [8],
    //     [5], [6], [7], [8],
    // ];

    // 🔄 10% chance => random action rules
    if (Math.random() < config.genetics.actionMutationRate) {
        // Generate random actionRules for each of the 8 slots
        // 50% chance to be empty, 50% chance to pick [5..8]
        actionRules = Array.from({ length: 8 }, () => {
            if (Math.random() < 0.5) {
                // 50% chance -> no action
                return [];
            } else {
                // 50% chance -> pick random from 5..8
                return [Math.floor(Math.random() * 4) + 5];
            }
        });
    } else {
        // 75% => no action rules
        actionRules = [];
    }



    // Possibly track whether this is a “mover”
    let mover = false;

    // "Pac-Man" type 
    if (Math.random() < config.genetics.pacmanProbability) {
        survivalRules = [0, 1, 2, 3, 4, 5, 6, 7];
        moveRules = Array(24).fill().map(
            () => directions[Math.floor(Math.random() * directions.length)]
        );
        // Return with actionRules included
        return {
            survivalRules,
            birth: birthRules,
            moveRules,
            actionRules,
            actionValues: Array(8).fill(0),  // optional if you need them
        };
    }

    // "Movers" (random chance 10%)
    if (Math.random() < config.genetics.moverProbability) {
        let numInstructions = Math.floor(Math.random() * 1 + 2);
        for (let i = 0; i < numInstructions; i++) {
            moveRules.push(directions[Math.floor(Math.random() * directions.length)]);
        }
        mover = true;
    }

    // Survival rules
    for (let i = 0; i < Math.floor(Math.random() * 3 + 4); i++) {       // 1 to 3
        // 2 to 4 il you want structures with voids and labyrinths
        // survivalRules.push(Math.floor(Math.random() * 3 + 2));          // 2 to 4
        survivalRules.push(Math.floor(Math.random() * (config.genetics.survivalRuleRange[1] - config.genetics.survivalRuleRange[0] + 1)) + config.genetics.survivalRuleRange[0]);
    }

    // Birth rules
    // for (let i = 0; i < Math.floor(Math.random() * 3 ); i++) {       // 1 to 3
    //     birthRules.push(Math.floor(Math.random() * 3 + 1));          // 2 to 4
    // }

        
    // birthRules.push([3, 4, 5][Math.floor(Math.random() * 4)]);
    birthRules.push(config.genetics.birthRuleOptions[Math.floor(Math.random() * config.genetics.birthRuleOptions.length)]);


    // Return a new genome with everything
    return {
        survivalRules,
        birth: birthRules,
        moveRules,
        actionRules,
        actionValues: Array(8).fill(0)
    };
}


export function deepCloneCell(cell) {
    return {
        age: cell.age,
        state: cell.state,
        genome: cell.genome ? {
            survivalRules: [...cell.genome.survivalRules],
            birth: [...cell.genome.birth],
            moveRules: [...cell.genome.moveRules]
        } : null,
        energy: cell.energy,
        energyLeft: cell.energyLeft
    };
}

export function getDirectionOffset(dir) {
    switch (dir) {
        case 1: case 5: return [0, -1]; // North
        case 2: case 6: return [0, 1];  // South
        case 3: case 7: return [1, 0];  // East
        case 4: case 8: return [-1, 0]; // West
        default: return [0, 0];
    }
}


export function moveCell(game, x, y, targetX, targetY, cell, nextGrid) {
    let energy = cell.energy;
    // Clone or reference the current array of moves
    let moveRules = [...cell.genome.moveRules];
    const targetCell = game.currentGrid[targetY][targetX];
    // The "executedMove" is the rule at the front (index 0)
    const executedMove = moveRules.length > 0
        ? moveRules[0]
        : null;

    // Distinguish normal (1..4) from action (>=5)
    if (executedMove !== null) {
        if (executedMove >= 1 && executedMove <= 4) {
            // Normal homeostatic move → re-append it
            moveRules.push(moveRules.shift());
        } else if (executedMove >= 5) {
            // Action move → consume it (remove but do NOT re-append)
            moveRules.shift();
        }
        // If executedMove is 0 or null, neither re-append nor shift
    }

    
    if (cell.genome.birth.length > 0) energy -= game.energyMoveCost; // e.g. some cost for moving and birth-capable” genome


    if (energy <= 0) {
        game.cellDies(nextGrid, x, y, cell.genome.moveRules.length + cell.genome.birth.length + cell.genome.survivalRules.length);
        return;
    }

    // Absorb leftover energy from target cell
    energy += targetCell.energyLeft;
    targetCell.energyLeft = 0;  
    // Cap Max energy
    if (energy > game.energyCellMax) energy = game.energyCellMax;
    
    // Now update the cell's moveRules in the genome
    // moveRules.push(moveRules.shift());
    cell.genome.moveRules = moveRules;
    // Place the moved cell in nextGrid
    nextGrid[targetY][targetX] = { age: cell.age, state: 1, genome: cell.genome, energy, energyLeft: 0 };

}


/**
 * Creates a child genome from two parent genomes,
 * crossing over survivalRules, birth, moveRules, and actionRules.
 * Optionally resets or crosses actionValues, depending on your choice.
 */
export function crossoverGenomes(genome1, genome2, energy1, energy2) {
    const childGenome = {
        survivalRules: [],
        birth: [],
        moveRules: [],
        actionRules: [],
        actionValues: []
    };

    // --- Survival Rules ---
    // We'll iterate up to the max length of the two parents.
    // At each index, we randomly pick parent1 or parent2's rule,
    // and if that rule is undefined, we skip it (don't push anything).
    const maxSurv = Math.max(genome1.survivalRules.length, genome2.survivalRules.length);
    for (let i = 0; i < maxSurv; i++) {
        const pickParent1 = (Math.random() < 0.5);
        const chosenRule = pickParent1 ? genome1.survivalRules[i] : genome2.survivalRules[i];
        if (chosenRule !== undefined) {
            childGenome.survivalRules.push(chosenRule);
        }
    }

    // --- Birth Rules ---
    // If birth is also an array, do the same approach. 
    // (If birth is just a single-element array in the design, we can pick randomly or do a different method.)
    const maxBirth = Math.max(genome1.birth.length, genome2.birth.length);
    for (let i = 0; i < maxBirth; i++) {
        const pickParent1 = (Math.random() < 0.5);
        const chosenRule = pickParent1 ? genome1.birth[i] : genome2.birth[i];
        if (chosenRule !== undefined) {
            childGenome.birth.push(chosenRule);
        }
    }

    // --- Move Rules ---
    childGenome.moveRules = crossoverMoveRules(
        genome1.moveRules,
        genome2.moveRules,
        energy1,
        energy2
    );

    // --- Action Rules ---
    childGenome.actionRules = crossoverActionRules(
        genome1.actionRules || [],
        genome2.actionRules || []
    );

    // --- Reset Action Values ---
    childGenome.actionValues = Array(8).fill(0);


    return childGenome;
}

/**
 * Merge two parents' moveRules into a child's moveRules, with optional
 * "mutation" logic if either parent's energy is low.
 *
 * @param {number[]} rules1 - array of move instructions from parent1
 * @param {number[]} rules2 - array of move instructions from parent2
 * @param {number}   energy1 - parent's available energy
 * @param {number}   energy2 - other parent's available energy
 * @returns {number[]} an array of child move instructions
 */
export function crossoverMoveRules(rules1, rules2, energy1, energy2) {
    // 1) Filter out any instructions >= 5
    const filtered1 = rules1.filter((m) => m >= 1 && m <= 4);
    const filtered2 = rules2.filter((m) => m >= 1 && m <= 4);

    // 2) Crossover with optional mutation
    const childRules = [];
    const maxLength = config.genetics.genomeLengthRange[0]; // Math.max(filtered1.length, filtered2.length);
    const minLength = config.genetics.genomeLengthRange[1]; // Math.min(filtered1.length, filtered2.length);
    const childLength = Math.floor(Math.random() * (maxLength - minLength + 1) )+ minLength

    for (let i = 0; i < childLength; i++) {
        let instruction = null;
        const instr1 = filtered1[i] || null;
        const instr2 = filtered2[i] || null;

        const lowEnergy = (energy1 < config.genetics.mutationThresholdEnergy || energy2 < config.genetics.mutationThresholdEnergy);
        const mutation = lowEnergy && Math.random() < config.genetics.mutationProbability;

        if (mutation) {
            // Possibly add BOTH instructions if both exist
            if (instr1 !== null && instr2 !== null) {
                childRules.push(instr1);
                if (childRules.length < childLength) {
                    childRules.push(instr2);
                }
            } else {
                // Or whichever is non-null
                instruction = instr1 !== null ? instr1 : instr2;
            }
        } else {
            // Normal cross
            if (instr1 !== null && instr2 !== null) {
                instruction = Math.random() < 0.5 ? instr1 : instr2;
            } else {
                instruction = instr1 !== null ? instr1 : instr2;
            }
        }
        if (instruction !== null) {
            childRules.push(instruction);
        }
        if (childRules.length === maxLength) break;
    }
    // console.log(childRules);
    return childRules;
}

/**
 * Merge two parents' actionRules "slot by slot" with special logic:
 *  - If both parents have a non-empty array at slot i, pick one at 50% (no forgetting).
 *  - If only one parent has a non-empty array, 50% chance to copy it,
 *    but if we do copy, there's a 5% chance we forget it (replace it with [] anyway).
 *  - If both are empty, child[i] = [].
 *
 * @param {Array[]} a1 - parent1's array-of-arrays for action rules
 * @param {Array[]} a2 - parent2's array-of-arrays for action rules
 * @returns {Array[]} child's array-of-arrays
 */
export function crossoverActionRules(a1, a2) {
    const child = [];
    // We'll check up to 8 slots 
    const length = Math.max(a1.length, a2.length, 8);

    for (let i = 0; i < length; i++) {
        const arr1 = a1[i] || [];
        const arr2 = a2[i] || [];

        const hasArr1 = arr1.length > 0;
        const hasArr2 = arr2.length > 0;

        if (hasArr1 && hasArr2) {
            // Case 1: BOTH parents have non-empty actionRules at this slot
            // 50% pick parent's arr1, 50% pick arr2
            child[i] = (Math.random() < 0.5) ? [...arr1] : [...arr2];

        } else if (hasArr1 && !hasArr2) {
            // Case 2: ONLY parent1 has a non-empty array
            //   50% copy, 50% empty
            //   If we copy, there's a 5% chance we "forget" it => empty anyway
            if (Math.random() < 0.5) {
                // We adopt arr1, but 5% chance we forget
                if (Math.random() < config.genetics.forgotGenomeProb) {
                    child[i] = [];
                } else {
                    child[i] = [...arr1];
                }
            } else {
                // We do not adopt
                child[i] = [];
            }

        } else if (!hasArr1 && hasArr2) {
            // Case 3: ONLY parent2 has a non-empty array
            //   50% copy, 50% empty
            //   If we copy, there's a 5% chance we "forget" it => empty anyway
            if (Math.random() < 0.5) {
                // We adopt arr2, but 5% chance we forget
                if (Math.random() < config.genetics.forgotGenomeProb) {
                    child[i] = [];
                } else {
                    child[i] = [...arr2];
                }
            } else {
                // We do not adopt
                child[i] = [];
            }

        } else {
            // Case 4: both arr1 and arr2 are empty => child is empty
            child[i] = [];
        }
    }

    const hasNonEmptyRule = child.some(rule => rule.length > 0);
    return hasNonEmptyRule ? child : [];
}

export function defineGenomes(game) {
    game.genomeTypes = {
        1: () => ({ survivalRules: [2, 3], birth: [3], moveRules: [], actionRules: [], actionValues: [] }),
        2: () => ({ survivalRules: [2, 3], birth: [3], moveRules: [1, 1, 3, 3], actionRules: [], actionValues: [] }),
        3: () => ({ survivalRules: [2, 3], birth: [4], moveRules: [1, 1, 3, 3], actionRules: [], actionValues: [] }),
        4: () => ({ survivalRules: [3, 4], birth: [3, 4], moveRules: [], actionRules: [], actionValues: [] }),
        5: () => ({ survivalRules: [2, 4], birth: [2], moveRules: [], actionRules: [], actionValues: [] }),

        // an example “special” cell with prefilled actionRules
        9: () => ({
            survivalRules: [2, 3],
            birth: [3],
            moveRules: [],
            actionRules: [
                [5], [6], [7], [8],
                [5], [6], [7], [8]
            ],
            actionValues: Array(8).fill(0)
        })
    };
}

export function getGenome(game, type) {
    return game.genomeTypes[type] ? game.genomeTypes[type]() : generateRandomGenome();
}
