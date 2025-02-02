// graph.js

export function updateGraphData(game) {
    let population = 0;
    let totalEnergy = 0;
    for (let y = 0; y < game.gridSize; y++) {
      for (let x = 0; x < game.gridSize; x++) {
        const cell = game.currentGrid[y][x];
        if (cell.state === 1) {
          population++;
          totalEnergy += cell.energy;
        }
        totalEnergy += cell.energyLeft;
      }
    }
    game.populationCounts.push(population);
    game.energyCounts.push(totalEnergy / 50);
    if (game.populationCounts.length > game.maxGenerations) {
      game.populationCounts.shift();
      game.energyCounts.shift();
    }
  }
  
  export function drawGraph(game) {
    const ctx = game.graphCtx;
    const canvas = game.graphCanvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const maxPopulation = game.gridSize * game.gridSize;
    const maxEnergy = game.gridSize * game.gridSize * 4.2;
    const scaleX = canvas.width / game.maxGenerations;
    const scaleYPopulation = canvas.height / maxPopulation;
    const scaleYEnergy = canvas.height / maxEnergy;
    
    ctx.beginPath();
    ctx.strokeStyle = '#0000FF';
    game.populationCounts.forEach((pop, i) => {
      const x = i * scaleX;
      const y = canvas.height - pop * scaleYPopulation;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    ctx.beginPath();
    ctx.strokeStyle = '#FF0000';
    game.energyCounts.forEach((energy, i) => {
      const x = i * scaleX;
      const y = canvas.height - energy * scaleYEnergy;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
  