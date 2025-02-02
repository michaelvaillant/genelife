// patterns.js
import { generateRandomGenome } from './genome.js';

function defineGenomes(game) {
    game.genomeTypes = {
      1: () => ({ survivalRules: [2, 3], birth: [3], moveRules: [], actionRules: [] }),
      2: () => ({ survivalRules: [2, 3], birth: [3], moveRules: [1, 1, 3, 3], actionRules: [] }),
      3: () => ({ survivalRules: [2, 3], birth: [4], moveRules: [1, 1, 3, 3], actionRules: [] }),
      4: () => ({ survivalRules: [3, 4], birth: [3, 4], moveRules: [], actionRules: [] }),
      5: () => ({ survivalRules: [2, 4], birth: [2], moveRules: [], actionRules: [] }),
      9: () => ({ survivalRules: [2, 3], birth: [3], moveRules: [], actionRules: [[5], [6], [7], [8], [5], [6], [7], [8]], actionValues: Array(8).fill(0)})
    };
  }

  function getGenome(game, type) {
    const genome = game.genomeTypes[type]
        ? game.genomeTypes[type]()
        : generateRandomGenome();
    //console.log(`Genome for type ${type}:`, genome);
    return genome;
}

export function preloadPatterns(game) {
    game.copiedAreaDiv.innerHTML = '';
    game.patterns.forEach(pattern => {
      preloadPattern(game, pattern.data, pattern.name);
    });
}
  
export function preloadPattern(game, motif, patternName) {
    const width = motif[0].length;
    const height = motif.length;
  
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width * game.cellSize;
    tempCanvas.height = height * game.cellSize;
  
    const gridData = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const cellType = motif[y][x];
        const cell = {
          state: (cellType > 0 ? 1 : 0),
          genome: cellType > 0 ? getGenome(game, cellType) : null,
          energy: cellType > 0 ? 100 : 0,
          age: cellType > 0 ? 0 : -1,
          energyLeft: 0,
          actionValues: Array(8).fill(0)
        };
        row.push(cell);
        if (cell.state === 1) {
          tempCtx.fillStyle = cell.genome && cell.genome.moveRules.length > 0 ? 'orange' : 'red';
          tempCtx.fillRect(x * game.cellSize, y * game.cellSize, game.cellSize, game.cellSize);
        }
      }
      gridData.push(row);
    }
  
    const img = new Image();
    img.src = tempCanvas.toDataURL();
    img.style.width = '50px';
    img.style.height = '50px';
    img.style.margin = '5px';
    img.style.cursor = 'pointer';
    img.title = patternName;
  
    const imgContainer = document.createElement('div');
    imgContainer.appendChild(img);
    imgContainer.style.display = 'inline-block';
    imgContainer.draggable = true;
  
    game.copiedAreaDiv.appendChild(imgContainer);
  
    const copiedData = {
      x1: 0,
      y1: 0,
      x2: width - 1,
      y2: height - 1,
      image: img.src,
      aliveCount: motif.flat().filter(cell => cell > 0).length,
      totalEnergy: motif.flat().filter(cell => cell > 0).length * 100,
      width,
      height,
      gridData
    };
    game.copiedAreas.push(copiedData);
  
    imgContainer.addEventListener('mousedown', (event) => {
      event.preventDefault();
      game.draggedArea = copiedData;
      game.isDragging = true;
    });
  }

  export function definePatterns(game) {
    game.patterns = [
        {
            name: 'Pattern 1',
            data: [
              [0, 1, 1],
              [1, 0, 1],
              [1, 0, 1],
              [0, 1, 0]
            ]
          },
          {
            name: 'Pattern 2',
            data: [
              [1, 0, 0],
              [1, 0, 1],
              [1, 1, 0]
            ]
          },
          {
            name: 'Pattern 3',
            data: [
              [3, 3],
              [3, 3]
            ]
          },
          {
            name: 'Pattern 4',
            data: [
              [0, 0, 0, 1, 0],
              [0, 0, 0, 0, 1],
              [1, 0, 0, 0, 1],
              [0, 1, 1, 1, 1]
            ]
          },
          {
            name: 'Pattern 5',
            data: [
              [1, 1, 1, 0, 0, 0],
              [0, 1, 0, 1, 1, 1],
              [1, 1, 0, 1, 1, 0],
              [1, 1, 0, 1, 1, 0],
              [0, 0, 1, 0, 0, 0]
            ]
          },
          {
            name: 'Pattern 6',
            data: [
              [1, 4, 5, 5, 4, 1]
            ]
          },
          {
            name: 'Pattern 7',
            data: [
              [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
              [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
              [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              [1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1],
              [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
              [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
              [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
              [1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1],
              [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
              [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
              [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0]
            ]
          },
          {
            name: 'Pattern 8',
            data: [
              [0, 1, 1, 0, 0, 0],
              [0, 0, 0, 1, 1, 0],
              [1, 1, 0, 0, 0, 0],
              [0, 0, 1, 1, 1, 0]
            ]
          },
          {
            name: 'Pattern 9',
            data: [
              [9, 9],
              [9, 9]
            ]
          }
    ];
  }


  