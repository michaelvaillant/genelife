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

export function handleMovements(game) {
  let movementIntents = {};
  for (let y = game.gridSize - 1; y >= 0; y--) {
    for (let x = game.gridSize - 1; x >= 0; x--) {
      const cell = deepCloneCell(game.currentGrid[y][x]);
      if (cell.state !== 0) {
        let targetX = x, targetY = y;
        if (cell.state > 0 && cell.genome && cell.genome.moveRules && cell.genome.moveRules.length > 0) {
          const dir = cell.genome.moveRules[0];
          const [dx, dy] = game.getDirectionOffset(dir);
          targetX = (x + dx + game.gridSize) % game.gridSize;
          targetY = (y + dy + game.gridSize) % game.gridSize;
        }
        const targetKey = `${targetX},${targetY}`;
        if (!movementIntents[targetKey]) movementIntents[targetKey] = [];
        movementIntents[targetKey].push({ x, y, cell });
      }
    }
  }
  resolveMovementConflicts(game, movementIntents);
}

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

export function applyMovements(game, movementIntents) {
  for (const targetKey in movementIntents) {
    const intents = movementIntents[targetKey];
    const [targetX, targetY] = targetKey.split(',').map(Number);
    if (intents.length === 1) {
      const { x, y, cell } = intents[0];
      if (cell.state > 0 && cell.genome && cell.genome.moveRules && cell.genome.moveRules.length > 0) {
        game.moveCell(x, y, targetX, targetY, cell, game.nextGrid);
      } else {
        game.nextGrid[targetY][targetX] = {
          age: cell.age,
          state: cell.state,
          genome: cell.genome,
          energy: cell.energy,
          energyLeft: 0
        };
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
          game.cellDies(game.nextGrid, x, y, cell.energy / 15);
        }
      } else {
        const neighborsArr = game.getAliveNeighbors(game.currentGrid, x, y);
        const compatible = neighborsArr.filter(c => c.genome && c.genome.birth.includes(neighbors));
        if (compatible.length >= 2) {
          const parent1 = compatible[0];
          const parent2 = compatible[1];
          const childGenome = game.crossoverGenomes(parent1.genome, parent2.genome, parent1.energy, parent2.energy);
          let childEnergy = (parent1.energy + parent2.energy) / 2;
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
