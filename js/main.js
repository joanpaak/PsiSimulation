import { Plot } from "./plotter_v1_21.js";

// TODO: Plottaushommia voisi siirrellä ehkä omaan luokkaan...

class Main{
    constructor(){
        this.introductionDiv = document.getElementById("introductionDiv");
        this.simulationDiv = document.getElementById("simulationDiv");
        this.switchIntroductionBtn = document.getElementById("switchIntroductionBtn");
        this.switchSimulationBtn = document.getElementById("switchSimulationBtn");

        this.switchIntroductionBtn.addEventListener("click", () => {
            this.introductionDiv.style.display = "block";
            this.simulationDiv.style.display = "none";
        });

        this.switchSimulationBtn.addEventListener("click", () => {
            this.introductionDiv.style.display = "none";
            this.simulationDiv.style.display = "block";

            this.updateAggregateDisplays();
            this.updateIndividualDisplays();
            this.updatePairwisePlot();
        });

        this.priorCrit1 = document.getElementById("priorCrit1");
        this.priorCrit2 = document.getElementById("priorCrit2");
        this.priorSigma1 = document.getElementById("priorSigma1");
        this.priorSigma2 = document.getElementById("priorSigma2");

        this.genCrit1 = document.getElementById("genCrit1");
        this.genCrit2 = document.getElementById("genCrit2");
        this.genSigma1 = document.getElementById("genSigma1");
        this.genSigma2 = document.getElementById("genSigma2");

        this.minStim = document.getElementById("minStim");
        this.maxStim = document.getElementById("maxStim");
        this.nTrials = document.getElementById("nTrials");
        this.nSim = document.getElementById("nSim");
        this.pCatchTrial = document.getElementById("pCatchTrial");
        this.stimSelectScheme = document.getElementById("stimSelectScheme");

        this.individualRunSelector = 
            document.getElementById("individualRunSelector");

        this.individualRunSelector.
            addEventListener("change", () => {
                this.updateIndividualDisplays();
                this.updatePairwisePlot();
            });

        this.tbtSigmaFig = document.getElementById("tbtSigmaFig");
        
        this.startWorkerBtn = document.getElementById("startWorkerBtn");
        this.terminateWorkerBtn = document.getElementById("terminateWorkerBtn");

        this.startWorkerBtn.addEventListener("click", this.initWorker);
        this.terminateWorkerBtn.addEventListener("click", this.stopSimulations);

        this.nSimInput = document.getElementById("nSimInput");
        this.nSimSpan = document.getElementById("nSimSpan");
        this.nSimDoneSpan = document.getElementById("nSimDoneSpan");

        //

        this.simData = [];
        this.opt;
        this.worker;

        //
        this.introductionDiv.style.display = "block";
    }

    getUserSettings(){
        let opt = {
            priorCrit1 : parseFloat(this.priorCrit1.value),
            priorCrit2 : parseFloat(this.priorCrit2.value),
            priorSigma1 : parseFloat(this.priorSigma1.value),
            priorSigma2 : parseFloat(this.priorSigma2.value),
            genCrit1 : parseFloat(this.genCrit1.value),
            genCrit2 : parseFloat(this.genCrit2.value),
            genSigma1 : parseFloat(this.genSigma1.value),
            genSigma2 : parseFloat(this.genSigma2.value),
            nTrials : parseInt(this.nTrials.value),
            nSim : parseInt(this.nSim.value),
            minStim : parseFloat(this.minStim.value),
            maxStim : parseFloat(this.maxStim.value),
            pCatchTrial : parseFloat(this.pCatchTrial.value),
            nParticles : 1000,
            stimSelectScheme : this.stimSelectScheme.value
        };

        let validationResult = this.validateUserSettings(opt);

        if(validationResult.optIsValid){
            this.opt = opt;
        } else {
            this.displayErrorMsg(validationResult.msg);
        }
    }

    /* TODO: How to make validation less messy...
    checkBounds(name, value, min, max){
        if(value < min | value > max){
            return `Incorrect value for ${name}, ` +
             `was ${value} but must be between ${min} and ${max}`;
        }

        return "";
    }*/

    validateUserSettings(opt){
        let validationResult = {
            optIsValid  : false,
            msg : ""
        }

        if(opt.priorCrit2 < opt.priorCrit1){
            validationResult.msg += 
                "Error in prior for criterion: b < a. \n";
        }

        if(opt.priorSigma1 < 0 | opt.priorSigma1 < 0 ){
            validationResult.msg += 
                "Error in prior for sigma: must be positive. \n";
        }

        if(opt.genSigma1 < 0 | opt.genSigma2 < 0){
            validationResult.msg += "Error in generating parameters (sigma): " + 
                "Both parameters must be > 0. \n";
        }

        if(opt.genSigma2 < opt.genSigma1){
            validationResult.msg += "Error in generating parameters (sigma): " + 
                "b < a. \n";
        }

        if(opt.genCrit2 < opt.genCrit1){
            validationResult.msg += "Error in generating parameters (criterion): " + 
                "b < a. \n";
        }

        if(opt.nTrials < 0){
            validationResult.msg += "N trials must be positive. \n";
        }

        if(opt.nSim < 0){
            validationResult.msg += "N sim must be positive. \n";
        }

        if(opt.nPartiles < 100){
            validationResult.msg += "Number of particles must be >= 100. \n";
        }

        if(opt.minStim >= opt.maxStim){
            validationResult.msg += "Maximum stimulus level must be " + 
            "larger than minimum stimulus level. \n";
        }

        if(opt.minStim < 0 | opt.maxStim < 0){
            validationResult.msg += "Stimulus level must be > 0. \n";
        }

        if(opt.pCatchTrial < 0 | opt.pCatchTrial > 1){
            validationResult.msg += "Prob. of catch trial must be between 0 and 1. \n";
        }

        if(validationResult.msg.length === 0) {
            validationResult.optIsValid = true;
        }

        return validationResult;
    }

    displayErrorMsg(msg){
        let blurDiv = document.createElement("div");
        document.body.appendChild(blurDiv);
        blurDiv.style.position = "absolute";
        blurDiv.style.top = "0px";
        blurDiv.style.left = "0px";
        blurDiv.style.height = 
            document.body.getBoundingClientRect().height  + "px";
        blurDiv.style.width = 
            document.body.getBoundingClientRect().width  + "px";
        blurDiv.style.backgroundColor = "black";
        blurDiv.style.opacity = 0.2;

        let div = document.createElement("div");
        let btnDiv = document.createElement("div");
        div.classList.add("errorMessage"); 
        let p = document.createElement("p");
        let closeBtn = document.createElement("button");

        p.innerText = "Check your settings: \n" + msg;
        closeBtn.innerText = "OK";
        closeBtn.addEventListener("click", () => { 
                div.remove();
                blurDiv.remove();
            }
        );
        
        btnDiv.style.textAlign = "center";
        btnDiv.appendChild(closeBtn);
        div.replaceChildren(p, btnDiv);
        document.body.appendChild(div);
        div.style.top = parseInt(window.innerHeight) / 2 - 
            div.getBoundingClientRect().height/2 +  
            window.scrollY + "px";
        div.style.left = parseInt(window.innerWidth) / 2 - 
            div.getBoundingClientRect().width/2 + "px";
    }

    updatePairwisePlot(){
        let xlim = [-10, 10];
        let ylim = [-10, 10];
        let x;
        let y;
        let ind;

        if(this.opt != undefined & this.simData.length > 0){
            ind = parseInt(this.individualRunSelector.value.split(" ")[1]) - 1;
            // Unwrap theta mat
            let nPointsToDraw = Math.min(this.opt.nParticles, 1000);
            x = new Array(nPointsToDraw);
            y = new Array(nPointsToDraw);
            
            for(let i = 0; i < nPointsToDraw; i++){
                x[i] = this.simData[ind].theta[i][0];
                y[i] = this.simData[ind].theta[i][1];
            }
            
            xlim = [Math.min(...x), Math.max(...x)];
            ylim = [Math.min(...y), Math.max(...y)];
        }

        //

        let pwPlot = new Plot(
            document.getElementById("pairwisePlot"),
            null,
            {
                xlim : xlim,
                ylim : ylim,
                xlab  : "Criterion",
                ylab : "Sigma"
            }
        );

        if(ind != undefined){
            pwPlot.drawPoints(x, y);
            pwPlot.vline(this.simData[ind].genTheta[0], 
                {
                    stroke : "black",
                    "stroke-dasharray" : [2, 2]
                });
            pwPlot.hline(this.simData[ind].genTheta[1], 
                {
                    stroke : "black",
                    "stroke-dasharray" : [2, 2]
                });
        }
    }

    updateIndividualDisplays = () => {
        let s, r, minS, maxS, maxN, ind;

        if(this.opt != undefined & this.simData.length > 0){
            ind = parseInt(this.individualRunSelector.value.split(" ")[1]) - 1;
            s = new Array(this.opt.nTrials);
            r = new Array(this.opt.nTrials);
            
            for(let i = 0; i < this.opt.nTrials; i++){
                s[i] = this.simData[ind].y[i][0];
                r[i] = this.simData[ind].y[i][1];
            }

            minS = Math.min(...s); 
            maxS = Math.max(...s);
            maxN = this.opt.nTrials;
        } else {
            minS = 0;
            maxS = 10;
            maxN = 100;
        }

        let sPlot = new Plot(
            document.getElementById("individualS"),
            null,
            {
                ylim : [minS, maxS],
                xlim : [0, maxN],
                xlab : "Trial",
                ylab : "Stimulus"
            }
        );

        let srPlot = new Plot(
            document.getElementById("individualSR"),
            null,
            {
                xlim : [minS, maxS],
                ylim : [0, 1],
                xlab : "Stimulus",
                ylab : "Response",
                ytickmarks : ["No", "Yes"],
                ytickplaces : [0, 1]
            }
        )

        if(this.simData.length > 0){
            sPlot.drawPoints(s);

            for(let i = 0; i < r.length; i++){
                r[i] = r[i] + Math.random() * 0.1 - 0.05;
            }
            
            srPlot.drawPoints(s, r);
        }
    }

    updateAggregateDisplays(){
        let maxX, minCrit, maxCrit, minSigma, maxSigma, 
            errorCrit, errorSigma, xvar;

        if(this.opt != undefined & this.simData.length > 0){
            minCrit = 0;
            maxCrit = 0;
            minSigma = 0;
            maxSigma = 0;
            maxX = this.opt.nTrials;
            errorCrit = new Array(this.simData.length);
            errorSigma = new Array(this.simData.length); 
            xvar = new Array(this.opt.nTrials);
    
            for(let i = 0; i < this.opt.nTrials; i++){
                xvar[i] = i + 1;
            }
            
            for(let i = 0; i < this.simData.length; i++){
                errorCrit[i] = new Array(this.opt.nTrials);
                errorSigma[i] = new Array(this.opt.nTrials); 
    
                for(let j = 0; j < this.opt.nTrials; j++){
                    errorCrit[i][j] = this.simData[i].tbtEstimates[j][0] - 
                        this.simData[i].genTheta[0];
                    errorSigma[i][j] = this.simData[i].tbtEstimates[j][1] - 
                        this.simData[i].genTheta[1];
                }
    
                if(Math.min(...errorCrit[i]) < minCrit) {
                    minCrit = Math.min(...errorCrit[i]);
                }
                if(Math.min(...errorSigma[i]) < minSigma) {
                    minSigma = Math.min(...errorSigma[i]);
                } 
                if(Math.max(...errorCrit[i]) > maxCrit) {
                    maxCrit = Math.max(...errorCrit[i]);
                }
                if(Math.max(...errorSigma[i]) > maxSigma) {
                    maxSigma = Math.max(...errorSigma[i]);
                } 
            }
        } else {
            maxX = 100;
            minCrit = -1;
            maxCrit = 1;
            minSigma = -1;
            maxSigma = 1;
        }

        let errorCritPlot = new Plot(
            document.getElementById("tbtCritFig"),
            null,
            {
                xlim : [0, maxX],
                ylim : [minCrit, maxCrit],
                xlab : "Trial",
                ylab : "Error"
            }
        );

        let errorSigmaPlot = new Plot(
            document.getElementById("tbtSigmaFig"),
            null,
            {
                xlim : [0, maxX],
                ylim : [minSigma, maxSigma],
                xlab : "Trial",
                ylab : "Error"
            }
        );

        for(let i = 0; i < this.simData.length; i++){
            let newCritLine = errorCritPlot.drawLines(xvar, errorCrit[i]);
            let newSigmaLine = errorSigmaPlot.drawLines(xvar, errorSigma[i]);

            newSigmaLine.addEventListener("click", () => {
                this.individualRunSelector.value = "Simulation " + (i + 1); 
                this.individualRunSelector.dispatchEvent(new Event("change"));
            });
            newCritLine.addEventListener("click", () => {
                this.individualRunSelector.value = "Simulation " + (i + 1); 
                this.individualRunSelector.dispatchEvent(new Event("change"));
            });
            newSigmaLine.classList.add("figureLine");
            newCritLine.classList.add("figureLine");
        }


        if(this.simData.length > 0 ){
            errorCritPlot.hline(0, { stroke : "red", "stroke-dasharray" : [2 , 2]});
            errorSigmaPlot.hline(0, { stroke : "red", "stroke-dasharray" : [2 , 2]});
        }
    }

    initWorker = () => {
        this.getUserSettings();
        // TODO: Handle exception if settings are not valid
        if(this.opt === undefined) return;

        this.worker = new Worker("/js/worker.js", {type  : "module"});
        this.worker.addEventListener("message", this.handleMessage);
        this.worker.postMessage({
            type  : "setOptions",
            value : this.opt
        });
    }

    // TODO: startOrContinue...
    startSimulations = () => {
        console.log("Starting simulations");

        this.worker.postMessage({
            type : "startSimulations"
        })

        this.nSimSpan.innerText = this.nSim.value;
    }

    handleMessage = (e) => {
        switch(e.data.type){
            case "initializationDone":
                this.startSimulations();
                break;
            case "simulationDone":
                this.addSimulation(e.data.value);
                break;
        }
    }

    stopSimulations = () => {
        this.worker.terminate();
    }

    updateRunSelector(){
        let option = document.createElement("option");
        option.innerText = "Simulation " + this.simData.length;
        this.individualRunSelector.appendChild(option);
    }

    addSimulation(sim){
        this.simData.push(sim);
        
        if(this.simData.length >= this.opt.nSim){
            this.stopSimulations();
        }

        this.nSimDoneSpan.innerText = this.simData.length;
        this.updateRunSelector();
        this.updateAggregateDisplays();
    }
}

let main = new Main();
