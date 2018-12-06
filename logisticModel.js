class LogisticModel {
    constructor(thetas, nTargets, lTargets, features) {
        this.thetas = thetas;
        this.nTargets = nTargets;
        this.lTargets = lTargets;
        this.features = features;
    }

    classify(sample) {
        let max_p = this.compThetaXProduct(this.thetas[this.lTargets[0]], sample, this.features);
        let max_t = this.lTargets[0];
        for (let i = 1; i < this.nTargets; i++) {
            let target = this.lTargets[i];
            let p = this.compThetaXProduct(this.thetas[target], sample, this.features);
            if (max_p < p) {
                max_p = p;
                max_t = target;
            }
        }
        return max_t;
    }
    calcAccuracy (samples, targets, cb) {
        let total = samples.length;
        let correct = 0;
        for (let i = 0; i < samples.length; i++) {
            let pred = this.classify(samples[i]);
            let actual = targets[i];
            //console.log('predict:'+pred,' actual:'+actual);
            if (pred === actual) {
                correct++;
            }
        }
        if (total > 0)
            cb(correct / total, correct, total);
        else
            cb(0.0);
    }

    compThetaXProduct(theta, sample, nfeatures) {
        let a = 0;
        for (let i = 0; i < nfeatures; i++) {
            a += theta[i] * sample[i];
        }
        return a;
    }

    serialize() {
        let root = this.thetas;
        root.nTargets = this.nTargets;
        root.lTargets = this.lTargets;
        root.features = this.features;
        return JSON.stringify(root);
    }

    unserialize(jsonString) {
        let data = JSON.parse(jsonString);
        this.nTargets = data.nTargets.slice();
        this.lTargets = data.lTargets.slice();
        this.features = data.features.slice();
        delete data.nTargets;
        delete data.lTargets;
        delete data.features;
        this.thetas = data;
    }
}

module.exports = LogisticModel;