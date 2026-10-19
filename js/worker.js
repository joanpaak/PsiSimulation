import { Simulation } from "./simulation.js";

/**
 * Worker for running simulations.
 * 
 * Setup:
 * 
 * 1) Post a message with "setOptions" as the type and the
 *    relevant options as its value to initialize.
 * 
 * 2) Post a message with the type "startSimulations", this
 *    will start the simulation loop.
 * 
 * 3) After each simulation this worker will post a message
 *    with the type "simulationDone" with the simulation data
 *    as its value.
 * 
 * 4) Terminate the worker once you are done.
 */
console.log("Starting worker");

self.opt; 

// TODO: Should this be async?
function startSimulations(){
    while(true){
        console.log("Starting simulation, options ");
        let sim = new Simulation(self.opt);
        sim.runSimulation();
    
        postMessage({
            type : "simulationDone",
            value : sim.getData()
        });
    }
}

function handleMessage(e){
    console.log("Worker got message " + e);
    switch(e.data.type){
        case "setOptions" :
            self.opt = e.data.value;
            postMessage({
                type : "initializationDone"
            });
            break;
        case "startSimulations":
            startSimulations();
            break;
        }
}

self.addEventListener("message", e => handleMessage(e));
