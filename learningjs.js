////////////////////////////////////////////////////////////////////////////////////////////////
// javascript implementation of 
//   decision tree
//   logistic regression
//
// author: yandong liu
//  email: yandongl _at_ cs.cmu.edu
////////////////////////////////////////////////////////////////////////////////////////////////

let _und = require('underscore');
let debug = false;

function debugp(msg, depth) {
    if (!debug) return;
    let s = '';
    for (let i = 0; i < depth * 2; i++) {
        s += ' ';
    }
    console.log(s, msg);
}

class Tree {
    train(D, cb) {
        let major_label = this.mostCommon(D.targets);
        cb({
            model: this._c45(D.data, D.targets, D.l_featuresIndex, D.featureNames, D.featuresType, major_label),
            classify: function (sample) {
                let root = this.model;
                if (typeof root === 'undefined') {
                    return 'null';
                }
                while (root.type != "result") {
                    let childNode;
                    if (root.type === 'feature_real') {
                        let feature_name = root.name;
                        let sampleVal = parseFloat(sample[D.feature_name2id[feature_name]]);
                        if (sampleVal <= root.cut)
                            childNode = root.vals[1];
                        else
                            childNode = root.vals[0];
                    } else {
                        let attr = root.name;
                        let sampleVal = sample[D.feature_name2id[attr]];
                        childNode = _und.detect(root.vals, function (x) {
                            return x.name == sampleVal
                        });
                    }
                    //unseen feature value (didn't appear in training data)
                    if (typeof childNode === 'undefined') {
                        //console.log('unseen feature value:',root.name,'sample:',sample);
                        return major_label;
                    }
                    root = childNode.child;
                }
                return root.val;
            },
            calcAccuracy: function (samples, targets, cb) {
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
            },
        }, undefined);
    }

    _c45(data, targets, l_features_id, l_features_name, featuresType, major_label) {
        let node;
        if (targets.length == 0) {
            debugp("==no data", 0);
            return {type: "result", val: major_label, name: major_label, alias: major_label + this.randomTag()};
        }
        if (targets.length == 1) {
            debugp("==end node " + targets[0], 0);
            return {type: "result", val: targets[0], name: targets[0], alias: targets[0] + this.randomTag()};
        }
        if (l_features_name.length == 0) {
            debugp("==returning the most dominate feature", 0);
            let topTarget = this.mostCommon(targets);
            return {type: "result", val: topTarget, name: topTarget, alias: topTarget + this.randomTag()};
        }
        let bestFeatureData = this.maxGain(data, targets, l_features_id, l_features_name, featuresType);
        let best_id = bestFeatureData.feature_id;//feature_id is index in data file
        let best_name = bestFeatureData.feature_name;
        //console.log('bestFeatureData:',bestFeatureData);
        //console.log(featuresType[bestFeatureData.feature_name]);
        let remainingFeaturesId = _und.without(l_features_id, best_id);
        let remainingFeaturesName = _und.without(l_features_name, best_name);
        if (featuresType[best_name] === 'real') {
            node = {name: best_name, id: best_id, alias: best_name + this.randomTag()};
            node.type = "feature_real";
            node.cut = bestFeatureData.cut;
            node.vals = [];

            let _newS_r = this.filterByCutGreater(data, targets, bestFeatureData.cut, best_id);
            //printDataset(_newS_r,bestFeature, 'label','>'+bestFeatureData.cut);
            let child_node_r = {
                name: bestFeatureData.cut.toString(),
                alias: '>' + bestFeatureData.cut.toString() + this.randomTag(),
                type: "feature_value"
            };
            child_node_r.child = this._c45(_newS_r[0], _newS_r[1], remainingFeaturesId, remainingFeaturesName, featuresType, major_label);
            node.vals.push(child_node_r);

            let _newS_l = this.filterByCutLessEqual(data, targets, bestFeatureData.cut, best_id);
            //printDataset(_newS_l,bestFeature, 'label','<='+bestFeatureData.cut);
            let child_node_l = {
                name: bestFeatureData.cut.toString(),
                alias: '<=' + bestFeatureData.cut.toString() + this.randomTag(),
                type: "feature_value"
            };
            child_node_l.child = this._c45(_newS_l[0], _newS_l[1], remainingFeaturesId, remainingFeaturesName, featuresType, major_label);
            node.vals.push(child_node_l);

        } else { //default is text
            let possibleValues = _und.unique(this.getCol(data, best_id));
            node = {name: best_name, alias: best_name + this.randomTag()};
            node.type = "feature_category";
            node.vals = [];

            for (let i = 0; i < possibleValues.length; i++) {
                let _newS = this.filterByValue(data, targets, best_id, possibleValues[i]);
                let child_node = {
                    name: possibleValues[i],
                    alias: possibleValues[i] + this.randomTag(),
                    type: "feature_value"
                };
                child_node.child = this._c45(_newS[0], _newS[1], remainingFeaturesId, remainingFeaturesName, featuresType, major_label);
                node.vals.push(child_node);
            }
        }
        return node;
    }

    drawGraph(model, divId, cb) {
        if (typeof google === 'undefined') {
            cb('google visualization APIs are not defined');
            return;
        }
        let g = new Array();
        let colors = ['red', 'blue', 'green', 'yellow', 'black', 'fuchsia', 'gold', 'indigo', 'lime', 'mintcream', 'navy', 'olive', 'salmon', 'skyblue'];
        let h_color = {};
        g = this.addEdges(model.model, colors, h_color, g).reverse();
        window.g = g;
        let data = google.visualization.arrayToDataTable(g.concat(g));
        let chart = new google.visualization.OrgChart(document.getElementById(divId));
        google.visualization.events.addListener(chart, 'ready', function () {
            _und.each($('.google-visualization-orgchart-node'), function (x) {
                let oldVal = $(x).html();
                if (oldVal) {
                    let cleanVal = oldVal.replace(/_r[0-9]+/, '');
                    cleanVal = cleanVal.replace(/val:/, '<span style="color:olivedrab;">');
                    $(x).html(cleanVal);
                }
            });
        });
        chart.draw(data, {allowHtml: true});
        cb();
    }

    getCol(d, colIdx) {
        let col = [];
        for (let i = 0; i < d.length; i++) col.push(d[i][colIdx]);
        return col;
    }

    filterByCutLessEqual(d, targets, cut, col) {
        let nd = [];
        let nt = [];
        if (d.length != targets.length) {
            console.log('ERRROR: difft dimensions');
        }
        for (let i = 0; i < d.length; i++)
            if (parseFloat(d[i][col]) <= cut) {
                nd.push(d[i]);
                nt.push(targets[i]);
            }
        return [nd, nt];
    }

    filterByCutGreater(d, targets, cut, col) {
        let nd = [];
        let nt = [];
        if (d.length != targets.length) {
            console.log('ERRROR: difft dimensions');
        }
        for (let i = 0; i < d.length; i++)
            if (parseFloat(d[i][col]) > cut) {
                nd.push(d[i]);
                nt.push(targets[i]);
            }
        return [nd, nt];
    }

    //filter data, target at the same time
    filterByValue(d, t, featureIdx, val) {
        let nd = [];
        let nt = [];
        for (let i = 0; i < d.length; i++)
            if (d[i][featureIdx] === val) {
                nd.push(d[i]);
                nt.push(t[i]);
            }
        return [nd, nt];
    }

    //compute info gain for this feature. feature can be category or real type
    gain(data, targets, feature_id, featureName, featuresType) {
        if (data.length != targets.length) {
            console.log('ERRROR: difft dimensions');
        }
        let setEntropy = this.entropy(targets);
        //console.log('setEntropy:',setEntropy);
        let vals = _und.unique(this.getCol(data, feature_id));
        if (featuresType[featureName] === 'real') {
            let gainVals = [];
            for (let i = 0; i < vals.length; i++) {
                let cutf = parseFloat(vals[i]);
                let _gain = setEntropy - this.conditionalEntropy(data, targets, feature_id, cutf);
                gainVals.push({feature_id: feature_id, feature_name: featureName, gain: _gain, cut: cutf});
            }
            let _maxgain = _und.max(gainVals, function (e) {
                return e.gain
            });
            //debugp('real maxgain: '+_maxgain.cut+' '+_maxgain.gain,0);
            return _maxgain;
        } else {//default is text
            let setSize = data.length;
            let entropies = [];
            for (let i = 0; i < vals.length; i++) {
                let subset = this.filterByValue(data, targets, feature_id, vals[i]);
                entropies.push((subset[0].length / setSize) * this.entropy(subset[1]));
            }
            //console.log(featureName,' entropies:',entropies);
            let sumOfEntropies = _und(entropies).reduce(function (a, b) {
                return a + b
            }, 0);
            //console.log(featureName,' sumOfEntropies:',sumOfEntropies);
            return {feature_id: feature_id, feature_name: featureName, gain: setEntropy - sumOfEntropies, cut: 0};
        }
    }

    entropy(vals) {
        let that = this;
        let uniqueVals = _und.unique(vals);
        let probs = uniqueVals.map(function (x) {
            return that.prob(x, vals)
        });
        let logVals = probs.map(function (p) {
            return -p * that.log2(p)
        });
        return logVals.reduce(function (a, b) {
            return a + b
        }, 0);
    }

    //conditional entropy if data is split to two
    conditionalEntropy(_s, targets, feature_id, cut) {
        let subset1 = this.filterByCutLessEqual(_s, targets, cut, feature_id);
        let subset2 = this.filterByCutGreater(_s, targets, cut, feature_id);
        let setSize = _s.length;
        return subset1[0].length / setSize * this.entropy(subset1[1]) + subset2[0].length / setSize * this.entropy(subset1[1]);
    }

    maxGain(data, targets, l_features_id, l_features_name, featuresType) {
        let g45 = [];
        for (let i = 0; i < l_features_id.length; i++) {
            //console.log('maxgain feature:'+l_features_id[i]+' '+l_features_name[i]);
            g45.push(this.gain(data, targets, l_features_id[i], l_features_name[i], featuresType));
        }
        return _und.max(g45, function (e) {
            return e.gain;
        });
    }

    prob(val, vals) {
        let instances = _und.filter(vals, function (x) {
            return x === val
        }).length;
        let total = vals.length;
        return instances / total;
    }

    log2(n) {
        return Math.log(n) / Math.log(2);
    }

    mostCommon(l) {
        let that = this;
        return _und.sortBy(l, function (a) {
            return that.count(a, l);
        }).reverse()[1];
    }

    count(a, l) {
        return _und.filter(l, function (b) {
            return b === a
        }).length
    }

    randomTag() {
        return "_r" + Math.round(Math.random() * 1000000).toString();
    }

}

class Logistic {
    train(D, cb) {
        cb({
            that: this,
            thetas: this.optimize(D),
            classify: function (sample) {
                let max_p = this.that.compThetaXProduct(this.thetas[D.l_targets[0]], sample, D.nfeatures);
                let max_t = D.l_targets[0];
                for (let i = 1; i < D.ntargets; i++) {
                    let target = D.l_targets[i];
                    let p = this.that.compThetaXProduct(this.thetas[target], sample, D.nfeatures);
                    if (max_p < p) {
                        max_p = p;
                        max_t = target;
                    }
                }
                return max_t;
            },
            calcAccuracy: function (samples, targets, cb) {
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
            },
        }, undefined);
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
        for (let i = 0; i < D.iterations; i++) {
            if (D.optimizer === 'sgd')
                this.sgd_once(thetas, D.data, D.nfeatures, D.targets, D.l_targets, D.ntargets, D.learning_rate, D.l2_weight);
            else if (D.optimizer === 'gd')
                this.gd_batch(thetas, D.data, D.nfeatures, D.targets, D.l_targets, D.ntargets, D.learning_rate, D.l2_weight);
            else {
                console.log('unrecognized optimizer:' + D.optimizer);
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

module.exports = {Tree: Tree, Logistic: Logistic};