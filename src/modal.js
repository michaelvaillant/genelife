// modal.js
import { createGrid, initializeGridWithWorld  } from './grid.js';

export function openResetModal(game) {
    game.currentSeedOption.textContent = game.seed;
    if (!isNaN(game.seed) && game.seed !== "") {
      document.getElementById('currentOption').checked = true;
    } else {
      document.getElementById('randomOption').checked = true;
    }
    game.resetModal.style.display = 'flex';
  }
  
  export function closeResetModal(game) {
    game.resetModal.style.display = 'none';
  }
  
  export function applyReset(game) {
    const selectedOption = game.resetForm.querySelector('input[name="seedOption"]:checked').value;
    if (selectedOption === 'random') {
      game.seed = Math.floor(Math.random() * 100000);
      document.getElementById('seed').value = game.seed;
      game.initGame();
    } else if (selectedOption === 'current') {
      game.seed = parseInt(game.currentSeedOption.textContent, 10);
      document.getElementById('seed').value = game.seed;
      game.initGame();
    } else {
      const worldId = parseInt(selectedOption, 10);
      const world = game.worlds[worldId];
      if (world) {
        game.seed = world.name;
        document.getElementById('seed').value = game.seed;
        initializeGridWithWorld(game, world.grid);
        game.drawGrid(game.currentGrid, game.ctx, game.cellSize, game.gameCanvas.width, game.gameCanvas.height);
      } else {
        console.error(`World with ID ${worldId} not found.`);
      }
    }
    closeResetModal(game);
  }
  
  export function changeSeed(game, event) {
    game.seed = event.target.value;
    game.initGame();
    event.target.blur();
  }
  
  export function resizeBoard(game, event) {
    const newSize = parseInt(event.target.value);
    resizeGameBoard(game, newSize);
    event.target.blur();
  }
  
  export function resizeGameBoard(game, newSize) {
    const oldSize = game.gridSize;
    game.gridSize = newSize;
    const newGrid = createGrid(newSize);
    const offset = Math.floor((newSize - oldSize) / 2);
    for (let y = 0; y < oldSize; y++) {
      for (let x = 0; x < oldSize; x++) {
        const newY = y + offset;
        const newX = x + offset;
        if (newY >= 0 && newY < newSize && newX >= 0 && newX < newSize) {
          newGrid[newY][newX] = game.currentGrid[y][x];
        }
      }
    }
    game.currentGrid = newGrid;
    game.cellSize = game.gameCanvas.width / game.gridSize;
    game.drawGrid(game.currentGrid, game.ctx, game.cellSize, game.gameCanvas.width, game.gameCanvas.height);
  }
  