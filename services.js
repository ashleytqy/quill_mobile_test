const JsDiff = require('diff');
const wordToConceptCode = {};

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
      let string = getSpecialString(raw.substring(i)).specialString;
      convertedPassage += parseString(string, isCorrect).value;
      //change value of i to skip to the end of the parsed string
      i += getSpecialString(raw.substring(i)).charIndex;
    }
  }
  return convertedPassage;
}

/*
getSpecialString takes in a string and returns an object
with the the specialString {+add-remove|508}
and the lastIndex of the specialString
*/
function getSpecialString(remainingString) {
  let specialString = '';
  charIndex = 1;
  while (remainingString[charIndex] != '}' && charIndex < remainingString.length) {
    specialString += remainingString[charIndex];
    charIndex++;
  }
  return {specialString, charIndex};
}

/*
parseString takes in a specialString
and returns the right / wrong version of the string
as well as the concept code
*/
function parseString(str, isCorrect) {
  if ((str.indexOf("+") || str.indexOf("-") || str.indexOf("{") || str.indexOf("}") || str.indexOf("|")) < 0) {
    return {"value": str, "code": null};
  }

  str = str.replace(/^\s+|\s+$/g,'');
  value = isCorrect ? str.match(/\+(.*)\-/).pop() : str.match(/\-(.*)\|/).pop();

  let code = str.match(/\|(.*)/)[1];
  storeConceptCode(str, code);
  return {"value": value, "code": code};
}

/*
Maps and stores the right word to the concept code
*/
function storeConceptCode(word, code){
  word = word.match(/\+(.*)\-/).pop();
  //if the last character is not a letter
  //ie, if the word ends in . , ? !
  //remove that character, because JSDiff does not take them into consideration
  if (!((65 <= word.charCodeAt(word.length - 1)) && (65 <= word.charCodeAt(word.length - 1)) <= 90)) {
    word = word.substr(0, word.length - 1);
  }
  wordToConceptCode[word] = code;
};

/*
passageToSentences takes in a passage
and returns and object with sentence numbers as keys
and the sentences themselves as values
*/
function passageToSentences(passage) {
  let sentences = passage.split('.');
  let indexedSentences  = {};
  for (let i = 0; i < sentences.length; i++) {
    if (sentences[i].length > 0) {
      indexedSentences[i] = sentences[i] + ".";
    }
  }
  return indexedSentences;
}


/*
getDiffWords takes in two sentences and
returns and an array of changedObjects
i.e. words that are changed from the original sentences
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
compareChangedWords takes in two arrays of changedObjects
and compares them to determine which words are
correctly or wrongly implemented, or unncessary
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
        change = JSON.parse(change);
        delete change["count"];
        unnecessaryChanges.push(change);
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

  let implementedArray = [];
  for (let i = 0; i < implementedChanges.length - 1; i++) {
    //make sure every 'removed' is followed by an 'added'
    if (implementedChanges[i].removed === true && implementedChanges[i+1].added === true) {
      let pair = {
                  'removed': implementedChanges[i].value,
                  'added': implementedChanges[i+1].value,
                  'concept': parseInt(wordToConceptCode[implementedChanges[i].value])
                }
      implementedArray.push(pair);
    }
  }


  let unimplementedArray = [];
  for (let i = 0; i < unimplementedChanges.length - 1; i++) {
    //make sure every 'removed' is followed by an 'added'
    if (unimplementedChanges[i].removed === true && unimplementedChanges[i+1].added === true) {
      let pair = {
                  'to_remove': unimplementedChanges[i].value,
                  'to_add': unimplementedChanges[i+1].value,
                  'concept': parseInt(wordToConceptCode[unimplementedChanges[i].value])
                }
      unimplementedArray.push(pair);
    }
  }
  return {
          'implemented_changes': implementedArray,
          'unimplemented_changes': unimplementedArray,
          'unnecessary_changes': unnecessaryChanges
        }
}

/*
compareBySentences takes in userInput and rawHTML (with specialStrings)
and returns the changes made by the userInput
*/
function compareBySentences(student, rawHTML) {
  let correct = htmlToPassage(rawHTML, true);
  let wrong = htmlToPassage(rawHTML, false);
  correct = passageToSentences(correct);
  wrong = passageToSentences(wrong);
  user = passageToSentences(student);

  let changes = {};
  for (let i in correct) {
    let diff_expected = getDiffWords(correct[i], wrong[i]);
    let diff_actual = getDiffWords(user[i], wrong[i]);
    changes[i] = compareChangedWords(diff_actual, diff_expected);
  }
  return changes;
}

module.exports = {
  htmlToPassage: htmlToPassage,
  getSpecialString: getSpecialString,
  parseString: parseString,
  getDiffWords: getDiffWords,
  compareChangedWords: compareChangedWords
}



let right_sentence = 'Amazingly, Shackleton did not lose anyone on the trip.';
let wrong_sentence = 'Amazingly, Shackleton did not loose anyone on the trips.';
let diff_expected = getDiffWords(wrong_sentence, right_sentence);

let user_input_wrong = 'Amazingly, Shackleton not lose EXTRA_WORD anyone on the trips.'
let diff_actual = getDiffWords(wrong_sentence, user_input_wrong);

let passage = "In 1914, Ernest Shackleton set {+off-of|3015}\
          on an exploration across the {+Antarctic.-antarctic.|508} In 1915, his ship,\
          Endurance, became trapped in the ice, and {+its-it's|3014} crew was stuck. Ten\
          months later, {+their-there|3017} ship sank, and {+Shackleton's-Shackletons|412}\
          crew was forced to live on {+an-a|3024} iceberg. They reached Elephant Island in\
          {+April-april|6} of 1916 using three lifeboats.\n<br/><br/>\nShackleton promised\
          to {+find-found|419} help. In a small boat with five crew members, he spent 16\
          days crossing 800 miles of ocean. The remaining men were {+then-than|3016}\
          rescued {+in-on|365} August of 1916. Amazingly, Shackleton did not\
          {+lose-loose|270} anyone on the trip.";

student_input = htmlToPassage(passage, false);
console.log(compareBySentences(student_input, passage));



// function compare(user, rawHTML) {
//   let correct = htmlToPassage(rawHTML, true);
//   let wrong = htmlToPassage(rawHTML, false);
//   let diff_expected = getDiffWords(correct, wrong);
//   let diff_actual = getDiffWords(user, wrong);
//   return compareChangedWords(diff_actual, diff_expected);
// }
