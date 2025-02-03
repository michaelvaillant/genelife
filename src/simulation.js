// simulation.js
import { createGrid, deepCloneCell } from './grid.js';

export function update(game) {
    if (game.isPaused) {
        setTimeout(() => game.update(), game.speed);
        return;
    }
    game.generationCount++;
    document.getElementById('round').innerText = `${game.generationCount}`;

    game.nextGrid = createGrid(game.gridSize);
    handleMovements(game);
    handleSurvivalAndReproduction(game);

    // Swap grids and redraw
    [game.currentGrid, game.nextGrid] = [game.nextGrid, game.currentGrid];
    game.drawGrid(game.currentGrid, game.ctx, game.cellSize, game.gameCanvas.width, game.gameCanvas.height);
    game.updateGraphData();
    game.drawGraph();

    setTimeout(() => game.update(), game.speed);
}

// Called each tick before handleSurvivalAndReproduction:
export function handleMovements(game) {
    let movementIntents = {};

    // Loop over all cells (top-to-bottom or bottom-to-top is your choice)
    for (let y = 0; y < game.gridSize; y++) {
        for (let x = 0; x < game.gridSize; x++) {
            const cell = deepCloneCell(game.currentGrid[y][x]);

            // 1) skip empty or obstacle cells
            if (cell.state === 0) continue;
            if (cell.state === -1) continue;
            
            // 2) for living cells with a genome apply actionRules logic
            if (cell.state === 1 && cell.genome) {
                // Evaluate environment to fill cell.actionValues
                calculateActionRules(cell, game.currentGrid, x, y, game.gridSize);

                // Pick the strongest action from actionRules, push into moveRules
                selectDominantAction(cell);

                // Now retrieve the "current" move direction
                let dir = null;
                if (cell.genome.moveRules && cell.genome.moveRules.length > 0) {
                    // console.log(cell.genome.moveRules);
                    // If you still rotate your moveRules, do so; or just read index 0
                    dir = cell.genome.moveRules[0];
                }

                // Calculate proposed target coords
                const [dx, dy] = game.getDirectionOffset(dir || 0); // 0 = no movement if null
                const targetX = (x + dx + game.gridSize) % game.gridSize;
                const targetY = (y + dy + game.gridSize) % game.gridSize;

                if (game.currentGrid[targetY][targetX].state === -1) {
                    const originalKey = `${x},${y}`;
                    if (!movementIntents[originalKey]) {
                      movementIntents[originalKey] = [];
                    }
                    movementIntents[originalKey].push({ x, y, cell });
                } else {
                    // Normal move
                    const targetKey = `${targetX},${targetY}`;
                    if (!movementIntents[targetKey]) {
                      movementIntents[targetKey] = [];
                    }
                    movementIntents[targetKey].push({ x, y, cell });
                }
            }
        }
    }
    // Once we gather all movement intentions, resolve collisions
    resolveMovementConflicts(game, movementIntents);
}

/**
 * Calculate “action values” for each of the four cardinal directions
 * and store them in cell.genome.actionValues.
 * 
 * @param {object} cell - the cell whose action rules we’re calculating
 * @param {array}  grid - 2D array of all cells
 * @param {number} x, y - coordinates of the cell
 * @param {number} gridSize
 */
export function calculateActionRules(cell, grid, x, y, gridSize) {
    // If there's no genome, or if it's missing actionValues, set them up
    if (!cell.genome) return;
    if (!cell.genome.actionValues) {
        // 8 slots total → first 4 for leftover energy sums, next 4 for live cell counts
        cell.genome.actionValues = Array(8).fill(0);
    }

    // Define directions & offsets
    const directions = ['N', 'S', 'E', 'W'];
    const offsets = {
        N: [
            [x, y - 1],
            [x, y - 2],
            [x - 1, y - 1],
            [x + 1, y - 1],
        ],
        S: [
            [x, y + 1],
            [x, y + 2],
            [x - 1, y + 1],
            [x + 1, y + 1],
        ],
        E: [
            [x + 1, y],
            [x + 2, y],
            [x + 1, y - 1],
            [x + 1, y + 1],
        ],
        W: [
            [x - 1, y],
            [x - 2, y],
            [x - 1, y - 1],
            [x - 1, y + 1],
        ]
    };

    // For i in 0..3, handle N,S,E,W
    for (let i = 0; i < 4; i++) {
        const offsetCases = offsets[directions[i]];

        // actionValues[i] = sum of leftover energy in that direction
        cell.genome.actionValues[i] = offsetCases.reduce((sum, [nx, ny]) => {
            if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) {
                return sum; // skip out-of-bounds (no wrapping)
            }
            const neighbor = grid[ny][nx];
            if (!neighbor) return sum;

            // If neighbor is empty and has leftover energy, add it
            if (neighbor.state === 0 && neighbor.energyLeft > 0) {
                return sum + neighbor.energyLeft;
            }
            return sum;
        }, 0);

        // actionValues[i + 4] = count of living cells in that direction
        cell.genome.actionValues[i + 4] = offsetCases.reduce((sum, [nx, ny]) => {
            if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) {
                return sum; // skip out-of-bounds
            }
            return sum + (grid[ny][nx].state === 1 ? 1 : 0);
        }, 0);
    }
}

/**
 * Finds which direction has the highest “actionValue”,
 * then merges the corresponding actionRules into moveRules.
 */
export function selectDominantAction(cell) {
    if (!cell.genome?.actionRules || !cell.genome?.actionValues) return;

    // On prend la valeur maximum des actionValues
    const maxVal = Math.max(...cell.genome.actionValues);
    // Si cette valeur max n’est pas > 0, on ne fait rien
    if (maxVal <= 0) return;

    const maxIndex = cell.genome.actionValues.indexOf(maxVal);
    if (maxIndex < 0) return;

    // e.g. push the best action's directions into moveRules
    const bestActions = cell.genome.actionRules[maxIndex] || [];
    if (bestActions.length > 0) {
        // cell.genome.moveRules.push(...bestActions);
        // console.log(cell.genome.actionValues, bestActions);
        cell.genome.moveRules.unshift(...bestActions);  // Push in Front !

        //   cell.genome.actionRules[maxIndex] = [];
        // Remove actionValues as they are one-time only:
        cell.genome.actionValues[maxIndex] = 0;
    }
}

/**
 * resolveMovementConflicts
 * 
 * Resolves collisions where multiple cells want to move into the same target cell.
 * - Iterates until no conflicts remain.
 * - If multiple cells want the same targetKey, reverts them to their original positions
 *   (unless a cell’s original position is the same as the target, meaning it’s not really moving).
 * - Produces a stable set of movementIntents without collisions.
 * 
 * @param {Object} game             - The main Game instance
 * @param {Object} movementIntents  - A dictionary of targetKey → array of movement attempts.
 *                                    targetKey is a string like "x,y".
 */
export function resolveMovementConflicts(game, movementIntents) {
    let conflictsExist = true;
    while (conflictsExist) {
        conflictsExist = false;
        let newIntents = {};
        for (const targetKey in movementIntents) {
            const intents = movementIntents[targetKey];
            if (intents.length > 1) {
                conflictsExist = true;
                for (const intent of intents) {
                    const { x, y, cell } = intent;
                    if (`${x},${y}` === targetKey) {
                        newIntents[targetKey] = newIntents[targetKey] || [];
                        newIntents[targetKey].push(intent);
                    } else {
                        const originalKey = `${x},${y}`;
                        newIntents[originalKey] = newIntents[originalKey] || [];
                        newIntents[originalKey].push({ x, y, cell });
                    }
                }
            } else {
                newIntents[targetKey] = newIntents[targetKey] || [];
                newIntents[targetKey].push(intents[0]);
            }
        }
        movementIntents = newIntents;
    }
    applyMovements(game, movementIntents);
}

/**
 * applyMovements
 *
 * Applies each finalized move to nextGrid.
 * - If the target cell is an obstacle, blocks the move.
 * - Otherwise calls game.moveCell(...) to finalize the move.
 * - If there's no movement or no genome, just copies the cell to nextGrid.
 *
 * @param {Object} game             - The main Game instance
 * @param {Object} movementIntents  - The final dictionary of targetKey → array of movement attempts.
 */
export function applyMovements(game, movementIntents) {
    for (const targetKey in movementIntents) {
        const intents = movementIntents[targetKey];
        const [targetX, targetY] = targetKey.split(',').map(Number);
        if (intents.length === 1) {
            const { x, y, cell } = intents[0];

            // 1) Check if the target is an obstacle
            if (game.currentGrid[targetY][targetX].state === -1) {
                // => It's a wall/obstacle, so do NOT move
                // Option A: Just place the cell back at (x,y) in nextGrid
                game.nextGrid[y][x] = {
                    age: cell.age,
                    state: cell.state,
                    genome: cell.genome,
                    energy: cell.energy,
                    energyLeft: cell.energyLeft
                };
                // Optionally re-append or consume the move. For example:
                //   If you want the cell to keep trying moves:
                //   cell.genome.moveRules.push(cell.genome.moveRules.shift());

            } else if (cell.state > 0 && cell.genome && cell.genome.moveRules && cell.genome.moveRules.length > 0) {
                // 2) Otherwise, normal move
                game.moveCell(x, y, targetX, targetY, cell, game.nextGrid);
            } else {
                // 3) If no move or no genome, just copy the cell in nextGrid
                game.nextGrid[targetY][targetX] = {
                    age: cell.age,
                    state: cell.state,
                    genome: cell.genome,
                    energy: cell.energy,
                    energyLeft: 0
                };
            }
            
            // remove the front action if it was an action rule
            if (cell.genome?.moveRules?.[0] >= 5) {
                cell.genome.moveRules.shift();
            }            
        }
    }
}


export function handleSurvivalAndReproduction(game) {
    for (let y = 0; y < game.gridSize; y++) {
        for (let x = 0; x < game.gridSize; x++) {
            const cell = game.nextGrid[y][x];
            const cellLast = game.currentGrid[y][x];
            if (cellLast.state === -1) {
                game.nextGrid[y][x] = { ...cellLast };
                continue;
            }
            if (cellLast.energyLeft > 0 && cell.state === 0) {
                game.nextGrid[y][x] = {
                    state: 0,
                    genome: null,
                    energy: 0,
                    energyLeft: cellLast.energyLeft,
                    age: -1
                };
            }
            const neighbors = game.countAliveNeighbors(game.currentGrid, x, y);
            if (cell.state === 1 && cell.genome) {
                if (cell.genome.birth[0]) cell.age += 1;
                const survivalRules = cell.genome.survivalRules;
                if (!survivalRules.includes(neighbors) && !cell.genome.birth.includes(neighbors)) {
                    game.cellDies(game.nextGrid, x, y, cell.energy / game.energyDieRatio);
                }
            } else {
                const neighborsArr = game.getAliveNeighbors(game.currentGrid, x, y);
                const compatible = neighborsArr.filter(c => c.genome && c.genome.birth.includes(neighbors));
                if (compatible.length >= 2) {
                    const parent1 = compatible[0];
                    const parent2 = compatible[1];
                    const childGenome = game.crossoverGenomes(parent1.genome, parent2.genome, parent1.energy, parent2.energy);
                    let childEnergy = (parent1.energy + parent2.energy) / game.energyChildRatio;
                    game.nextGrid[y][x] = {
                        state: 1,
                        genome: childGenome,
                        energy: childEnergy,
                        energyLeft: 0,
                        age: 0
                    };
                }
            }
        }
    }
}

export function countAliveNeighbors(grid, x, y, gridSize) {
    let count = 0;
    for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
            if (i === 0 && j === 0) continue;
            const nx = (x + i + gridSize) % gridSize;
            const ny = (y + j + gridSize) % gridSize;
            if (grid[ny][nx].state === 1) count++;
        }
    }
    return count;
}

export function getAliveNeighbors(grid, x, y, gridSize) {
    const neighbors = [];
    for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
            if (i === 0 && j === 0) continue;
            const nx = (x + i + gridSize) % gridSize;
            const ny = (y + j + gridSize) % gridSize;
            if (grid[ny][nx].state === 1) neighbors.push(grid[ny][nx]);
        }
    }
    return neighbors;
}
