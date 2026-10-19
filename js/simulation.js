import { Stats } from "./statsmath_0_1.js";
import { Matrix, SIS } from "./sis_v0_11.js";
import { goldenSectionSearch } from "./goldenSectionSearch.js";

console.log("Simulation imported");

export class Simulation {
    constructor(opt) {
        this.opt = opt;

        this.sis = new SIS({
            drawFromPrior: function (n) {
                let theta = new Matrix({ ncol: 2, nrow: n });
                theta.setCol(0, Stats.rnorm(
                    n, opt.priorCrit1, opt.priorCrit2));
                theta.setCol(1, Stats.rgamma(
                    n, opt.priorSigma1, opt.priorSigma2));

                return theta;
            },

            prior: function (theta) {
                let d = new Array(theta.nrow);

                for (let i = 0; i < theta.nrow; i++) {
                    d[i] = Stats.dnorm(
                        theta.get(i, 0), opt.priorCrit1, opt.priorCrit2) *
                        Stats.dgamma(
                            theta.get(i, 1), opt.priorSigma1, opt.priorSigma2);
                }

                return d;
            },

            likelihood: function (y, theta) {
                let lh = new Array(theta.nrow);


                for (let i = 0; i < theta.nrow; i++) {
                    lh[i] = Stats.dbernoulli(
                        y[1], this.psi(y[0], theta.getRow(i)));
                }

                return lh;
            },

            nParticles: opt.nParticles
        },
            {
                temperingLimit: 0.50,
                rejuvenationLimit: 0.70
            });
        this.sis.psi = this.psi;

        this.pCatchTrial = opt.pCatchTrial;
        this.genTheta = [
            Stats.runif(1, opt.genCrit1, opt.genCrit2)[0],
            Stats.runif(1, opt.genSigma1, opt.genSigma2)[0]
        ];

        this.tbtEstimates = new Array(opt.nTrials);
    }

    getNextStimulus = (sis) => {

        if(Math.random() < this.opt.pCatchTrial){
            return 0;
        }

        switch(this.opt.stimSelectScheme){
            case  "Random":
                return Math.random() * this.opt.maxStim + this.opt.minStim;
                break;
            case "Posterior mean":
                return sis.getMarginalMus()[1];
                break;
            case "Minimise entropy":
                // TODO: Try/Catch
                let res = goldenSectionSearch(
                    (x) => {
                        return -this.informationGain(x, sis);
                    },
                    0.1, 50,
                    {
                        absTol: 0.25
                    }
                );
        
                return res.objective;
                break;
        }
    }

    hBernoulli(p) {
        if (p <= Number.MIN_VALUE | p >= (1 - Number.MIN_VALUE)) return 0;

        return -(p * Math.log(p) + (1 - p) * Math.log(1 - p));
    }

    informationGain(s, sis) {
        let conditionalH, marginalH, pYes, marginalPYes;

        marginalPYes = 0;
        conditionalH = 0;
        marginalH = 0;
        pYes = new Array(sis.theta.nrow);

        for (let i = 0; i < sis.theta.nrow; i++) {
            pYes[i] = this.psi(s, sis.theta.getRow(i));
            if(isNaN(pYes[i])){
                console.log("P yes was nan");
            }

            if(isNaN(this.hBernoulli(pYes[i]))){
                console.log("Bernoulli 1:")
                console.log(pYes[i]);
            }
            conditionalH += this.hBernoulli(pYes[i]) * sis.w[i];
            marginalPYes += pYes[i] * sis.w[i];
        }

        if(isNaN(this.hBernoulli(marginalPYes))){
                console.log("Bernoulli 2:")
                console.log(marginalPYes);
        }

        marginalH = this.hBernoulli(marginalPYes);

        return marginalH - conditionalH;
    }

    psi(s, theta) {
        return Stats.phi(theta[0] + s / theta[1]);
    }

    runSimulation() {
        let s, r;

        for (let i = 0; i < this.opt.nTrials; i++) {
            if (Math.random() < this.pCatchTrial) {
                s = 0;
            } else {
                //s = Math.random() * this.genTheta[1] * 3;
                //s = this.sis.getMarginalMus()[1];
                s = this.getNextStimulus(this.sis);
            }

            r = Stats.rbernoulli(1, this.psi(s, this.genTheta))[0];
            this.sis.addObservation([s, r]);
            this.tbtEstimates[i] = this.sis.getMarginalMus();
        }
    }

    getData() {
        console.log(this.sis);
        return {
            tbtEstimates: this.tbtEstimates,
            genTheta: this.genTheta,
            y: this.sis.y.getData(),
            theta: this.sis.getIIDSample().getData()
        };
    }
}
