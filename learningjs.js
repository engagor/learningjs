////////////////////////////////////////////////////////////////////////////////////////////////
// javascript implementation of 
//   decision tree
//   logistic regression
//
// author: yandong liu
//  email: yandongl _at_ cs.cmu.edu
////////////////////////////////////////////////////////////////////////////////////////////////

const Tree = require('./tree.js');
const Logistic = require('./logistic.js');
const DataUtil = require('./dataUtil.js');
const TreeModel = require('./treeModel.js');
const LogisticModel = require('./logisticModel.js');

module.exports = {
    Tree: Tree,
    Logistic: Logistic,
    DataUtil: DataUtil,
    TreeModel: TreeModel,
    LogisticModel: LogisticModel
};