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

  describe('getDiffWords', function(){
    it('should returns an array', function(){
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
})
