/* 

CHANGES FROM v1_1
- DrawPoint/s
    - addTooltip is no longer a parameter but a global option
    - these can be given an opt object as argument to customize the points

TODO

Make lty and pch arrays. that way it's easy to change them... 

lty = [
    "0",
    "2 2",
    "4 4"
]

and so on, mimicking R.


*/
export class Plot{
    constructor(svgElement, data, options){
        if(svgElement === undefined | svgElement === null){
            throw "You must supply the svg element!";
        }

        if(svgElement.children.length > 0){
            console.warn("SVG element is not empty, " +  
             "are you sure you want to initialize plot " +
             "to element id " + svgElement.id);
        }

        /* Maybe?! 
        this.data = data;
        this.options = options;
        */

        // DEFAULT OPTIONS

        this.opt = {
            type : "p",
            xlab : "x",
            ylab : "y",
            main : "",
            mar  : [80, 80, 50, 50],
            coerceToExponential : true, // ERROR not in use
            tickMarkFontSize : "min(3vw, 12pt)", // ERROR that 3vw default is shit
            labelFontSize : "min(3vw, 12pt)",
            textFontSize : "min(3vw, 12pt)",
            mainTitleFontSize : "22pt" ,
            pointColor : "rgb(240, 140, 20)",
            lineColor  : "rgb(240, 140, 20)",
            fillColor  : "rgb(240, 60, 10)",
            pointSize : 2.5,
            lineWidth : 1.25,
            axisWidth : 1.25,
            tickWidth : 1.25,
            drawAxes : true,
            drawMask : true,
            drawData : true,
            axisColor : "black",
            lineType : "solid",
            lty2 : "4 4", // ERROR SHOULD BE CALCULATED FROM DATA?!
            lty3 : "2 2",
            xlim : undefined,
            ylim : undefined,
            xtickmarks : undefined,
            ytickmarks : undefined,
            xtickplaces : undefined,
            ytickplaces : undefined,
            ncurvePoints : 100, // ERROR not in use?!
            logging : false,
            autoredraw : false, // ERROR: implement!,
            noleeway : false, // ERROR: implement 
            pruneLongTickmarks : true
        };

        this.log = "";
        this.initializePlot(svgElement, data, options);
        this.drawPlot(data, options);
    }

    initializePlot(svgElement, data, options){
        this.applyUserOptions(options);
        this.prepareData(data);
        this.calculateLimits(data);
        this.initializeTicks();
        this.initializeSVG(svgElement);
    }

    initializeTicks(){
       if(this.opt.xtickmarks === undefined & 
          this.opt.xtickplaces === undefined){
            if(this.opt.logging) {
                this.log += "x ticks/places not defined, creating automatically \n";
            }
            
            let xticks = this.createTicks(this.opt.xlim[0], this.opt.xlim[1]);
            this.opt.xtickplaces = xticks.tickplaces;
            this.opt.xtickmarks  = xticks.tickmarks;
       }

        if(this.opt.ytickmarks === undefined & 
          this.opt.ytickplaces === undefined){
            if(this.opt.logging) {
                this.log += "y ticks/places not defined, creating automatically \n";
            }

            let yticks = this.createTicks(this.opt.ylim[0], this.opt.ylim[1]);
            this.opt.ytickplaces = yticks.tickplaces;
            this.opt.ytickmarks  = yticks.tickmarks;
       }

       if(this.opt.xtickplaces != undefined & 
          this.opt.xtickmarks === undefined){
          if(this.opt.logging) {
            this.log += "x tickplaces defined but tickmarks not: using places as marks \n";
          }
          this.opt.xtickmarks = this.opt.xtickplaces;
       }


       if(this.opt.ytickplaces != undefined & 
          this.opt.ytickmarks === undefined){
          if(this.opt.logging){
             this.log += "y tickplaces defined but tickmarks not: using places as marks \n"
          }
         this.opt.ytickmarks = this.opt.ytickplaces;
       }

        if(this.opt.xtickmarks != undefined  & this.opt.xtickplaces === undefined){
            throw new Error("Tickmarks for x axis supplied but not their places!");
        }

        if(this.opt.ytickmarks != undefined & this.opt.ytickplaces === undefined){
            throw new Error("Tickmarks for y axis supplied but not their places!");
        }

        if(this.opt.xtickmarks.length != this.opt.xtickplaces.length){
            throw new Error("Size mismatch between tickmarks and places for x axis");
        }

        if(this.opt.ytickmarks.length != this.opt.ytickplaces.length){
            throw new Error("Size mismatch between tickmarks and places for y axis");
        }
    }

    /* 
    HOX HOX: Eikö kävisi järkeen, että initialisoinnin 
    jälkeen se opt-objekti olisi ns. valmis ja KAIKKI nuo piirrot
    yms tehtäisiin vain siihen pohjautuen?
    */

    // TODO: Miksei options-objektia käytetä?!
    drawPlot(data, options){
        if(this.opt.logging) this.log += "Starting to draw the plot \n";

        if(this.opt.drawMask) this.drawMask();
        if(this.opt.drawAxes) this.drawAxes();
        if(this.opt.pruneLongTickmarks) this.pruneLongTickmarks();
        if(this.opt.drawData) this.drawData(data);
    }

    // INITIALIZATION METHODS

    applyUserOptions(options){
        if(this.opt.logging) {
            this.log += "Attempting to read user supplied options \n";
        }
        if(options != undefined){
            Object.keys(options).forEach(option => {
                this.opt[option] = options[option];
            });
        }
    }

    prepareData(data){
        /* Handle cases in which either x or y or both are missing. 
           In practice there are two branches: one "dataless" branch in
           which we initialize an empty plot and one branch with data. */

        if(data === null || data === undefined){
            if(this.opt.xlim === undefined || this.opt.ylim === undefined){
                throw "When not supplying data, you must supply x and y limits";
            }

            return;
        } 
        
        if(data.x === undefined & data.y != undefined){
            let ind = new Array(data.y.length);

            for(let i = 0; i < data.y.length; i++){
                ind[i] = i + 1;
            }

            data.x = ind;
        }

        if(data.y === undefined & data.x != undefined){
            let ind = new Array(data.x.length);

            for(let i = 0; i < data.x.length; i++){
                ind[i] = i + 1;
            }

            data.y = ind;
        }
    }

    /**
     * If the user does not supply x and y limits, they have
     * to be calculated automatically. 
     * 
     * TODO: x and y axes separately!
     * @param {*} data 
     */
    calculateLimits(data){
        if(this.opt.xlim === undefined){
            this.opt.xlim = [
                Math.min(...data.x),
                Math.max(...data.x)
            ];
        }

        if(this.opt.ylim === undefined){
            this.opt.ylim = [
                Math.min(...data.y),
                Math.max(...data.y)
            ];
        }

        if(this.opt.xlim[1] - this.opt.xlim[0] < Number.MIN_VALUE){
            this.opt.xlim[1] = this.opt.xlim[0] + 0.01;
        }
        if(this.opt.ylim[1] - this.opt.ylim[0] < Number.MIN_VALUE){
            this.opt.ylim[1] = this.opt.ylim[0] + 0.01;
        }

        /* The point of this part is to add some "leeway": we 
           want the plotting area to be slightly larger than
           the range of the data.  */
        let xdivisor = this.findOptimalDivisor(
            this.opt.xlim[0], this.opt.xlim[1]);
        let ydivisor = this.findOptimalDivisor(
            this.opt.ylim[0], this.opt.ylim[1]);

        this.figLimX = [
            this.opt.xlim[0] - xdivisor / 2,
            this.opt.xlim[1] + xdivisor / 2
        ];

        this.figLimY = [
            this.opt.ylim[0] - ydivisor / 2,
            this.opt.ylim[1] + ydivisor / 2
        ];
    }

    initializeSVG(svgElement){
        this.svgElement = svgElement;
        this.dataGroup = 
            document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.maskGroup = 
            document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.xaxisGroup = 
            document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.yaxisGroup = 
            document.createElementNS("http://www.w3.org/2000/svg", "g");
        
        this.svgElement.replaceChildren(
                this.dataGroup,
                this.maskGroup,
                this.xaxisGroup,
                this.yaxisGroup 
        );

        this.height = parseFloat(svgElement.clientHeight);
        this.width  = parseFloat(svgElement.clientWidth);
     	
        this.canvasInnerHeight = this.height - 
            (this.opt.mar[0] + this.opt.mar[2]);
        this.canvasInnerWidth  = this.width  - 
            (this.opt.mar[1] + this.opt.mar[3]);
        
        this.range_x = this.figLimX[1] - this.figLimX[0];
        this.stepSize_x = this.canvasInnerWidth / this.range_x;
        
        this.range_y = this.figLimY[1] - this.figLimY[0];
        this.stepSize_y = this.canvasInnerHeight / this.range_y;
    }
	
    drawMask(){
        if(this.opt.logging) this.log += "Drawing mask \n";
        let maskSide1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        let maskSide2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        let maskSide3 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        let maskSide4 = document.createElementNS("http://www.w3.org/2000/svg", "rect");

        maskSide1.setAttribute("fill", "white");
        maskSide2.setAttribute("fill", "white");
        maskSide3.setAttribute("fill", "white");
        maskSide4.setAttribute("fill", "white");

        // The bottom mask:
        maskSide1.setAttribute("x", 0);
        maskSide1.setAttribute("y", this.height - this.opt.mar[0]);
        maskSide1.setAttribute("height", this.opt.mar[0]);
        maskSide1.setAttribute("width", this.width);

        // Left mask

        maskSide2.setAttribute("x", 0);
        maskSide2.setAttribute("y", this.opt.mar[2]);
        // ERROR: Not tall enough!!! 
        maskSide2.setAttribute("height", this.canvasInnerHeight);
        maskSide2.setAttribute("width", this.opt.mar[1]);

        // Top mask:

        maskSide3.setAttribute("x", 0);
        maskSide3.setAttribute("y", 0);
        maskSide3.setAttribute("height", this.opt.mar[2]);
        maskSide3.setAttribute("width", this.width);


        // Right mask:

        maskSide4.setAttribute("x", this.width - this.opt.mar[3]);
        maskSide4.setAttribute("y", this.opt.mar[2]);
        maskSide4.setAttribute("height", this.canvasInnerHeight);
        maskSide4.setAttribute("width", this.opt.mar[3]);

        this.maskGroup.replaceChildren(
            maskSide1,
            maskSide2,
            maskSide3,
            maskSide4
        );
    }

    drawAxes(){     
        this.drawXAxis({
            tickplaces : this.opt.xtickplaces,
            tickmarks  : this.opt.xtickmarks, 
            label      : this.opt.xlab
        });
        this.drawYAxis({
            tickplaces : this.opt.ytickplaces,
            tickmarks  : this.opt.ytickmarks, 
            label      : this.opt.ylab
        });
    }

    createTicks(min, max){
        let divisor = this.findOptimalDivisor(min, max);      
        let tickMin = Math.round(min / divisor) * divisor;
        let tickMax = Math.round(max / divisor) * divisor;
        let nTicks  = Math.round((tickMax - tickMin) / divisor);

        if(this.opt.logging) this.log += `Found divisor ${divisor} for range ${min} ${max}\n`;

        let tickplaces = new Array(nTicks);
        let tickmarks  = new Array(nTicks);
        
        let stepSize = (tickMax - tickMin) / (nTicks - 0); // ERRROR: HACK
        let scale = Math.log10(tickMax - tickMin);

        if(this.opt.logging) this.log += `Using stepsize ${stepSize} for creating ticks\n`;

        if((tickMax - tickMin) < 10) scale -= 1;
        if((tickMax - tickMin) >= 10) scale = 0;

		/* TODO this scale thing is a nightmare... inside the loop
		 * it is ceil(abs(scale))...*/

        let anyLongerThanFour = false;

        nTicks += 1; // ERRROR: HACK

        /* The logic with the anyLngerThanFour check is that if ANY of the 
           tickmarks is longer than four characters, due to graphical 
           consistency, they will all be changed to exponential form. */
        for(let i = 0; i < nTicks; i++){
            tickplaces[i] = tickMin + stepSize * i;
            tickmarks[i] = tickplaces[i].toFixed(Math.ceil(Math.abs(scale)));
            if(tickmarks[i].length > 4) {
            	anyLongerThanFour = true;
            }
        }

        if(anyLongerThanFour){
            if(this.opt.logging) this.log += "Tickmark length > 4, using exponential form \n";
            for(let i = 0; i < tickmarks.length; i++){
                tickmarks[i] = parseFloat(tickmarks[i]).toExponential();
            }
        }

        return {
            tickplaces : tickplaces,
            tickmarks  : tickmarks
        };
    }


    // DRAWING METHODS FOR MAIN PLOT ELEMENTS (AXES ETC.)

    drawXAxis(options){
        this.clearAxis("x");
        this.drawXAxisLine();

        // ERROR: Is this logic sound?
        if(options.tickmarks != null){
            this.drawXTickmarks(options.tickplaces, options.tickmarks);
        } else {
            if(this.opt.logging) this.log += "Tickmarks null, not drawing tickmarks"
        }
        this.addXLabel(options.label);
    }

    drawXAxisLine(){
        const axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        axis.setAttribute("x1", this.opt.mar[1]);
        axis.setAttribute("y1", this.height - this.opt.mar[0]);
        axis.setAttribute("x2", this.width - this.opt.mar[3]);
        axis.setAttribute("y2", this.height - this.opt.mar[0]);
        axis.setAttribute("stroke", this.opt.axisColor);
        axis.setAttribute("stroke-width", this.opt.axisWidth);
        
        this.xaxisGroup.appendChild(axis);   
    }

    drawXTickmarks(tickPlaces, tickLabels){
        if(tickLabels === undefined) {
            if(this.logging) this.log += "No tick labels, using tickplaces as labels (x axis). \n";
            tickLabels = Array.from(tickPlaces);
            tickLabels = this.checkTicklabels(tickLabels);
        }

        if(this.logging) this.log += "Drawing tickmarks (x axis) \n";

        for(let i = 0; i < tickPlaces.length; i++){
            const tmark = document.createElementNS("http://www.w3.org/2000/svg", "line");
            const tmarkText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            
            tmarkText.textContent = tickLabels[i];
            tmarkText.setAttribute("x", this.transformXCoordinate(tickPlaces[i]));
            tmarkText.setAttribute("y", this.height - this.opt.mar[0] + 20); // ERROR GET RID OF THIS CONSTANT
            tmarkText.setAttribute("text-anchor", "middle")
            tmarkText.setAttribute("font-size", this.opt.tickMarkFontSize);
            tmarkText.classList.add("tickmarkText");
            
            tmark.setAttribute("x1", this.transformXCoordinate(tickPlaces[i]));
            tmark.setAttribute("y1", this.height - this.opt.mar[0] - 5); // ERROR GET RID OF CONSTANT
            tmark.setAttribute("x2", this.transformXCoordinate(tickPlaces[i]));
            tmark.setAttribute("y2", this.height - this.opt.mar[0] + 5); // ERROR GET RID OF CONSTANT
            tmark.setAttribute("stroke", "black");
            tmark.setAttribute("stroke-width", this.opt.tickWidth);
            tmark.classList.add("tickmark");
            
            this.xaxisGroup.appendChild(tmark);
            this.xaxisGroup.appendChild(tmarkText);
        }
    }

    addXLabel(labText){
        if(this.logging) this.log += "Adding x label \n";

        if(this.xaxisGroup.getElementsByClassName("axisLabel").length > 0){
            if(this.logging) this.log += "Removing previous x label \n";
            this.xaxisGroup.getElementsByClassName("axisLabel")[0].remove();
        }

        const axisLabel = 
            document.createElementNS("http://www.w3.org/2000/svg", "text");
        axisLabel.setAttribute("y",  
            this.height - this.opt.mar[0] + 40); // ERROR GET RID OF THIS CONSTANT
        axisLabel.setAttribute("x", 
            this.transformXCoordinate((this.figLimX[0] + this.figLimX[1]) / 2.0));
        axisLabel.setAttribute("text-anchor", "middle");
        axisLabel.setAttribute("font-size", this.opt.labelFontSize);
        axisLabel.classList.add("axisLabel");
        
        axisLabel.textContent = labText;
        this.xaxisGroup.appendChild(axisLabel);
    }

    drawYAxis(options){
        this.clearAxis("y");
        this.drawYAxisLine();

        // ERROR: Is this logic sound?
        if(options.tickmarks != null){
            this.drawYTickmarks(options.tickplaces, options.tickmarks);
        }
        this.addYLabel(options.label);
    }

    drawYAxisLine(){
        const axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        axis.setAttribute("x1", this.opt.mar[1]);
        axis.setAttribute("y1", this.height - this.opt.mar[0]);
        axis.setAttribute("x2", this.opt.mar[1]);
        axis.setAttribute("y2", this.opt.mar[2]);
        axis.setAttribute("stroke", this.opt.axisColor);
        axis.setAttribute("stroke-width", this.opt.axisWidth);
        
        this.yaxisGroup.appendChild(axis);         
    }
    
    drawYTickmarks(tickPlaces, tickLabels){    
        if(tickLabels === undefined) {
            tickLabels = Array.from(tickPlaces);
            tickLabels = this.checkTicklabels(tickLabels);
        }
        
        for(let i = 0; i < tickPlaces.length; i++){
            const tmark = document.createElementNS("http://www.w3.org/2000/svg", "line");
            const tmarkText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            
            tmarkText.textContent = tickLabels[i];
            tmarkText.setAttribute("x", this.opt.mar[1] / 1.35); // ERRROR: GET RID OF THAT CONSTANT
            tmarkText.setAttribute("y", this.transformYCoordinate(tickPlaces[i]));
            tmarkText.setAttribute("text-anchor", "middle");
            tmarkText.setAttribute("dominant-baseline", "middle");
            tmarkText.setAttribute("font-size", this.opt.tickMarkFontSize);
            tmarkText.setAttribute("transform", 
               `rotate(270 ${this.opt.mar[1] / 1.35} ${this.transformYCoordinate(tickPlaces[i])})`);
            tmarkText.classList.add("tickmarkText");   
            
            tmark.setAttribute("x1", this.opt.mar[1] - 5); // ERROR GET RID OF CONSTANT
            tmark.setAttribute("y1", this.transformYCoordinate(tickPlaces[i]));
            tmark.setAttribute("x2", this.opt.mar[1] + 5 ); // ERROR GET RID OF CONSTANT
            tmark.setAttribute("y2", this.transformYCoordinate(tickPlaces[i]));
            tmark.setAttribute("stroke", "black");
            tmark.setAttribute("stroke-width", this.opt.tickWidth);
            tmark.classList.add("tickMark");
            
            this.yaxisGroup.appendChild(tmark);
            this.yaxisGroup.appendChild(tmarkText);
        }
    }

    addYLabel(labText){
        const axisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
       
        let xcoord = this.opt.mar[1] / 2;
        let ycoord = this.transformYCoordinate((this.figLimY[1] + this.figLimY[0]) / 2.0); 
        axisLabel.textContent = labText;
        axisLabel.setAttribute("font-size", this.opt.labelFontSize);
        axisLabel.setAttribute("x",xcoord);
        axisLabel.setAttribute("y",ycoord);
        axisLabel.setAttribute("transform", "rotate(270," + xcoord + "," + ycoord + ")");
        axisLabel.setAttribute("text-anchor", "middle");
        
        this.yaxisGroup.appendChild(axisLabel);      
    }

    /**
     * This prunes tickmarks that overlap.
     */
    pruneLongTickmarks(){
        this.pruneAxis(this.xaxisGroup);
        this.pruneAxis(this.yaxisGroup);
    }

    pruneAxis(axisGroup){
        let tmTexts = axisGroup.getElementsByClassName("tickmarkText");
        
        for(let i = 0; i < (tmTexts.length - 1); i++){
            if(this.boundingRectanglesOverlap(tmTexts[i], tmTexts[i + 1])){
                if(tmTexts[i].textContent.length > tmTexts[i + 1].textContent.length){
                    tmTexts[i].remove();
                } else{
                    tmTexts[i + 1].remove();
                }

                i = Math.max(i - 2, 0);
            }
        }
    }

    // DRAWING METHODS FOR DATA (POINTS, LINES, ETC)

    drawData(data){
        if(data != null){
            switch(this.opt.type){
                case "p":
                    this.drawPoints(data.x, data.y, true);
                    break;
                case "l":
                    this.drawLines(data.x, data.y);
                    break;
                case "b":
                    console.warn("Plot type" + b + "Not implemented"); // ERROR
                    break;
            }
        }
    }


    drawRect(x, y, width, height, opt){
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

        let xcoord = this.transformXCoordinate(x);
        let ycoord = this.transformYCoordinate(y);
        let w = this.transformXCoordinate(x + width) - xcoord;
        let h = this.transformYCoordinate(y - height) - ycoord;

        // Because the canvas is "upside down":
        ycoord -= h;

        rect.setAttribute("x", xcoord);
        rect.setAttribute("y", ycoord);
        rect.setAttribute("width", w);
        rect.setAttribute("height", h);
        rect.setAttribute("fill", "black");
        
        this.dataGroup.appendChild(rect);
        
        if(opt != undefined){
            this.applyCustomOptions(rect, opt);
        } 
        
        return rect;
    }

    drawPoint(x, y, opt){
        const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        point.setAttribute("cx", this.transformXCoordinate(x));
        point.setAttribute("cy", this.transformYCoordinate(y));
        point.setAttribute("r", this.opt.pointSize);
        point.setAttribute("fill", this.opt.pointColor);
        
        if(this.opt.addTooltip){
            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = "X: " + x + " | Y: " + y;
            point.appendChild(title);
        }
        
        this.dataGroup.appendChild(point);

        if(opt != undefined){
            this.applyCustomOptions(point, opt);
        }
        
        return point;   
    }

    drawPoints(x, y, opt){
        if(x === undefined){
            throw "Error in drawPoints -- you need to supply at least x values";
        }

        if(y === undefined || y === null){
            y = Array.from(x);
            x = new Array(y.length);

            for(let i = 0; i < x.length; i++){
                x[i] = (i + 1);
            }
        }

        if(x.length != y.length){
          throw "Error in drawing points: x and y coordinates differ in length";
        }
        
        let points = new Array(x.length);
        
        for(let i = 0; i < x.length; i++){
            points[i] = this.drawPoint(x[i], y[i], opt);
        }
        
        return points;
    }

        /**
     * 
     * @param {Number[]} x 
     * @param {Number[]} y 
     * @param {*} col 
     * @returns The line SVG element
     */
        drawLine(x, y, opt){
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", this.transformXCoordinate(x[0]));
            line.setAttribute("y1", this.transformYCoordinate(y[0]));
            line.setAttribute("x2", this.transformXCoordinate(x[1]));
            line.setAttribute("y2", this.transformYCoordinate(y[1]));
            line.setAttribute("stroke", this.opt.lineColor);
            line.setAttribute("stroke-width", this.opt.lineWidth);
    
            if(opt != undefined){
                if(opt.lty === 2){
                    line.setAttribute("stroke-dasharray", this.opt.lty2);
                }
                if(opt.lty === 3){
                    line.setAttribute("stroke-dasharray", this.opt.lty3);
                }
    
                Object.keys(opt).forEach(key => {
                    line.setAttribute(key, opt[key]);
                });
            }
    
            this.dataGroup.appendChild(line);        
            this.applyCustomOptions(line);
    
            return line;
        }
    
        drawLines(x, y, opt){
            if(y === undefined | y === null){
                y = Array.from(x);
                x = new Array(y.length);
                
                for(let i = 0; i < x.length; i++){
                    x[i] = (i + 1);
                }
            }

            if(x.length != y.length){
              throw "Error in drawing lines: x and y coordinates differ in length";
            }   
            
            let d = "";
            
            d += "M" + this.transformXCoordinate(x[0]) + 
                " " + this.transformYCoordinate(y[0]);
            
            for(let i = 1; i < x.length; i++){
                d += "L" + this.transformXCoordinate(x[i]) + 
                    " " + this.transformYCoordinate(y[i]); 
            }
            
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", d);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", this.opt.lineColor);
            path.setAttribute("stroke-width", this.opt.lineWidth);
    
            this.dataGroup.appendChild(path);
            this.applyCustomOptions(path, opt);
            return path;
        }
    
        drawPolygon(x, y, opt){
            if(x.length != y.length){
              throw "Error in drawing a polygon: x and y coordinates differ in length";
            }
            
            const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            
            for(let i = 0; i < x.length; i++){
                let newPoint = this.svgElement.createSVGPoint();
                newPoint.x = this.transformXCoordinate(x[i]);
                newPoint.y = this.transformYCoordinate(y[i]);
                polygon.points.appendItem(newPoint);
            }
            
            this.dataGroup.appendChild(polygon);  
            this.applyCustomOptions(polygon, opt);
    
            return polygon; 
        }
    
        drawCurve(f, min, max, opt){
            let n = 100;
            let x = new Array(n);
            let y = new Array(n);
    
            let stepSize = (max - min) / (n - 1);
    
            for(let i = 0; i < n; i++){
                x[i] = min + i * stepSize;
                y[i] = f(x[i]);
            }
    
            let line = this.drawLines(x, y, opt);
            return line;
        }
    
        hline(ycoord, opt){
            let line = this.drawLine(this.figLimX, [ycoord, ycoord], opt);
            return line;
        }
    
        vline(xcoord, opt){
            let line = this.drawLine([xcoord, xcoord], this.figLimY, opt);
            return line;
        }
    
        addText(text, x, y, opt){
            const newTextEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
            
            newTextEl.textContent = text;
            newTextEl.setAttribute("y", this.transformYCoordinate(y));
            newTextEl.setAttribute("x", this.transformXCoordinate(x));
            newTextEl.setAttribute("text-anchor", "middle");
            newTextEl.setAttribute("alignment-baseline", "middle");
            newTextEl.setAttribute("font-size", this.opt.textFontSize);
    
            this.dataGroup.appendChild(newTextEl);
            this.applyCustomOptions(newTextEl, opt);
    
            return newTextEl;
        }
    
        /*  */
    
        addMainTitle(labText){
            const axisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            axisLabel.setAttribute("y",  this.opt.mar[2] / 2.0); // ERROR: Get rid of that division
            axisLabel.setAttribute("x", this.transformXCoordinate((this.figLimX[1] + this.figLimX[0]) / 2.0))
            axisLabel.setAttribute("text-anchor", "middle");
            axisLabel.textContent = labText;
            axisLabel.setAttribute("font-size", this.opt.mainTitleFontSize);
    
            this.svgElement.appendChild(axisLabel);   
        }

    // UTILITY FUNCTIONS

    transformXCoordinate(x){
        let coord = this.opt.mar[1] + 
            (x - this.figLimX[0]) * this.stepSize_x;

        return coord;
    }
    
    transformYCoordinate(y){
        let coord = this.height - this.opt.mar[0] - 
            (y - this.figLimY[0]) * this.stepSize_y;
        return coord;
    }

    clearAxis(axis){
        if(axis === "x"){
            this.xaxisGroup.replaceChildren([]);
        } else if(axis === "y"){
            this.yaxisGroup.replaceChildren([]);
        } else {
            throw "Unable to clear axis " + axis;
        }
    }

    clearData(){
        this.dataGroup.replaceChildren([]);
    }

    clearCanvas(){
        // ERROR: Should clear everything EXCEPT the groups! 
        this.svgElement.replaceChildren([]);
    }

    applyCustomOptions(element, opt){
        if(opt === undefined) return;
        // The idea is to first look at special cases like these 
        // R-like lty things and rotation. After this the remaining
        // keys of opt are iterated through with no special considerations.   

        if(opt.lty === 2){
            element.setAttribute("stroke-dasharray", this.opt.lty2);
            delete(opt["lty"]);
        }

        if(opt.lty === 3){
            element.setAttribute("stroke-dasharray", this.opt.lty3);
            delete(opt["lty"]);
        }

        if(opt.label != undefined){
            let lab = document.createElementNS("http://www.w3.org/2000/svg", "title");
            lab.textContent = opt.label;
            element.appendChild(lab);
            delete(opt["label"]);
        } 

        if(opt.rotation != undefined){
            this.rotateElement(element, opt.rotation);
            delete(opt["rotation"]);
        } 

        Object.keys(opt).forEach(key => {
            element.setAttribute(key, opt[key]);
        });
    }

    rotateElement(element, degrees){
        // TODO: IF X and Y ARE SET WHEN ROTATED THAT KINDA SCREWS THINGS OVER!!!!

        // NOTE: If the transform attribute is not empty, we want to keep it
        let pt = element.getAttribute("transform");

        if(pt != null){
            let rotMatch = pt.match(/rotate.+?\)/);
            pt = pt.slice(0, rotMatch.index) + 
                pt.slice(rotMatch.index + rotMatch[0].length);
        }  else {
            pt = "";
        }

        let bbox = element.getBBox();
        let c1 = bbox.x + bbox.width / 2.0;
        let c2 = bbox.y + bbox.height / 2.0;

        element.setAttribute(
            "transform",  
            pt + `rotate(${degrees} ${c1} ${c2})`);
    }

        /**
     * Tries to find a pretty divisor that would divide the range 
     * between the input min and max values into about five 
     * intervals.
     * @param {Number} max
     * @param {Number} min  
     * @returns The optimal divisor
     */
    findOptimalDivisor(min, max){
        // ERROR: Prune this array. (But I don't want to think about it...). Just do it!!!! 
        let divisors = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 15, 20, 25, 50];
        let range = max - min;
        let scale = Math.floor(Math.log10(range));
    
        if(scale != 0){
            let scaler = Math.pow(10, scale);
            for(let i = 0; i < divisors.length; i++){
                divisors[i] *= scaler;
                // ERROR: What in the fuck is going on with that scaler/10 business?! 
                // It's SHIT!!!!
                divisors[i] = Math.round(divisors[i] / (scaler / 10)) * (scaler / 10);
            }
        }
    
        let ndivisions = new Array(divisors.length);
    
        for(let i = 0; i < divisors.length; i++){
            ndivisions[i] = Math.ceil(range / divisors[i]);
        }
    
        let curDivisor = divisors[0];
        let curMin     = Math.abs(ndivisions[0] - 5);
    
        for(let i = 1; i < divisors.length; i++){
            let ndiv = Math.abs(ndivisions[i] - 5);
    
            if(ndiv < curMin){
                curMin = ndiv;
                curDivisor = divisors[i];
            }
        }
    
        return curDivisor;
    }

    /**
     * Checks if the bounding boxes of two HTML elements overlap.
     * Uses their getBoundingClientRect method to get the bounding boxes, 
     * so make sure the elements have that sort of a method.
     * @param {HTMLElement} element1 
     * @param {HTMLElement} element2 
     * @returns
     */
    boundingRectanglesOverlap(element1, element2){
        let rect1 = element1.getBoundingClientRect();
        let rect2 = element2.getBoundingClientRect();
        
        let rect1cy = rect1.bottom + rect1.height / 2;
        let rect2cy = rect2.bottom + rect2.height / 2;

        let rect1cx = rect1.left + rect1.width / 2;
        let rect2cx = rect2.left + rect2.width / 2;
        
        let dx = Math.abs(rect1cx - rect2cx);
        let dy = Math.abs(rect1cy - rect2cy);
        
        if(dx < rect1.width & dy < rect1.height){
            return true;
        } 
        
        if(dx < rect2.width & dy < rect2.height){
            return true;
        }
        
        return false;
    }
}
