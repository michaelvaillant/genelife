// genome.js

export function generateRandomGenome() {
    const directions = [1, 2, 3, 4];
    let moveRules = [];
    let survivalRules = [];
    let birthRules = [];
    if (Math.random() < 0.05) {
      survivalRules = [0, 1, 2, 3, 4, 5, 6, 7];
      moveRules = Array(24).fill().map(() => directions[Math.floor(Math.random() * directions.length)]);
      return { survivalRules, birth: birthRules, moveRules };
    }
    if (Math.random() < 0.1) {
      const numInstructions = Math.floor(Math.random() * 1 + 1);
      for (let i = 0; i < numInstructions; i++) {
        moveRules.push(directions[Math.floor(Math.random() * directions.length)]);
      }
    }
    const survivalConditions = [2, 3, 4];
    survivalRules = [2, 3];
    survivalRules.push(survivalConditions[Math.floor(Math.random() * survivalConditions.length)]);
    survivalRules.push(survivalConditions[Math.floor(Math.random() * survivalConditions.length)]);
    birthRules.push([2, 3, 4, 5][Math.floor(Math.random() * 4)]);
    return { survivalRules, birth: birthRules, moveRules };
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
      case 1: return [0, -1]; // North
      case 2: return [0, 1];  // South
      case 3: return [1, 0];  // East
      case 4: return [-1, 0]; // West
      default: return [0, 0];
    }
  }
  
  export function moveCell(game, x, y, targetX, targetY, cell, nextGrid) {
    let energy = cell.energy;
    let moveRules = cell.genome.moveRules.slice();
    const targetCell = game.currentGrid[targetY][targetX];
    if (cell.genome.birth.length > 0) energy -= 0.5;
    if (energy <= 0) {
      game.cellDies(nextGrid, x, y, cell.genome.moveRules.length + cell.genome.birth.length + cell.genome.survivalRules.length);
    } else {
      energy += targetCell.energyLeft;
      if (energy > 200) energy = 200;
      moveRules.push(moveRules.shift());
      cell.genome.moveRules = moveRules;
      nextGrid[targetY][targetX] = { age: cell.age, state: 1, genome: cell.genome, energy, energyLeft: 0 };
    }
  }
  
  export function crossoverGenomes(genome1, genome2, energy1, energy2) {
    const childGenome = { survivalRules: [], birth: null, moveRules: [] };
    for (let i = 0; i < genome1.survivalRules.length; i++) {
      childGenome.survivalRules[i] = Math.random() < 0.5 ? genome1.survivalRules[i] : genome2.survivalRules[i];
    }
    childGenome.birth = Math.random() < 0.5 ? genome1.birth : genome2.birth;
    childGenome.moveRules = crossoverMoveRules(genome1.moveRules, genome2.moveRules, energy1, energy2);
    return childGenome;
  }
  
  export function crossoverMoveRules(rules1, rules2, energy1, energy2) {
    const childRules = [];
    const maxLength = Math.max(rules1.length, rules2.length);
    for (let i = 0; i < maxLength; i++) {
      let instruction = null;
      const instr1 = rules1[i] || null;
      const instr2 = rules2[i] || null;
      const lowEnergy = (energy1 < 10 || energy2 < 10);
      const mutation = lowEnergy && Math.random() < 0.5;
      if (mutation) {
        if (instr1 !== null && instr2 !== null) {
          childRules.push(instr1);
          if (childRules.length < maxLength) childRules.push(instr2);
        } else {
          instruction = instr1 !== null ? instr1 : instr2;
        }
      } else {
        if (instr1 !== null && instr2 !== null) {
          instruction = Math.random() < 0.5 ? instr1 : instr2;
        } else {
          instruction = instr1 !== null ? instr1 : instr2;
        }
      }
      if (instruction !== null) childRules.push(instruction);
      if (childRules.length === maxLength) break;
    }
    return childRules;
  }
  
  export function defineGenomes(game) {
    game.genomeTypes = {
      1: () => ({ survivalRules: [2, 3], birth: [3], moveRules: [] }),
      2: () => ({ survivalRules: [2, 3], birth: [3], moveRules: [1, 1, 3, 3] }),
      3: () => ({ survivalRules: [2, 3], birth: [4], moveRules: [1, 1, 3, 3] }),
      4: () => ({ survivalRules: [3, 4], birth: [3, 4], moveRules: [] }),
      5: () => ({ survivalRules: [2, 4], birth: [2], moveRules: [] }),
    };
  }
  
  export function getGenome(game, type) {
    return game.genomeTypes[type] ? game.genomeTypes[type]() : generateRandomGenome();
  }
  