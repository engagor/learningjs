//////////////////////////////////////////////////////////////////
/// sample code using decision tree for classification
//  some datasets can be found at
//    https://archive.ics.uci.edu/ml/datasets.html
//
//  you have to manually add the header(features) to each data file
//////////////////////////////////////////////////////////////////
'use strict';

let learningjs = require('./learningjs.js');
let DataUtil = require("./dataUtil.js");

if(process.argv.length<4) {
  console.log('usage: %s %s training_file test_file', process.argv[0], process.argv[1]);
  process.exit(0);
}
let fn = process.argv[2];
let fn_test = process.argv[3];

console.log('=== TRAIN:%s ===', fn);
console.log('=== TEST:%s ===', fn_test);

DataUtil.loadTextFile(fn, function(D) {

  //decision tree deals with both numeric/categorical features
  //but you have to specify its type individually in 2nd line of the file

  let start = process.hrtime();
  new learningjs.Tree().train(D, function(model, err){
    if(err) {
      console.log(err);
    } else {
      //console.log('model:',model);
      let elapsed = process.hrtime(start)[1] / 1000000;
      console.log('training took ' + process.hrtime(start)[0] + " s, " + elapsed.toFixed(2) + " ms.");
      model.calcAccuracy(D.data, D.nTargets, function(acc, correct, total){
        console.log('training: got '+correct +' correct out of '+total+' examples. accuracy:'+(acc*100.0).toFixed(2)+'%');
      });
      DataUtil.loadTextFile(fn_test, function(T) {
        model.calcAccuracy(T.data, T.nTargets, function(acc, correct, total){
          console.log('    test: got '+correct +' correct out of '+total+' examples. accuracy:'+(acc*100.0).toFixed(2)+'%');
        });
      });
    }
  });
});
