const assert = require('assert');
const expect = require('expect');
const tools = require('../services.js');

describe('Parsing passages from JSON', function() {
  let passage = "Amazingly, Shackleton did not {+lose-loose|270} anyone on the trip.";
  let sentence_without_braces = "Amazingly, Shackleton did not lose anyone on the trip.";

  describe('#htmlToPassage(passage, true)', function() {
    it('should return the correct version of the passage', function() {
      expect(tools.htmlToPassage(passage, true)).toBe("Amazingly, Shackleton did not lose anyone on the trip.");
    });
  });

  describe('#htmlToPassage(passage, false)', function() {
    it('should return the wrong version of the passage', function() {
      expect(tools.htmlToPassage(passage, false)).toBe("Amazingly, Shackleton did not loose anyone on the trip.");
    });
  });

  describe('#htmlToPassage(passage without any instances of {+...-...|...}, boolean)', function() {
    it('should return the exact same passage without any changes', function() {
      expect(tools.htmlToPassage(sentence_without_braces, true)).toBe(sentence_without_braces);
    });
  });
});


describe('Get string to be edited', function(){
  let braces = '{+lose-loose|270} anyone on the trip';
  let no_braces = 'lose anyone on the trip';
  describe('#get sttring within braces', function(){
    it('should return the string after braces are stripped off', function() {
      expect(tools.getString(braces)).toInclude({ans: "+lose-loose|270"});
    });
  });

  describe('#get end of string', function(){
    it('should return the index where the braces end', function() {
      expect(tools.getString(braces)).toInclude({charIndex: braces.indexOf("}")});
      expect(tools.getString(braces).charIndex).toBeA('number');
    });
  })
});

describe('Retrieving right/wrong words from a string', function(){
  let dirty_string = '{+lose-loose|270}';
  let dirty_string_with_whitespace = '   {+lose-loose|270}    ';
  let invalid_input_array = ['lose','{lose-loose|270}','{lose-loose|270}','{lose-loose270}','lose-loose|270' ];

  describe('#get the right verson of string to be edited', function(){
    it('should be \'lose\'', function(){
      expect(tools.parseString(dirty_string, true)).toBe('lose');
      expect(tools.parseString(dirty_string_with_whitespace, true)).toBe('lose');
    });
  });

  describe('#get the wrong verson of string to be edited', function(){
    it('should be \'loose\'', function(){
      expect(tools.parseString(dirty_string, true)).toBe('lose');
      expect(tools.parseString(dirty_string_with_whitespace, true)).toBe('lose');
    });
  });

  describe('#testing on a string without either braces, or +, or -', function(){
    it('output string should be same as input string', function(){
      invalid_input_array.forEach(function(string){
        expect(tools.parseString(string, true)).toBe(string);
        expect(tools.parseString(string, false)).toBe(string);
      })
    });
  });
})

describe('testing getDiff', function() {
  let ideal_sentence = 'This is a cat.';
  let actual_sentence = 'This is not a cat.';

  describe('getDiffWords(str1, str2)', function(){
    it('should return an array', function(){
      expect(tools.getDiffWords(ideal_sentence, actual_sentence)).toBeAn('array');
    });
  })

  describe('array that is returned by getDiffWords', function(){
    it('should contain word objects that differ from the expected sentences (whitespace sensitive)', function() {
      expect(tools.getDiffWords(ideal_sentence, actual_sentence)[0]).toBeAn('object');
      expect(tools.getDiffWords(ideal_sentence, actual_sentence)[0]).toInclude({value: 'not '});
      expect(tools.getDiffWords(ideal_sentence, actual_sentence)[0]).toInclude({added: true});
    });
  })

  describe('when comparing two same sentences', function(){
    it('should return an empty array', function() {
      expect(tools.getDiffWords(ideal_sentence, ideal_sentence)).toBeAn('array');
      expect(tools.getDiffWords(ideal_sentence, ideal_sentence).length).toBe(0);
    });
  })
})

describe('testing compareChangedWords >>', function() {
  let right_sentence = 'This is a cat.';
  let wrong_sentence = 'This are an cat.';

  let user_input_wrong_all = 'This are an cat.';
  let user_input_wrong_some = 'This are a cat.';

  let user_input_less = 'This an cat.';
  let user_input_more = 'This are an black cat.';

  let diff_user_wrong_all = tools.getDiffWords(user_input_wrong_all, wrong_sentence);
  let diff_user_wrong_some = tools.getDiffWords(user_input_wrong_some, wrong_sentence);

  let diff_user_less = tools.getDiffWords(user_input_less, wrong_sentence);
  let diff_user_more = tools.getDiffWords(user_input_more, wrong_sentence);
  let diff_expected = tools.getDiffWords(right_sentence, wrong_sentence);

  describe('compareChangedWords', function(){
    it('should return an object', function(){
      expect(tools.compareChangedWords(diff_user_wrong_all, diff_expected)).toBeAn('object');
    });

    it('should have three keys', function(){
      expect(tools.compareChangedWords(diff_user_wrong_all, diff_expected))
            .toIncludeKeys(['implemented_changes', 'unimplemented_changes', 'unnecessary_changes']);
    });
  })


  describe('when user removes or adds words from sentences, w/o changing other words', function(){
    it('should return an object with more than 0 unnecessary_changes', function(){
      expect(tools.compareChangedWords(diff_user_less, diff_expected)
        .unnecessary_changes.length).toBeGreaterThan(0);
      expect(tools.compareChangedWords(diff_user_more, diff_expected)
        .unnecessary_changes.length).toBeGreaterThan(0);
    });

    it('should return an object with no implemented_changes', function(){
      expect(tools.compareChangedWords(diff_user_less, diff_expected)
        .implemented_changes.length).toBe(0);
      expect(tools.compareChangedWords(diff_user_more, diff_expected)
        .implemented_changes.length).toBe(0);
    });

    it('should return an object with more than 0 unimplemented_changes', function(){
      expect(tools.compareChangedWords(diff_user_less, diff_expected)
        .unimplemented_changes.length).toBeGreaterThan(0);
      expect(tools.compareChangedWords(diff_user_more, diff_expected)
        .unimplemented_changes.length).toBeGreaterThan(0);
    });
  })

  describe('when user adds words from sentences, with all changes made', function(){
    let sentence_more = 'This is a black cat.';
    let diff_more = tools.getDiffWords(sentence_more, wrong_sentence);

    it('should return an object with more than 0 unnecessary_changes', function(){
      expect(tools.compareChangedWords(diff_more, diff_expected)
        .unnecessary_changes.length).toBeGreaterThan(0);
    });

    it('should return an object with more than 0 implemented_changes', function(){
      expect(tools.compareChangedWords(diff_more, diff_expected)
        .implemented_changes.length).toBeGreaterThan(0);
    });

    it('should return an object with 0 unimplemented_changes', function(){
      expect(tools.compareChangedWords(diff_more, diff_expected)
        .unimplemented_changes.length).toBe(0);
    });
  })

  describe('when user removes words from sentences, with all necessary changes made', function(){
    //note: cannot remove a word that needs to be edited
    let sentence_less = 'This is a.'; //vs. This are an cat.
    let diff_less = tools.getDiffWords(sentence_less, wrong_sentence);

    console.log(diff_less);

    it('should return an object with more than 0 unnecessary_changes', function(){
      expect(tools.compareChangedWords(diff_less, diff_expected)
        .unnecessary_changes.length).toBeGreaterThan(0);
    });

    it('should return an object with more than 0 implemented_changes', function(){
      expect(tools.compareChangedWords(diff_less, diff_expected)
        .implemented_changes.length).toBeGreaterThan(0);
    });

    it('should return an odd number of implemented_changes', function(){
      expect(tools.compareChangedWords(diff_less, diff_expected)
        .implemented_changes.length % 2).toBe(1);
    });
  })

  describe('when user makes some right changes', function(){
    it('should return an object with more than 0 implemented_changes', function(){
      expect(tools.compareChangedWords(diff_user_wrong_some, diff_expected)
        .implemented_changes.length).toBeGreaterThan(0);
    });

    it('should return an object with more than 0 unimplemented_changes', function(){
      expect(tools.compareChangedWords(diff_user_wrong_some, diff_expected)
        .unimplemented_changes.length).toBeGreaterThan(0);
    });
  })
})
