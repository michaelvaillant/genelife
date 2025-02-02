// selectionUtils.js
import { createEmptyCell, copyGrid } from './grid.js'; // Utilities from grid.js

export function clearSelectionArea(game) {
  if (game.selectedArea) {
    // Clear only the selected area
    const { x1, y1, x2, y2 } = game.selectedArea;
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (game.currentGrid[y][x].state !== -1) { // Preserve obstacles
          game.currentGrid[y][x] = createEmptyCell();
        }
      }
    }
    // Optionally clear selection state afterward:
    clearSelectionState(game);
  } else {
    // Clear the entire grid if no area is selected
    for (let y = 0; y < game.gridSize; y++) {
      for (let x = 0; x < game.gridSize; x++) {
        if (game.currentGrid[y][x].state !== -1) {
          game.currentGrid[y][x] = createEmptyCell();
        }
      }
    }
  }
  // Synchronize nextGrid and redraw the grid
  game.nextGrid = copyGrid(game.currentGrid);
  game.drawGrid(game.currentGrid, game.ctx, game.cellSize, game.gameCanvas.width, game.gameCanvas.height);
}

export function clearSelectionState(game) {
  // Clear selection-related state and UI
  game.selectedCell = null;
  game.selectedArea = null;
  game.isAreaSelected = false;
  // Clear overlay, info div, etc.
  game.overlayCtx.clearRect(0, 0, game.overlayCanvas.width, game.overlayCanvas.height);
  game.CellInfoContent.innerHTML = '';
  game.survivalColumn.innerHTML = '';
  game.birthColumn.innerHTML = '';
  game.moveColumn.innerHTML = '';
  game.infoDiv.style.display = 'none';
}

export function copySelectedArea(game) {
    if (!game.selectedArea) return;
    const { x1, y1, x2, y2 } = game.selectedArea;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const width = (x2 - x1 + 1) * game.cellSize;
    const height = (y2 - y1 + 1) * game.cellSize;
    tempCanvas.width = width;
    tempCanvas.height = height;
    game.clearSelection();
    tempCtx.drawImage(
      game.gameCanvas,
      x1 * game.cellSize, y1 * game.cellSize, width, height,
      0, 0, width, height
    );
    const img = new Image();
    img.src = tempCanvas.toDataURL();
    img.style.width = '50px';
    img.style.height = '50px';
    img.style.margin = '5px';
    img.style.cursor = 'pointer';
    const imgContainer = document.createElement('div');
    imgContainer.appendChild(img);
    imgContainer.style.display = 'inline-block';
    imgContainer.draggable = true;
    game.copiedAreaDiv.appendChild(imgContainer);
    
    const gridData = [];
    for (let y = y1; y <= y2; y++) {
      const row = [];
      for (let x = x1; x <= x2; x++) {
        row.push(game.deepCloneCell(game.currentGrid[y][x]));
      }
      gridData.push(row);
    }
    
    const copiedData = {
      x1, y1, x2, y2,
      image: img.src,
      aliveCount: countAliveCells(game, x1, y1, x2, y2),
      totalEnergy: calculateTotalEnergy(game, x1, y1, x2, y2),
      width: x2 - x1 + 1,
      height: y2 - y1 + 1,
      gridData
    };
    game.copiedAreas.push(copiedData);
    
    imgContainer.addEventListener('mousedown', (event) => {
      event.preventDefault();
      game.clearSelection();
      game.draggedArea = copiedData;
      game.isDragging = true;
    });
  }
  
  export function countAliveCells(game, x1, y1, x2, y2) {
    let count = 0;
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (game.currentGrid[y][x].state === 1) count++;
      }
    }
    return count;
  }
  
  export function calculateTotalEnergy(game, x1, y1, x2, y2) {
    let total = 0;
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const cell = game.currentGrid[y][x];
        if (cell.state === 1) total += cell.energy;
        else if (cell.state === 0 && cell.energyLeft > 0) total += cell.energyLeft;
      }
    }
    return total;
  }
  
  export function handleCopiedAreaMouseDown(game, event) {
    console.log("Event target:", event.target);
    console.log("Event target tag:", event.target.tagName);

    if (event.target.tagName === 'IMG') {
      const container = event.target.parentElement;
      const parent = container.parentElement;
      const children = [...parent.children];
      const index = children.indexOf(container);
      console.log("Computed index:", index);
      game.draggedArea = game.copiedAreas[index];
      game.isDragging = true;
      console.log("Dragged area set:", game.draggedArea);
    }
        
    // if (event.target.tagName === 'IMG') {
    //   const index = [...event.target.parentElement.parentElement.children].indexOf(event.target.parentElement);
    //   game.draggedArea = game.copiedAreas[index];
    //   game.isDragging = true;
    //   console.log("Dragged area set:", game.draggedArea);
    // }
    // const img = event.target.closest('img');
    // if (img) {
    //   const index = [...img.parentElement.parentElement.children].indexOf(img.parentElement);
    //   game.draggedArea = game.copiedAreas[index];
    //   game.isDragging = true;
    //   console.log("Dragged area set:", game.draggedArea);
    // }

  }
  