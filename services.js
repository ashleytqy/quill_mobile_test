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
  let implementedChanges = [];
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

  return {
          'implemented_changes': implementedChanges,
          'unimplemented_changes': unimplementedChanges,
          'unncessary_changes': unnecessaryChanges
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
Tests
*/
//note: changes in whitespace doesn't make a difference! which is cool.
var originalHTML = "In 1914, Ernest Shackleton set {+off-of|3015} on an exploration across the {+Antarctic.-antarctic.|508} In 1915, his ship, Endurance, became trapped in the ice, and {+its-it's|3014} crew was stuck. Ten months later, {+their-there|3017} ship sank, and {+Shackleton's-Shackletons|412} crew was forced to live on {+an-a|3024} iceberg. They reached Elephant Island in {+April-april|6} of 1916 using three lifeboats.\n<br/><br/>\nShackleton promised to {+find-found|419} help. In a small boat with five crew members, he spent 16 days crossing 800 miles of ocean. The remaining men were {+then-than|3016} rescued {+in-on|365} August of 1916. Amazingly, Shackleton did not {+lose-loose|270} anyone on the trip.";
var HTMLwError = "Shackleton set on an exploration across the {+Antarctic.-antarctic.|508} In    1915,           his ship, Endurance, became trapped in the ice, and {+its-it's|3014} crew was stuck. Ten months later, {+their-there|3017} ship sank, and {+Shackleton's-Shackletons|412} crew was forced to live on {+an-a|3024} iceberg. They reached Elephant Island in {+April-april|6} of 1916 using three lifeboats.\n<br/><br/>\nShackleton promised to {+find-found|419} help. In a small boat with five crew members, he spent 16 days crossing 800 miles of ocean. The remaining men were {+then-than|3016} rescued {+in-on|365} August of 1916. Amazingly, Shackleton did not {+lose-loose|270} anyone on the trip.";
var fakeUser = htmlToPassage(HTMLwError, true);
var rightP = htmlToPassage(originalHTML, true);
var wrongP = htmlToPassage(originalHTML, false);

fakeUserWords = getDiffWords(fakeUser, wrongP);
expectedDiff = getDiffWords(rightP, wrongP);

var changed = compareChangedWords(fakeUserWords, expectedDiff);
// changed.implemented_changes.forEach(function(word) {
//   console.log(word.value);
// })

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
  // });
  //
  // console.log("\nUNIMPLEMENTED");
  // changed.unimplemented_changes.forEach(function(word) {
  //   console.log(word.value);
  // });
}

//should is be: let's see what you got wrong,
//then what you got right
//or go chronologically?
