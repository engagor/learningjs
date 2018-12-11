const _und = require('underscore');

class TreeModel {
    constructor(root, featureMapping, majorLabel) {
        this.model = root;
        this.featureMapping = featureMapping;
        this.majorLabel = majorLabel;
    }

    classify(sample) {
        let root = this.model;
        if (typeof root === 'undefined') {
            return 'null';
        }
        while (root.type != "result") {
            let childNode;
            if (root.type === 'feature_real') {
                let feature_name = root.name;
                let sampleVal = parseFloat(sample[this.featureMapping[feature_name]]);
                if (sampleVal <= root.cut)
                    childNode = root.vals[1];
                else
                    childNode = root.vals[0];
            } else {
                let attr = root.name;
                let sampleVal = sample[this.featureMapping[attr]];
                childNode = _und.detect(root.vals, function (x) {
                    return x.name == sampleVal
                });
            }
            //unseen feature value (didn't appear in training data)
            if (typeof childNode === 'undefined') {
                return this.majorLabel;
            }
            root = childNode.child;
        }
        return root.val;
    }

    calcAccuracy(samples, targets, cb) {
        let total = samples.length;
        let correct = 0;
        for (let i = 0; i < samples.length; i++) {
            let pred = this.classify(samples[i]);
            let actual = targets[i];
            if (pred === actual) {
                correct++;
            }
        }
        if (total > 0)
            cb(correct / total, correct, total);
        else
            cb(0.0);
    }

    serialize() {
        let featureMapping = {};

        for (let i in this.featureMapping) {
            if (!this.featureMapping.hasOwnProperty(i)) {
                continue;
            }

            featureMapping[i] = this.featureMapping[i];
        }

        let objectRoot = {
            model: this.model,
            featureMapping: featureMapping,
            majorLabel: this.majorLabel,
        };

        return JSON.stringify(objectRoot);
    }

    unserialize(jsonString) {
        let objectRoot = JSON.parse(jsonString);

        this.model = objectRoot.model;
        this.featureMapping = objectRoot.featureMapping;
        this.majorLabel = objectRoot.majorLabel;
    }
}

module.exports = TreeModel;
