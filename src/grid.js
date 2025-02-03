// grid.js
import { generateRandomGenome } from './genome.js';

export function createGrid(size) {
  const grid = new Array(size);
  for (let y = 0; y < size; y++) {
    grid[y] = new Array(size);
    for (let x = 0; x < size; x++) {
      grid[y][x] = createEmptyCell();
    }
  }
  return grid;
}

export function createEmptyCell() {
  return {
    age: -1,
    state: 0,
    genome: null,
    energy: 0,
    energyLeft: 0
    // ,
    // actionRules: Array(8).fill([]),
    // actionValues: Array(8).fill(0)
  };
}

export function copyGrid(sourceGrid) {
  const size = sourceGrid.length;
  const newGrid = new Array(size);
  for (let y = 0; y < size; y++) {
    newGrid[y] = new Array(size);
    for (let x = 0; x < size; x++) {
      newGrid[y][x] = deepCloneCell(sourceGrid[y][x]);
    }
  }
  return newGrid;
}

// If the genome has arrays of arrays (like actionRules), we can do a deeper copy:
// const clonedActionRules = cell.genome.actionRules
//   ? cell.genome.actionRules.map(ruleArr => [...ruleArr]) // each sub-array cloned
//   : [];

export function deepCloneCell(cell) {
  return {
    age: cell.age,
    state: cell.state,
    genome: cell.genome ? {
      survivalRules: [...cell.genome.survivalRules],
      birth: [...cell.genome.birth],
      moveRules: [...cell.genome.moveRules],
      actionRules: cell.genome.actionRules
        ? cell.genome.actionRules.map(rule => [...rule])
        : [],
      actionValues: cell.genome.actionValues
        ? [...cell.genome.actionValues]
        : []
    } : null,
    energy: cell.energy,
    energyLeft: cell.energyLeft
  };
}


export function initializeGrid(grid) {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (Math.random() < 0.2) {
        grid[y][x].age = 0;
        grid[y][x].state = 1;
        // In a complete implementation, you would set genome via generateRandomGenome()
        grid[y][x].genome = generateRandomGenome();
        grid[y][x].energy = 100;
      }
    }
  }
}

export function addCrossObstacles(grid, gridSize) {
  const mid = Math.floor(gridSize / 2);
  const length = Math.floor(gridSize / 3);
  for (let x = mid; x < mid + length; x++) {
    grid[mid][x].state = -1;
  }
  for (let y = mid; y < mid + length; y++) {
    grid[y][mid].state = -1;
  }
  for (let y = mid - length; y < mid; y++) {
    grid[y][mid].state = -1;
  }
  for (let x = mid - length; x < mid; x++) {
    grid[mid][x].state = -1;
  }
}

export function drawGrid(grid, ctx, cellSize, canvasWidth, canvasHeight) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  const gridSize = grid.length;
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = grid[y][x];
      if (cell.state === 1) {
        const colorValue = Math.max(0, 255 - cell.age);

        const actionColorValue = cell.genome.actionRules.length > 0 ? colorValue : 0;

        if (cell.genome && cell.genome.moveRules && cell.genome.moveRules.length > 0) {
          // Use different colors based on genome.birth as an example.
          ctx.fillStyle = cell.genome.birth && cell.genome.birth[0] ?
            `rgb(${colorValue}, ${colorValue / 2}, ${actionColorValue})` :
            `rgb(${colorValue}, ${colorValue}, ${actionColorValue})`;
        } else {
          // cell without moveRules
          ctx.fillStyle = `rgb(${colorValue}, 0, ${actionColorValue})`;
        }
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      } else if (cell.state === -1) {
        ctx.fillStyle = 'grey';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      } else if (cell.energyLeft > 0) {
        const energyRatio = cell.energyLeft / 10;
        const cValue = Math.floor(energyRatio * 255);
        ctx.fillStyle = `rgb(0, ${cValue}, 0)`;
        const energySize = cellSize / 2;
        ctx.fillRect(x * cellSize + cellSize / 4, y * cellSize + cellSize / 4, energySize, energySize);
      }
    }
  }
}

export function initializeGridWithWorld(game, grid) {
  game.currentGrid = createGrid(game.gridSize);
  game.nextGrid = createGrid(game.gridSize);

  const offsetY = Math.floor((game.gridSize - grid.length) / 2);
  const offsetX = Math.floor((game.gridSize - grid[0].length) / 2);

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const newY = y + offsetY;
      const newX = x + offsetX;
      if (newY >= 0 && newY < game.gridSize && newX >= 0 && newX < game.gridSize) {
        game.currentGrid[newY][newX].state = grid[y][x];
        if (grid[y][x] > 0) {
          game.currentGrid[newY][newX].energy = 100;
          game.currentGrid[newY][newX].genome =
            (game.genomeTypes[grid[y][x]] || (() => null))();
        }
      }
    }
  }
}
