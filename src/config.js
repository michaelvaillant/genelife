// config.js
export const config = {

    gridSize: 128, // Default grid size
    speed: 100, // Default simulation speed
    seed: Math.floor(Math.random() * 100000), // Default seed
    // Energy management (randomized within given ranges)
    energyMoveCost: parseFloat((Math.random() * 5.0).toFixed(1)),  // (0.0 - 5.0)
    energyDieRatio: Math.floor(Math.random() * 11),                // (0 - 10)
    energyChildRatio: parseFloat((Math.random() * 10.0).toFixed(1)), // (0.0 - 10.0)
    energyCellMax: Math.floor(Math.random() * (300 - 10 + 1)) + 10, // (10 - 300)       // cap max energy  

    // Genetic parameters
    genetics: {
        actionMutationRate: parseFloat(Math.random().toFixed(2)),  // (0.00 - 1.00)
        pacmanProbability: parseFloat((Math.random() * 0.05).toFixed(2)), // (0.00 - 0.05)
        moverProbability: parseFloat(Math.random().toFixed(2)),  // (0.00 - 1.00)

        survivalRuleRange: [
            Math.floor(Math.random() * (6 - 2 + 1)) + 2,  // Min (2-5)
            Math.floor(Math.random() * (6 - 2 + 1)) + 2   // Max (2-5)
        ].sort((a, b) => a - b),  // Ensure correct ordering

        birthRuleOptions: [
            Math.floor(Math.random() * (7 - 3 + 1)) + 3, 
            Math.floor(Math.random() * (7 - 3 + 1)) + 3, 
            Math.floor(Math.random() * (7 - 3 + 1)) + 3
        ], // 3 random birth rules (3-7)

        mutationThresholdEnergy: Math.floor(Math.random() * 201), // (0 - 200)
        mutationProbability: parseFloat(Math.random().toFixed(2)), // (0.00 - 1.00)
        genomeLengthRange: [
            Math.floor(Math.random() * (10 - 1 + 1)) + 1, // Min (1 - 10)
            Math.floor(Math.random() * (10 - 1 + 1)) + 1  // Max (1 - 10)
        ].sort((a, b) => a - b),  // Ensure correct ordering

        forgotGenomeProb: parseFloat((Math.random() * .1).toFixed(1))  // (0.0 - 0.5)   // When crossover, probability to forgot 1 genome
    }
};
// Log all values for debugging
console.log("Generated Configuration:", JSON.stringify(config, null, 2));

// Log used rules in a more readable format
console.log(`
🔥 GAME RULES USED 🔥
---------------------
- Energy Move Cost: ${config.energyMoveCost}
- Energy Die Ratio: ${config.energyDieRatio}
- Energy Child Ratio: ${config.energyChildRatio}
- Energy Cell Max: ${config.energyCellMax}

🧬 GENETIC RULES 🧬
-------------------
- Action Mutation Rate: ${config.genetics.actionMutationRate}
- Pac-Man Probability: ${config.genetics.pacmanProbability}
- Mover Probability: ${config.genetics.moverProbability}

💀 SURVIVAL & BIRTH RULES 💀
----------------------------
- Survival Rule Range: ${config.genetics.survivalRuleRange.join(" - ")}
- Birth Rule Options: ${config.genetics.birthRuleOptions.join(", ")}

🔬 MUTATION RULES 🔬
--------------------
- Mutation Threshold Energy: ${config.genetics.mutationThresholdEnergy}
- Mutation Probability: ${config.genetics.mutationProbability}
- Genome Length Range: ${config.genetics.genomeLengthRange.join(" - ")}

✅ CONFIGURATION READY ✅
`);
// Energy management
//     energyMoveCost: 1.0,      // Energy cost per move (0.0 - 5.0)
//     energyDieRatio: 10,       // Energy left by a dead cell (divided by this ratio) (0 - 10)
//     energyChildRatio: 2.0,    // Fraction of parents' energy transferred to the child when born (0.0 - 10.0)
//     energyCellMax: 200,       // Maximum energy a cell can have (10-300)

//     // Genetic parameters
//     genetics: {
//         actionMutationRate: 0.10,  // Probability that a cell has random action rules (0.0 - 1.0)
//         pacmanProbability: 0.05,   // Probability that a cell follows "Pac-Man" behavior (0.00 - 0.05)
//         moverProbability: 0.40,    // Probability that a cell has movement rules (0.0 - 1.0)

//         survivalRuleRange: [2, 4], // Range for generating survival rules (2 - 5)
//         birthRuleOptions: [3, 4, 5], // Possible birth rule values (3-7)

//         mutationThresholdEnergy: 10,  // Energy threshold below which mutation is favored (0 - 200)
//         mutationProbability: 0.5,      // Probability of mutation during crossover (0.0 - 1.0)
//         genomeLengthRange: [1, 5],    // Minimum and maximum length of a child's genome (1 - 10)
//     }
// };
