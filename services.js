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

  //weird cases: {+Plantations.-plantations. / Plantations.|508}
  //have to remove /Plantations.
  if (str.indexOf('/') > -1) {
    let toRemove = "/ " + str.match(/\+(.*)\-/)[1];
    str = str.replace(toRemove, '');
  }

  //removing whitespace... necessary?
  // str = str.replace(/^\s+|\s+$/g,'');
  //if + comes before -
  if (str.indexOf('+') < str.indexOf('-')){
    value = isCorrect ? str.match(/\+(.*)\-/).pop() : str.match(/\-(.*)\|/).pop();
  } else {
    //if - comes before +
    value = isCorrect ? str.match(/\-(.*)\+/).pop() : str.match(/\+(.*)\|/).pop();
  }

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
                  'concept': - parseInt(wordToConceptCode[unimplementedChanges[i].value])
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

function groupSameConceptWord(sentence){
  const THRESHOLD = 10; //max 5 words apart between first and last word

  let correct = htmlToPassage(sentence, true);
  let wrong = htmlToPassage(sentence, false);
  let diff_expected = getDiffWords(correct, wrong);
  let diff_actual = getDiffWords(correct, wrong);

  let group = [];
  diff_actual.forEach(diff => {
    if (diff.removed === true) {
      //word: index ?  correct.search(word) // also rmb to add concept code ~~ !!
      group.push(diff.value);
    }
  })

  let maxCount = 0;
  let mergedWords = [];
  for (let i = 0; i < group.length ; i++) {
    const currentWordIndex = correct.search(group[i]);

    for (let remaining = i + 1; remaining < group.length; remaining++) {
      const nextWordIndex = correct.search(group[remaining]);
      //how many spaces between those words?
      const newSentence = correct.substring(currentWordIndex, nextWordIndex + group[remaining].length);
      const whitespaceCount = newSentence.split(" ").length - 1;

      if (whitespaceCount > THRESHOLD) {
        break;
      }

      if (whitespaceCount <= THRESHOLD && whitespaceCount > maxCount) {
        maxCount = whitespaceCount;
        mergedWords = newSentence;
      }
    }
  }
  console.log(mergedWords);
  return mergedWords;
}

let passage = "Inauguration Day is a celebration that marks the beginning of a president’s four-year term. <br/><br/>\n\nWhen the American Revolution ended in 1783, the Articles of Confederation were implemented to keep the thirteen states together. After winning independence from Great {+Britain,-Britain|3062} the states were suspicious of a powerful government. Yet, at the same time, it was clear that the Articles had failed to {+properly-proper|432} keep the thirteen states together and regulate taxation throughout the states. <br/><br/>\n \nFifty-five delegates attended the May 1787 Constitutional Convention in Philadelphia to revise the Articles and {+strengthen-strengthened|2032} the federal government. There were lengthy debates about how to revise the Articles, but many agreed it would be best to create {+an-a|3024} entirely new Constitution. Initially, many states {+felt-feel|477} this gave too much power to the federal government and they refused to ratify the Constitution. Although it took many months to ratify the Constitution, in the end, all thirteen colonies realized the importance of remaining unified. <br/><br/>\n \nGeorge Washington was the obvious choice for the first president of the {+United States of America.-united states of america.|508} He is the only president who was unanimously elected by all of the state representatives. Washington was sworn in on {+April 30, 1789-April 30 1789|509} as the first President. Washington chose to leave office after only two terms since he thought it was important for the United States to have a president rather {+than-then|272} a king. <br/><br/>";
let sentence = "The Military Academy in {+West Point,-west point,|508} NY, the";
let sentence2 = "first president of the {+United States of America.-united states of america.|508} He";
let sentence3 = "they sound; they are paintings of a piece {+of land.-of lands.|3119} The land";

groupSameConceptWord(sentence);
groupSameConceptWord(sentence2);
// student_input = htmlToPassage(passage, true);
// const obj = compareBySentences(stuldent_input, passage);
// for (var key in obj) {
//   console.log("sentence #" + key);
//   console.log(obj[key].implemented_changes);
//   console.log(obj[key].unimplemented_changes);
//   console.log(obj[key].unncessary_changes);
//   console.log("\n\n")
// }



// function compare(user, rawHTML) {
//   let correct = htmlToPassage(rawHTML, true);
//   let wrong = htmlToPassage(rawHTML, false);
//   let diff_expected = getDiffWords(correct, wrong);
//   let diff_actual = getDiffWords(user, wrong);
//   return compareChangedWords(diff_actual, diff_expected);
// }
