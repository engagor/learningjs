const LogisticModel = require('./logisticModel.js');

class Logistic {
    train(D, cb) {
        cb(
            new LogisticModel(
                this.optimize(D),
                D.ntargets,
                D.l_targets,
                D.nfeatures
            ),
            undefined
        );
    }

    printThetas(thetas, ntargets, l_targets, nfeatures) {
        for (let i = 0; i < ntargets; i++) {
            console.log(l_targets[i]);
            for (let j = 0; j < nfeatures; j++) {
                process.stdout.write(thetas[l_targets[i]][j] + ' ');
            }
            console.log(' ');
        }
    }

    optimize(D) {
        if (!('optimizer' in D)) D.optimizer = 'sgd';
        if (!('learning_rate' in D)) D.learning_rate = 0.005;
        if (!('l2_weight' in D)) D.l2_weight = 0.000001;
        if (!('iterations' in D)) D.iterations = 50;

        let thetas = {};
        for (let i = 0; i < D.ntargets; i++) {
            let theta = [];
            for (let j = 0; j < D.nfeatures; j++) {
                theta.push(0.0);
            }
            thetas[D.l_targets[i]] = theta;
        }
        for(var i=0;i<D.iterations;i++) {
            if(D.optimizer === 'sgd')
                this.sgd_once(thetas, D.data, D.nfeatures, D.targets,D.l_targets, D.ntargets, D.learning_rate, D.l2_weight);
            else if (D.optimizer === 'gd')
                this.gd_batch(thetas, D.data, D.nfeatures,D.targets,D.l_targets, D.ntargets, D.learning_rate, D.l2_weight);
            else {
                console.log('unrecognized optimizer:'+D.optimizer);
                break;
            }
        }
        //this.printThetas(thetas, D.ntargets, D.l_targets, D.nfeatures);
        return thetas;
    }

    gd_batch(thetas, training, nfeatures, targets, l_targets, ntargets, learning_rate, l2_weight) {
        for (let t = 0; t < ntargets; t++) {
            let gradient = [];
            for (let k = 0; k < nfeatures; k++) {
                gradient.push(0.0);
            }
            let target = l_targets[t];

            for (let i = 0; i < training.length; i++) {
                let prdt = [], this_prdt;
                prdt.push(this.compThetaXProduct(thetas[l_targets[0]], training[i], nfeatures));
                if (t == 0) this_prdt = prdt[0];
                let max_prdt = prdt[0];

                for (let j = 1; j < ntargets; j++) {
                    let prdt1 = this.compThetaXProduct(thetas[l_targets[j]], training[i], nfeatures);
                    prdt[j] = prdt1;
                    if (t == j) this_prdt = prdt1;
                    if (max_prdt < prdt1) max_prdt = prdt1;
                }
                let z = 0.0;
                for (let j = 0; j < ntargets; j++) {
                    z += Math.exp(prdt[j] - max_prdt);
                }
                let p = Math.exp(this_prdt - max_prdt) / z;
                for (let k = 0; k < nfeatures; k++) {
                    if (target === targets[i]) {
                        gradient[k] += ((1.0 - p) * training[i][k]);
                    } else {
                        gradient[k] += ((0.0 - p) * training[i][k]);
                    }
                }
            }
            let theta = thetas[target];
            for (let k = 0; k < nfeatures; k++) {
                theta[k] += (learning_rate * gradient[k] - 2 * training.length * l2_weight * theta[k]);
            }
        }
    }

    sgd_once(thetas, training, nfeatures, targets, l_targets, ntargets, learning_rate, l2_weight) {
        for (let i = 0; i < training.length; i++) {
            let prdt = [];
            prdt.push(this.compThetaXProduct(thetas[l_targets[0]], training[i], nfeatures));
            let max_prdt = prdt[0];
            for (let j = 1; j < ntargets; j++) {
                let prdt1 = this.compThetaXProduct(thetas[l_targets[j]], training[i], nfeatures);
                prdt[j] = prdt1;
                if (max_prdt < prdt1) max_prdt = prdt1;
            }
            let z = 0.0;
            for (let j = 0; j < ntargets; j++) {
                z += Math.exp(prdt[j] - max_prdt);
            }
            for (let j = 0; j < ntargets; j++) {
                let p = Math.exp(prdt[j] - max_prdt) / z;
                let target = l_targets[j];
                let theta = thetas[target];
                for (let k = 0; k < nfeatures; k++) {
                    if (target === targets[i]) {
                        theta[k] += (learning_rate * (1.0 - p) * training[i][k] - 2 * l2_weight * theta[k]);
                    } else {
                        theta[k] += (learning_rate * (0.0 - p) * training[i][k] - 2 * l2_weight * theta[k]);
                    }
                }
            }
        }
    }

    compThetaXProduct(theta, sample, nfeatures) {
        let a = 0;
        for (let i = 0; i < nfeatures; i++) {
            a += theta[i] * sample[i];
        }
        return a;
    }
}

module.exports = Logistic;