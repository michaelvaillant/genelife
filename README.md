**Game of Life with Integrated Genome and Graphics**

*Description*

This project is an advanced implementation of Conway's "Game of Life," enhanced with a genome system that adds evolutionary dynamics and movement to cells. It includes an interactive visualization using HTML5 Canvas and offers a simulation system with multiple user controls.

Unlike traditional implementations where the grid determines the rules of reproduction and survival, here, the rules are embedded within the cells themselves. This fundamental shift enables genetic mutations, making the simulation much more flexible and adaptable. It includes an interactive visualization using HTML5 Canvas and offers a simulation system with multiple controls.

Try it: [genelife](https://www.u-sphere.com/projects/genelife/)

The updated version of the demo is automatically deployed to
[genelife2](https://www.u-sphere.com/projects/genelife2/) via the FTP
workflow in `.github/workflows/deploy.yml`.

*Features*
-	Game of Life Simulation: Based on Conway's classic rules with evolutionary elements.
-	Integrated Genome: Each cell can have genetic characteristics defining its survival, reproduction, and movement.
-	Interactive Visualization: Uses multiple canvases to display the simulation grid and statistical graphs.
-	You can Display the content of the genone interactively by clicking on any cell (not shown here!)
-	You can also Interactively save "creatures" from the grid, and drag & drop them at any time. You've a list of pre-recorded creatures.
-	Customization: Allows modifying the grid size, simulation speed, and using a random seed.
-	Obstacle Management and Presets: Adds cross-shaped obstacles and predefined worlds.
-	Dynamic Graphs: Displays population and energy evolution over time.
-	User Controls: Manage the simulation via buttons and interactive selectors.

*Example of the configuration for seed 28727 not so far from the beginning*
![src/Configurations/28727.png](https://github.com/michaelvaillant/genelife/blob/master/src/Configurations/28727.png)
*after 1167 turns*
![src/Configurations/28727.png](https://github.com/michaelvaillant/genelife/blob/master/src/Configurations/28727%201187.png)
- Moving cells are in orange
- Recent cells are colored in red, and with the age the became darker

Initial cells in this simulation is made of a mix between classical game of life cells (like B3/S23 but not only) and more evolved cells with movement rules. I also added some "pac man" cells (yellow) for the fun. So many interesting experiments to do here.

*Installation*
No installation required—simply open the index.html file in a JavaScript-compatible browser.

*Usage*

1.	Start the simulation: It runs automatically with default settings.
2.	Change grid size: Select a size in the "Board" dropdown menu.
3.	Modify speed: Adjust the value in "Wait" to speed up or slow down the simulation.
4.	Change seed: Enter a value in "Seed" to generate different configurations. Keys: +, - or SPACE (to freeze)
5.	Reset the simulation: Click "Reset" to choose a new seed or a predefined world.
6.	Observe cells: Click on a cell to display its genetic characteristics and state.
7.	Select an area: Drag the mouse to analyze a specific region.

Genetic Rules

The genome of a cell consists of three main categories of rules:
- Survival Rules: Determine whether the cell survives based on the number of neighboring cells.
- Birth Rules: Define when a new cell is born in an empty location, depending on the number of neighbors.
- Movement Rules: Cells can move based on two types of movement:
- Movement Rules (1): Homeostatic Movement: A permanent and cyclic series of movements, independent of external factors.
- Movement Rules (2): Reactive Movement: Triggered by the detection of a neighboring living Cell or Energy source in a specific direction.

Cells with "Movement Rules" consume Energy. The introduction of Energy into the simulation (small green blocks) is crucial as it regulates movement and ensures that cells have resource constraints. Cells consume energy when moving and require an energy source to sustain their actions. Without energy, cells become immobile and may eventually die.
Cells which does not have "Movement Rules" are 100% compatible with the way the Game of Life is working

Useful Variables To Change the simulation parameters

- energyMoveCost
- energyDieRatio
- energyChildRatio
- energyCellMax

*Technologies Used*

-	HTML5 / CSS3: Structure and styling.
-	JavaScript (ES6): Manages the simulation and user interactions.
-	Canvas API: Enables interactive graphical rendering.
-	Seedrandom.js: Handles random seed generation.

*Future Improvements*
- Some UX bugs to correct . Actually I need to correct the way the temporary movements are consumed. It was my latest change, and did need to be tuned. 
-	Many ideas to suggest to play with. Like for cells, a way to recognize the cells with similar genetic code and accept reproduction with not so different cells. Add conditional blocs (if) in the genetic code (the genetic code is a stack). 
-	Introducing new genes for complex behaviors.
-	Performance optimization for larger grids.

*Author*
Project developed by Michael Vaillant.

*License*
This project is licensed under the MIT License. 

Michael Vaillant
