const JsDiff = require('diff');

/*
htmlToPassage takes in the raw html passage and returns
either the correct or incorrect version of the passage
*/
function htmlToPassage(raw, isCorrect) {
  convertedPassage = '';

  for (let i = 0; i < raw.length; i ++) {
    if(raw[i] != '{') {
      convertedPassage += raw[i];
    } else {
      let string = getString(raw.substring(i)).ans;
      convertedPassage += parseString(string, isCorrect);
      //change value of i to skip to the end of the parsed string
      i += getString(raw.substring(i)).charIndex;
    }
  }
  return convertedPassage;
}

/*
input: {+its-it's|3014} anyone on the trip....
output: {+its-it's|3014} and the index of the last string
*/
function getString(remainingString) {
  let ans = '';
  charIndex = 1;
  while (remainingString[charIndex] != '}' && charIndex < remainingString.length) {
    ans += remainingString[charIndex];
    charIndex++;
  }
  return {ans, charIndex};
}

function parseString(str, isCorrect) {
  if ((str.indexOf("+") || str.indexOf("-") || str.indexOf("{") || str.indexOf("}") || str.indexOf("|")) < 0)
    return str;

  str = str.replace(/^\s+|\s+$/g,'');
  return isCorrect ? str.match(/\+(.*)\-/).pop() : str.match(/\-(.*)\|/).pop();
}


function parseIndex(str) {
  if ((str.indexOf("+") || str.indexOf("-") || str.indexOf("{") || str.indexOf("}") || str.indexOf("|")) < 0)
    return str;
  return str.replace(/\|(.*)\}/).pop();
}


/*
Comparing Diffs:
returns an array of objects
where the objects are Words that differs from the expected sentences
*/
function getDiffWords(expected, actual) {
  let array = JsDiff.diffWords(expected, actual);
  var ans = [];
  for (var i = 0; i < array.length; i ++) {
    if (!(array[i].added === undefined && array[i].removed === undefined)) {
      //sentences with changes
      ans.push(array[i]);
    }
  }
  return ans;
}

/*
get the diff words btn user & wrong
get the diff word btn right & wrong
compare those two
output which ans is correc & wrong & unncessary
*/
function compareChangedWords(user, exp) {
  //inputs [user] and [exp] are arrays
  let userArray = [];
  let expArray = [];

  user.forEach(function(data) {
    userArray.push(JSON.stringify(data));
  })

  exp.forEach(function(data) {
    expArray.push(JSON.stringify(data));
  })

  let ans = JsDiff.diffArrays(userArray, expArray);
  let implementedChanges = []; //a pair of added and removed values
  let unimplementedChanges = [];
  let unnecessaryChanges = [];

  for (let i = 0; i < ans.length; i++) {
    if ((ans[i].added === undefined && ans[i].removed === true)) {
      let changes = ans[i].value;
        changes.forEach(function(change) {
        unnecessaryChanges.push(JSON.parse(change));
      })
    } else if ((ans[i].added === true && ans[i].removed === undefined)) {
      let changes = ans[i].value;
        changes.forEach(function(change) {
        unimplementedChanges.push(JSON.parse(change));
      })
    } else {
      let changes = ans[i].value;
        changes.forEach(function(change) {
        implementedChanges.push(JSON.parse(change));
      })
    }
  }//end for loop

  let pairArray = [];
  for (let i = 0; i < implementedChanges.length - 1; i++) {
    //make sure every 'removed' is followed by an 'added'
    if (implementedChanges[i].removed === true && implementedChanges[i+1].added === true) {
      let pair = {
                  'removed': implementedChanges[i].value,
                  'added': implementedChanges[i+1].value
                }
      pairArray.push(pair);
    }
  }


  let unimplementedArray = [];
  for (let i = 0; i < unimplementedChanges.length - 1; i++) {
    //make sure every 'removed' is followed by an 'added'
    if (unimplementedChanges[i].removed === true && unimplementedChanges[i+1].added === true) {
      let pair = {
                  'toRemove': unimplementedChanges[i].value,
                  'toAdd': unimplementedChanges[i+1].value
                }
      unimplementedArray.push(pair);
    }
  }
  return {
          'implemented_changes': pairArray,
          'unimplemented_changes': unimplementedArray,
          'unnecessary_changes': unnecessaryChanges
        }
}


module.exports = {
  htmlToPassage: htmlToPassage,
  getString: getString,
  parseString: parseString,
  getDiffWords: getDiffWords,
  compareChangedWords: compareChangedWords
}




/*
review student's passage & highlight the changes they made
*/
function reviewStudentInput(passage, changed){
  //go through each char in the passage and see if it matches
  //the value of the array
// JsDiff.diffLines(oldStr, newStr[, options])
  //since implemented_changes guarantees it comes in pairs
  // changed.implemented_changes.forEach(function(word) {
  //   console.log(word.value);
  // });n
  //
  // console.log("\nUNIMPLEMENTED");
  // changed.unimplemented_changes.forEach(function(word) {
  //   console.log(word.value);
  // });
}

//should is be: let's see what you got wrong,
//then what you got right
//or go chronologically?
//sequence is important for getDiffWords: wrong_sentence first then, right_sentence
let right_sentence = 'Amazingly, Shackleton did not lose anyone on the trip.';
let wrong_sentence = 'Amazingly, Shackleton did not loose anyone on the trip.';
let diff_expected = getDiffWords(wrong_sentence, right_sentence);

let user_input_wrong = 'Amazingly, Shackleton did not loose iiui anyone on the trip.'
let diff_actual = getDiffWords(wrong_sentence, user_input_wrong);

console.log(compareChangedWords(diff_actual, diff_expected));
