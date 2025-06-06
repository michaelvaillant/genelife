// GameOfLife.js
import { createGrid, copyGrid, deepCloneCell, createEmptyCell, initializeGrid, addCrossObstacles, drawGrid } from './grid.js';
import { config } from "./config.js"; 

import * as simulation from './simulation.js';
import * as genome from './genome.js';
import * as graph from './graph.js';
import * as ui from './ui.js';
import * as modal from './modal.js';
import * as select from './selectionUtils.js';
import * as patterns from './patterns.js';

// export const game = new GameOfLife();

export class GameOfLife {
  constructor() {
    // Canvas elements
    this.gameCanvas = document.getElementById('gameCanvas');
    this.ctx = this.gameCanvas.getContext('2d');
    this.overlayCanvas = document.getElementById('overlayCanvas');
    this.overlayCtx = this.overlayCanvas.getContext('2d');
    this.graphCanvas = document.getElementById('graphCanvas');
    this.graphCtx = this.graphCanvas.getContext('2d');
    
    // Modal elements
    this.resetModal = document.getElementById('resetModal');
    this.resetForm = document.getElementById('resetForm');
    this.currentSeedOption = document.getElementById('currentSeedOption');
    
    // UI elements
    this.infoDiv = document.getElementById('infoDiv');
    this.CellInfoContent = document.getElementById('CellInfoContent');
    this.genomeInfo = document.getElementById('genomeInfo');
    this.survivalColumn = document.getElementById('survivalColumn');
    this.birthColumn = document.getElementById('birthColumn');
    this.moveColumn = document.getElementById('moveColumn');
    this.cellProxy = document.getElementById('cellProxy');
    this.copyButton = document.getElementById('copyButton');
    this.copiedAreaDiv = document.getElementById('copiedAreaDiv');

    // Attach drawGrid so that it can be used elsewhere via game.drawGrid(...)
    this.drawGrid = drawGrid;

    // Configuration
    this.gridSize = config.gridSize;
    this.cellSize = this.gameCanvas.width / this.gridSize;
    this.speed = config.speed;
    this.seed = config.seed;
    this.isPaused = false;
    this.generationCount = 0;
    this.maxGenerations = 500;
    this.populationCounts = [];
    this.energyCounts = [];
    
    // Meta-Parameters
    // 10 / 10 / 5 / 200   => black static labyrinth.    
    // 10 /  2 / 5 / 200   => black static labyrinth.    
    // 5 / 2 / 5 / 200    => Equilibruum, but no reversal
    // 5 / 2 / 2 / 10
    // 2 / 2 / 2 / 10     => Orange anarchism

    // this.energyMoveCost = 0.0;     // Cost in Energy for a move (genome.js)
    // this.energyDieRatio = 10;      // Energy left by a dead cell. Divide the energy issued from the original cell by this ratio. (simulation.js)
    // this.energyChildRatio = 2.0;    // Fraction of Energy from the parents left to the child when born (simulation.js) (/!\ > 2 !)
    // this.energyCellMax = 200;     // Cap Max energy of a Cell (genome.js)

    this.energyMoveCost = config.energyMoveCost;
    this.energyDieRatio = config.energyDieRatio;
    this.energyChildRatio = config.energyChildRatio;
    this.energyCellMax = config.energyCellMax;
    this.genetics = config.genetics;
    console.log(config.energyMoveCost);
    // // genome.js
    // this.genetics = {
    //   actionMutationRate: 0.10,  // % chance qu'une cellule ait des actions aléatoires
    //   pacmanProbability: 0.05,   // % chance qu'une cellule soit un Pac-Man
    //   moverProbability: 0.80,    // % chance qu'une cellule ait des règles de mouvement
    //   survivalRuleRange: [2, 4], // Intervalle pour générer des règles de survie
    //   birthRuleOptions: [3, 4, 5], // Liste des règles de naissance possibles
    
    //   mutationThresholdEnergy: 10,  // Énergie en-dessous de laquelle la mutation est favorisée
    //   mutationProbability: 0.5,      // Chance de mutation dans un croisement
    //   genomeLengthRange: [1, 5],    // Longueur min/max du génome d'un enfant
      
    // };

    // Genetic
    // this.mutationRate = 0.01;       // Probabilité de mutation
    // this.crossoverMethod = "uniform";  // Méthode de croisement
    // this.selectionPressure = 0.5;    // Facteur de pression évolutive

            
    // A good usage of Reactions rules can create cooperation.

    // Grids
    this.currentGrid = createGrid(this.gridSize);
    this.nextGrid = createGrid(this.gridSize);
    
    // Simulation state
    this.hoveredCell = null;
    this.selectedCell = null;
    this.selectedArea = null;
    this.isAreaSelected = false;
    this.isDragging = false;
    this.draggedArea = null;
    this.isSelecting = false;
    this.startX = null;
    this.startY = null;
    this.endX = null;
    this.endY = null;
    this.dashOffset = 0;
    this.isAnimationRunning = false;
    this.idAnim = null;
    
    // Other properties
    this.copiedAreas = [];
    this.genomeTypes = {};
    
    // Initialisation for Patterns
    this.patterns = []; 

    // Pre-recorded worlds (sample)
    this.worlds = [
      {
        name: "World 1",
        grid: [
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      ]
      }
    ];
    
    // Initialize game
    this.initGame();
    ui.bindEvents(this);
  }
  
  initGame() {
    Math.seedrandom(this.seed);
    this.updateControls();
    initializeGrid(this.currentGrid);
    // addCrossObstacles(this.currentGrid, this.gridSize);
    drawGrid(this.currentGrid, this.ctx, this.cellSize, this.gameCanvas.width, this.gameCanvas.height);
    this.generationCount = 0;
    setTimeout(() => this.update(), this.speed);
    genome.defineGenomes(this);

    patterns.definePatterns(this);
    patterns.preloadPatterns(this);
  }
  
  updateControls() {
    document.getElementById('round').innerText = '0';
    document.getElementById('seed').value = this.seed;
    document.getElementById('board').value = this.gridSize;
    document.getElementById('speed').value = this.speed;
  }
  
  update() {
    simulation.update(this);
  }
  
  // Wrappers for functions from imported modules:
  getDirectionOffset(dir) { return genome.getDirectionOffset(dir); }  
  moveCell(x, y, targetX, targetY, cell, nextGrid) { genome.moveCell(this, x, y, targetX, targetY, cell, nextGrid); }  
  countAliveNeighbors(grid, x, y) { return simulation.countAliveNeighbors(grid, x, y, this.gridSize); }  
  getAliveNeighbors(grid, x, y) { return simulation.getAliveNeighbors(grid, x, y, this.gridSize); }
  
  cellDies(grid, x, y, energyLeft) {
    grid[y][x] = {
      age: -1,
      state: 0,
      genome: null,
      energy: 0,
      energyLeft: grid[y][x].energyLeft + energyLeft
    };
  }
  
  deepCloneCell(cell) { return deepCloneCell(cell); }
  
  updateGraphData() { graph.updateGraphData(this); }  
  drawGraph() { graph.drawGraph(this); }
  
  handleKeyDown(event) { ui.handleKeyDown(this, event); }
  handleMouseMove(event) { ui.handleMouseMove(this, event); }
  handleMouseDown(event) { ui.handleMouseDown(this, event); }
  handleMouseUp(event) { ui.handleMouseUp(this, event); }
  handleClick(event) { ui.handleClick(this, event); }
  handleMouseOut() { ui.handleMouseOut(this); }
  clearSelection() { ui.clearSelection(this); }
  startAnimation() { ui.startAnimation(this); }
  stopAnimation() { ui.stopAnimation(this); }
  togglePause() { ui.togglePause(this); }
  displaySelectionInfo(x1, y1, x2, y2) { ui.displaySelectionInfo(this, x1, y1, x2, y2); }
  displayCellInfo(x, y) { ui.displayCellInfo(this, x, y); }

  handleCopiedAreaMouseDown(event) { select.handleCopiedAreaMouseDown(this, event); }
  copySelectedArea() { select.copySelectedArea(this); }
  clearGrid() { select.clearSelectionArea(this); }
  
  openResetModal() { modal.openResetModal(this); }
  closeResetModal() { modal.closeResetModal(this); }
  applyReset() { modal.applyReset(this); }
  changeSeed(event) { modal.changeSeed(this, event); }  
  resizeBoard(event) { modal.resizeBoard(this, event); }

  crossoverGenomes(genome1, genome2, energy1, energy2) { return genome.crossoverGenomes(genome1, genome2, energy1, energy2); } 

}
