/**
 * From: https://en.wikipedia.org/wiki/Golden-section_search
 * Wikipedia mentions that a reasonable value for relTol is 
 * sqrt(e) where e is the desired absolute tolerance.
 * @param {Function} f 
 * @param {Number} min 
 * @param {Number} max 
 * @param {Number} maxNiter 
 * @param {Object} opt 
 * @param {Number} opt.maxNIter
 * @param {Number} opt.absTol
 * @param {Number} opt.relTol
 * @returns 
 */
export function goldenSectionSearch(f, min, max, opt_){
    // x = argument, f = function value
    let x1, x2, x3, x4, f1, f2, f3, f4, invPhi, code, opt;

    opt = {
        maxNIter : 100,
        absTol   : 1e-6,
        relTol   : Math.sqrt(1e-6) 
    }

    if(opt_ != undefined){
        Object.keys(opt_).forEach(key => {
            opt[key] = opt_[key];
        });
    }

    code = -1; // -1 = maxIter reached, 0 = absTol/relTol reached

    invPhi = 1.0 / ((1 + Math.sqrt(5)) / 2);
    x1 = min;
    x4 = max;
    x2 = (x1 - x4) * invPhi + x4;
    x3 = (x4 - x1) * invPhi + x1;

    f1 = f(x1);
    f2 = f(x2);
    f3 = f(x3);
    f4 = f(x4);

    for(let i = 0; i < opt.maxNIter; i++){
        if(isNaN(f1) | isNaN(f2) | isNaN(f3) | isNaN(f3)){
            throw new Error("NaN during minimization");
        }

        if(f2 < f3 | f1 < f4){
            x4 = x3;
            x3 = x2;
            x2 = (x1 - x4) * invPhi + x4;
            
            f3 = f2;
            f4 = f3;
            f2 = f(x2);
        } else {
            x1 = x2;
            x2 = x3;
            x3 = (x4 - x1) * invPhi + x1;
            
            f1 = f2;
            f2 = f3;
            f3 = f(x3);            
        }

        if(Math.abs(x3 - x1) < opt.relTol * (Math.abs(x2) + Math.abs(x4))){
            code = 0;
            break;
        } else if((x4 - x1) < opt.absTol){
            code = 0;
            break;
        }        
    }

    return {
        objective : (x4 + x1) / 2.0,
        minimum : f((x4 + x1) / 2.0),
        code : code,
        x1 : x1,
        x4 : x4
    }
}
