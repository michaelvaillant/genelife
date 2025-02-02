// ui.js
// import { adjustSpeed } from './ui.js'; 

export function bindEvents(game) {
    document.getElementById('Reset').addEventListener('click', (e) => { game.openResetModal(); e.target.blur(); });
    document.getElementById('clear').addEventListener('click', (e) => { game.clearGrid(); e.target.blur(); });
    document.getElementById('seed').addEventListener('change', (e) => { game.changeSeed(e); e.target.blur(); });
    document.getElementById('board').addEventListener('change', (e) => { game.resizeBoard(e); e.target.blur(); });
    document.addEventListener('keydown', (e) => game.handleKeyDown(e));
    document.getElementById('gameCanvas').addEventListener('mousemove', (e) => game.handleMouseMove(e));
    document.getElementById('gameCanvas').addEventListener('mousedown', (e) => game.handleMouseDown(e));
    document.getElementById('gameCanvas').addEventListener('mouseup', (e) => game.handleMouseUp(e));
    document.getElementById('gameCanvas').addEventListener('click', (e) => game.handleClick(e));
    document.getElementById('gameCanvas').addEventListener('mouseout', () => game.handleMouseOut());
    document.getElementById('applyReset').addEventListener('click', (e) => { game.applyReset(); e.target.blur(); });
    document.getElementById('cancelReset').addEventListener('click', (e) => { game.closeResetModal(); e.target.blur(); });
    game.copyButton.addEventListener('click', (e) => { game.copySelectedArea(); e.target.blur(); });
    game.copiedAreaDiv.addEventListener('mousedown', (e) => game.handleCopiedAreaMouseDown(e));
  }
  
  export function handleKeyDown(game, event) {
    if (event.key === '+') {
      adjustSpeed(game, 1);
    } else if (event.key === '-') {
      adjustSpeed(game, -1);
    } else if (event.code === 'Space') {
      togglePause(game);
    }
  }
  
  export function adjustSpeed(game, direction) {
    if (!game.isPaused) {
      if (direction === -1)
        game.speed += direction * (game.speed <= 100 ? 10 : (game.speed <= 1000 ? 100 : 1000));
      else
        game.speed += direction * (game.speed < 100 ? 10 : (game.speed < 1000 ? 100 : 1000));
      game.speed = Math.min(Math.max(game.speed, 10), 5000);
      document.getElementById('speed').value = game.speed;
    }
  }
  
  export function togglePause(game) {
    game.isPaused = !game.isPaused;
    document.getElementById('speed').value = game.isPaused ? 'PAUSE' : game.speed;
  }
  
  export function handleMouseMove(game, event) {
    const rect = game.gameCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const cellX = Math.floor(mouseX / game.cellSize);
    const cellY = Math.floor(mouseY / game.cellSize);
    
    if (game.isDragging && game.draggedArea) {
      const { width, height } = game.draggedArea;
      
      console.log("Dragging shape with dimensions:", width, height);

      game.overlayCtx.clearRect(0, 0, game.overlayCanvas.width, game.overlayCanvas.height);
      let isValid = true;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const targetX = (cellX + x) % game.gridSize;
          const targetY = (cellY + y) % game.gridSize;
          if (game.currentGrid[targetY][targetX].state !== 0) {
            isValid = false;
            break;
          }
        }
        if (!isValid) break;
      }
      game.overlayCtx.fillStyle = isValid ? 'rgba(0,255,0,0.5)' : 'rgba(255,0,255,0.5)';
      game.overlayCtx.fillRect(cellX * game.cellSize, cellY * game.cellSize, width * game.cellSize, height * game.cellSize);
    } else {
      game.hoveredCell = { x: cellX, y: cellY };
      game.overlayCtx.clearRect(0, 0, game.overlayCanvas.width, game.overlayCanvas.height);
      if (game.hoveredCell) {
        game.overlayCtx.strokeStyle = 'grey';
        game.overlayCtx.setLineDash([]);
        game.overlayCtx.strokeRect(cellX * game.cellSize, cellY * game.cellSize, game.cellSize, game.cellSize);
      }
    }
    
    if (game.isSelecting) {
      game.endX = Math.trunc(mouseX / game.cellSize);
      game.endY = Math.trunc(mouseY / game.cellSize);
      game.overlayCtx.clearRect(0, 0, game.overlayCanvas.width, game.overlayCanvas.height);
      let width = (game.endX - game.startX + 1);
      let height = (game.endY - game.startY + 1);
      game.overlayCtx.setLineDash([8, 4]);
      game.overlayCtx.strokeStyle = 'black';
      if (width <= 0) width = -width + 2;
      if (height <= 0) height = -height + 2;
      game.overlayCtx.strokeRect(
        (game.endX < game.startX ? game.endX : game.startX) * game.cellSize,
        (game.endY < game.startY ? game.endY : game.startY) * game.cellSize,
        width * game.cellSize, height * game.cellSize
      );
    }
  }
  
  export function handleMouseDown(game, event) {
    const rect = game.gameCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    game.startX = Math.trunc(mouseX / game.cellSize);
    game.startY = Math.trunc(mouseY / game.cellSize);
    game.isSelecting = true;
    game.selectedArea = null;
    game.isAreaSelected = false;
    game.stopAnimation();
  }


export function handleMouseUp(game, event) {
    event.preventDefault();
    const rect = game.gameCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const cellX = Math.floor(mouseX / game.cellSize);
    const cellY = Math.floor(mouseY / game.cellSize);
    game.endX = cellX;
    game.endY = cellY;

    if (game.isSelecting) {
        game.isSelecting = false;
        if (game.startX === game.endX && game.startY === game.endY) {
            game.selectedArea = { x1: game.startX, y1: game.startY, x2: game.startX, y2: game.startY };
            game.isAreaSelected = false;
        } else {
            const x1 = Math.min(game.startX, game.endX);
            const y1 = Math.min(game.startY, game.endY);
            const x2 = Math.max(game.startX, game.endX);
            const y2 = Math.max(game.startY, game.endY);
            game.selectedArea = { x1, y1, x2, y2 };
            game.isAreaSelected = true;
        }
        game.displaySelectionInfo(game.selectedArea.x1, game.selectedArea.y1, game.selectedArea.x2, game.selectedArea.y2);
        game.infoDiv.style.display = 'inline-block';
        game.startAnimation();
        game.startX = game.startY = game.endX = game.endY = null;
    } else if (game.isDragging && game.draggedArea) {
        const { width, height } = game.draggedArea;
        let isValid = true;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tx = (cellX + x) % game.gridSize;
                const ty = (cellY + y) % game.gridSize;
                if (game.currentGrid[ty][tx].state !== 0) {
                    isValid = false;
                    break;
                }
            }
            if (!isValid) break;
        }

        if (isValid) {
            for (let yy = 0; yy < height; yy++) {
                for (let xx = 0; xx < width; xx++) {
                    const targetX = (cellX + xx) % game.gridSize;
                    const targetY = (cellY + yy) % game.gridSize;
                    const copiedCell = game.draggedArea.gridData[yy][xx];
                    game.currentGrid[targetY][targetX] = { ...copiedCell };
                }
            }
            game.drawGrid(game.currentGrid, game.ctx, game.cellSize, game.gameCanvas.width, game.gameCanvas.height);
            // game.drawGrid(game.currentGrid);
        }
        game.nextGrid = game.copyGrid(game.currentGrid);
        game.isDragging = false;
        game.draggedArea = null;
        game.overlayCtx.clearRect(0, 0, game.overlayCanvas.width, game.overlayCanvas.height);
    }
}  
//   export function handleMouseUp(game, event) {
//     event.preventDefault();
//     const rect = game.gameCanvas.getBoundingClientRect();
//     const mouseX = event.clientX - rect.left;
//     const mouseY = event.clientY - rect.top;
//     const cellX = Math.floor(mouseX / game.cellSize);
//     const cellY = Math.floor(mouseY / game.cellSize);
//     game.endX = cellX;
//     game.endY = cellY;
    
//     if (game.isSelecting) {
//       game.isSelecting = false;
//       if (game.startX === game.endX && game.startY === game.endY) {
//         game.selectedArea = { x1: game.startX, y1: game.startY, x2: game.startX, y2: game.startY };
//         game.isAreaSelected = false;
//       } else {
//         const x1 = Math.min(game.startX, game.endX);
//         const y1 = Math.min(game.startY, game.endY);
//         const x2 = Math.max(game.startX, game.endX);
//         const y2 = Math.max(game.startY, game.endY);
//         game.selectedArea = { x1, y1, x2, y2 };
//         game.isAreaSelected = true;
//       }
//       game.displaySelectionInfo(game.selectedArea.x1, game.selectedArea.y1, game.selectedArea.x2, game.selectedArea.y2);
//       game.infoDiv.style.display = 'inline-block';
//       game.startAnimation();
//       game.startX = game.startY = game.endX = game.endY = null;
//     } else if (game.isDragging && game.draggedArea) {
//       game.isDragging = false;
//       game.draggedArea = null;
//       game.overlayCtx.clearRect(0, 0, game.overlayCanvas.width, game.overlayCanvas.height);
//     }
//   }
  
  export function handleClick(game, event) {
    const rect = game.gameCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const cellX = Math.floor(mouseX / game.cellSize);
    const cellY = Math.floor(mouseY / game.cellSize);
    
    if (game.selectedCell && game.selectedCell.x === cellX && game.selectedCell.y === cellY) {
      game.clearSelection();
      game.infoDiv.style.display = 'none';
    } else {
      game.selectedCell = { x: cellX, y: cellY };
      game.displayCellInfo(cellX, cellY);
      game.infoDiv.style.display = 'inline-block';
      game.startAnimation();
    }
  }
  
  export function handleMouseOut(game) {
    game.hoveredCell = null;
    game.overlayCtx.clearRect(0, 0, game.overlayCanvas.width, game.overlayCanvas.height);
  }
  
  export function clearSelection(game) {
    game.overlayCtx.clearRect(0, 0, game.overlayCanvas.width, game.overlayCanvas.height);
    game.selectedCell = null;
    game.selectedArea = null;
    game.isAreaSelected = false;
    game.stopAnimation();
    game.CellInfoContent.innerHTML = '';
    game.survivalColumn.innerHTML = '';
    game.birthColumn.innerHTML = '';
    game.moveColumn.innerHTML = '';
    game.infoDiv.style.display = 'none';
  }
  
  export function startAnimation(game) {
    if (!game.isAnimationRunning) {
      game.isAnimationRunning = true;
      game.idAnim = requestAnimationFrame(() => animateDashedBorder(game));
    }
  }
  
  export function stopAnimation(game) {
    game.isAnimationRunning = false;
    cancelAnimationFrame(game.idAnim);
    game.idAnim = null;
  }
  
  export function animateDashedBorder(game) {
    game.overlayCtx.clearRect(0, 0, game.overlayCanvas.width, game.overlayCanvas.height);
    if (game.selectedArea) {
      game.overlayCtx.setLineDash([8, 4]);
      game.overlayCtx.lineDashOffset = game.dashOffset;
      game.overlayCtx.strokeStyle = 'black';
      const x = game.selectedArea.x1 * game.cellSize;
      const y = game.selectedArea.y1 * game.cellSize;
      const width = (game.selectedArea.x2 - game.selectedArea.x1 + 1) * game.cellSize;
      const height = (game.selectedArea.y2 - game.selectedArea.y1 + 1) * game.cellSize;
      game.overlayCtx.strokeRect(x, y, width, height);
    }
    if (game.hoveredCell) {
      game.overlayCtx.setLineDash([]);
      game.overlayCtx.strokeStyle = 'grey';
      game.overlayCtx.strokeRect(game.hoveredCell.x * game.cellSize, game.hoveredCell.y * game.cellSize, game.cellSize, game.cellSize);
    }
    game.dashOffset += 1;
    if (game.isAnimationRunning) {
      requestAnimationFrame(() => animateDashedBorder(game));
    }
  }
  
  export function displaySelectionInfo(game, x1, y1, x2, y2) {
    let liveCells = 0, totalEnergy = 0, totalAge = 0, totalSurvivalRules = 0, totalBirthRules = 0, totalMoveRules = 0;
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const cell = game.currentGrid[y][x];
        if (cell.state === 1 && cell.genome) {
          liveCells++;
          totalEnergy += cell.energy;
          totalAge += cell.age;
          totalSurvivalRules += cell.genome.survivalRules.length;
          totalBirthRules += cell.genome.birth.length;
          totalMoveRules += cell.genome.moveRules.length;
        } else {
          totalEnergy += cell.energyLeft;
        }
      }
    }
    const averageAge = liveCells > 0 ? (totalAge / liveCells).toFixed(2) : 'N/A';
    const totalRules = totalSurvivalRules + totalBirthRules + totalMoveRules;
    document.getElementsByClassName('CellInfoTitle')[0].innerHTML = '🔲 Sélection';
    const headerTable = `
      <table width="100%">
        <tr><td>Surface</td><td>${(Math.abs(x1 - x2) + 1) * (Math.abs(y1 - y2) + 1)} cases</td></tr>
        <tr><td>Population</td><td>${liveCells} ${liveCells > 0 ? '🟥' : ''}</td></tr>
        <tr><td>Âge Moyen</td><td>${averageAge}</td></tr>
        <tr><td>Énergie</td><td>${totalEnergy.toFixed(2)}</td></tr>
        <tr><td>Codes</td><td>${totalRules}</td></tr>
      </table>
    `;
    game.CellInfoContent.innerHTML = headerTable;
    game.cellProxy.innerHTML = '';
    game.genomeInfo.style.display = 'none';
    game.copyButton.style.display = (liveCells > 0 || totalEnergy > 0) ? 'block' : 'none';
  }
  
  export function displayCellInfo(game, x, y) {
    if (game.isAreaSelected) return;
    const cell = game.currentGrid[y][x];
    game.CellInfoContent.innerHTML = '';
    game.cellProxy.innerHTML = '';
    game.survivalColumn.innerHTML = '';
    game.birthColumn.innerHTML = '';
    game.moveColumn.innerHTML = '';
    const neighborsCount = game.countAliveNeighbors(game.currentGrid, x, y);
    const stateText = cell.state === 1 ? '🟥 Living cell' : (cell.energyLeft > 0 ? '🟩 Energy' : 'Vide');
    const ageText = cell.state === 1 ? cell.age : '';
    const energyText = cell.state === 1 ? cell.energy : cell.energyLeft;
    document.getElementsByClassName('CellInfoTitle')[0].innerHTML = '🚩 Location';
    const headerTable = `
      <table width="100%">
        <tr><td>Position</td><td>(${x}, ${y})</td></tr>
        <tr><td>Type</td><td>${stateText}</td></tr>
        <tr><td>Age</td><td>${ageText}</td></tr>
        <tr><td>Energy</td><td>${energyText.toFixed(2)}</td></tr>
        <tr><td>Neighbors</td><td>${neighborsCount}</td></tr>
      </table>
    `;
    game.CellInfoContent.innerHTML = headerTable;
    if (cell.state === 1 && cell.genome) {
      game.genomeInfo.style.display = 'block';
      appendGenomeElements(game.survivalColumn, cell.genome.survivalRules, 'survival', 'S');
      appendGenomeElements(game.birthColumn, cell.genome.birth, 'birth', 'B');
      if (cell.genome.moveRules && cell.genome.moveRules[0]) {
        document.getElementById('moveSection').style.display = 'block';
        appendGenomeElements(game.moveColumn, cell.genome.moveRules, 'move', 'M', game.getArrowForDirection);
      } else {
        document.getElementById('moveSection').style.display = 'none';
      }
    } else {
      game.genomeInfo.style.display = 'none';
    }
  }
  
  export function appendGenomeElements(container, rules, className, prefix, formatFn = (r) => r) {
    rules.forEach(rule => {
      appendGenomeElement(container, formatFn(rule), className, prefix);
    });
  }
  
  export function appendGenomeElement(container, value, className, prefix) {
    const elementDiv = document.createElement('div');
    elementDiv.textContent = `${prefix}${value}`;
    elementDiv.classList.add('gene', className);
    container.appendChild(elementDiv);
  }
  
  export function getArrowForDirection(game, dir) {
    switch (dir) {
      case 1: return '↑';
      case 2: return '↓';
      case 3: return '→';
      case 4: return '←';
      default: return '?';
    }
  }
  