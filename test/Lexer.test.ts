import * as assert from 'assert'
import { char } from 'parser-ts/lib/char'
import { success } from 'parser-ts/lib/ParseResult'
import { stream } from 'parser-ts/lib/Stream'

import * as L from '../src/Lexer'
import { run } from './helpers'

describe('Lexer', () => {
  describe('unicodeBOM', () => {
    it('should parse the Unicode Byte Order Mark', () => {
      assert.deepStrictEqual(run(L.unicodeBOM, '\ufeff'), success('\ufeff', stream(['\ufeff'], 1), stream(['\ufeff'])))
    })
  })

  describe('string', () => {
    it('should parse an empty string', () => {
      const a = '""'
      assert.deepStrictEqual(run(L.string, a), success('', stream(a.split(''), 2), stream(a.split(''))))
    })

    it('should parse a simple string', () => {
      const a = '"simple"'
      assert.deepStrictEqual(run(L.string, a), success('simple', stream(a.split(''), 8), stream(a.split(''))))
    })

    it('should parse a string with whitespace', () => {
      const a = '" white space "'
      assert.deepStrictEqual(run(L.string, a), success(' white space ', stream(a.split(''), 15), stream(a.split(''))))
    })

    it('should parse a string containing a quote', () => {
      const a = '"quote \\""'
      assert.deepStrictEqual(run(L.string, a), success('quote "', stream(a.split(''), 10), stream(a.split(''))))
    })

    it('should parse a string containing escaped characters', () => {
      const a = '"escaped \\n\\r\\b\\t\\f"'
      assert.deepStrictEqual(
        run(L.string, a),
        success('escaped \n\r\b\t\f', stream(a.split(''), 20), stream(a.split('')))
      )
    })

    it('should parse a string containing slashes', () => {
      const a = '"slashes \\\\ \\/"'
      assert.deepStrictEqual(run(L.string, a), success('slashes \\ /', stream(a.split(''), 15), stream(a.split(''))))
    })

    it('should parse a string containing Unicode', () => {
      const a = '"unicode \\u1234\\u5678\\u90AB\\uCDEF"'
      assert.deepStrictEqual(
        run(L.string, a),
        success('unicode \u1234\u5678\u90AB\uCDEF', stream(a.split(''), 34), stream(a.split('')))
      )
    })
  })

  describe('blockString', () => {
    it('should parse an empty block string', () => {
      const a = '""""""'
      assert.deepStrictEqual(run(L.blockString, a), success('', stream(a.split(''), 6), stream(a.split(''))))
    })
    it('should parse a simple block string', () => {
      const a = '"""simple"""'
      assert.deepStrictEqual(run(L.blockString, a), success('simple', stream(a.split(''), 12), stream(a.split(''))))
    })

    it('should parse a block string with whitespace', () => {
      const a = '""" white space """'
      assert.deepStrictEqual(
        run(L.blockString, a),
        success(' white space ', stream(a.split(''), 19), stream(a.split('')))
      )
    })

    it('should parse a block string containing a quote', () => {
      const a = '"""contains " quote"""'
      assert.deepStrictEqual(
        run(L.blockString, a),
        success('contains " quote', stream(a.split(''), 22), stream(a.split('')))
      )
    })

    it('should parse a block string containing an escaped triple quote', () => {
      const a = '"""contains \\""" triple quote"""'
      assert.deepStrictEqual(
        run(L.blockString, a),
        success('contains """ triple quote', stream(a.split(''), 32), stream(a.split('')))
      )
    })

    it('should parse a block string containing multiple lines', () => {
      const a = '"""multi\nline"""'
      assert.deepStrictEqual(
        run(L.blockString, a),
        success('multi\nline', stream(a.split(''), 16), stream(a.split('')))
      )
    })

    it('should parse and normalize a block string containing multiple lines', () => {
      const a = '"""multi\rline\r\nnormalized"""'
      assert.deepStrictEqual(
        run(L.blockString, a),
        success('multi\nline\nnormalized', stream(a.split(''), 28), stream(a.split('')))
      )
    })

    it('should parse a block string containing unescaped characters', () => {
      const a = '"""unescaped \\n\\r\\b\\t\\f\\u1234"""'
      assert.deepStrictEqual(
        run(L.blockString, a),
        success('unescaped \\n\\r\\b\\t\\f\\u1234', stream(a.split(''), 32), stream(a.split('')))
      )
    })

    it('should parse a block string containing slashes', () => {
      const a = '"""slashes \\\\ \\/"""'
      assert.deepStrictEqual(
        run(L.blockString, a),
        success('slashes \\\\ \\/', stream(a.split(''), 19), stream(a.split('')))
      )
    })

    it('should parse a block string that spans multiple lines', () => {
      const a = `"""

      spans
        multiple
          lines

"""`
      assert.deepStrictEqual(
        run(L.blockString, a),
        success('spans\n  multiple\n    lines', stream(a.split(''), 54), stream(a.split('')))
      )
    })
  })

  describe('intValue', () => {
    it('should parse an integer', () => {
      assert.deepStrictEqual(run(L.intValue, '0'), success('0', stream(['0'], 1), stream(['0'])))
      assert.deepStrictEqual(run(L.intValue, '4'), success('4', stream(['4'], 1), stream(['4'])))
      assert.deepStrictEqual(run(L.intValue, '9'), success('9', stream(['9'], 1), stream(['9'])))
    })

    it('should parse a signed integer', () => {
      assert.deepStrictEqual(run(L.intValue, '-1'), success('-1', stream(['-', '1'], 2), stream(['-', '1'])))
      assert.deepStrictEqual(run(L.intValue, '-4'), success('-4', stream(['-', '4'], 2), stream(['-', '4'])))
      assert.deepStrictEqual(run(L.intValue, '-9'), success('-9', stream(['-', '9'], 2), stream(['-', '9'])))
    })
  })

  describe('floatValue', () => {
    it('should parse a floating point number', () => {
      const a = '0.123'
      const b = '4.123'
      assert.deepStrictEqual(run(L.floatValue, a), success(a, stream(a.split(''), 5), stream(a.split(''))))
      assert.deepStrictEqual(run(L.floatValue, b), success(b, stream(b.split(''), 5), stream(b.split(''))))
    })

    it('should parse a signed floating point number', () => {
      const a = '-0.123'
      const b = '-4.123'
      assert.deepStrictEqual(run(L.floatValue, a), success(a, stream(a.split(''), 6), stream(a.split(''))))
      assert.deepStrictEqual(run(L.floatValue, b), success(b, stream(b.split(''), 6), stream(b.split(''))))
    })

    it('should parse a floating point number in scientific notation', () => {
      const a = '123e4'
      const b = '123E4'
      assert.deepStrictEqual(run(L.floatValue, a), success(a, stream(a.split(''), 5), stream(a.split(''))))
      assert.deepStrictEqual(run(L.floatValue, b), success(b, stream(b.split(''), 5), stream(b.split(''))))
    })

    it('should parse a floating point number in scientific notation with a signed exponent', () => {
      const a = '123e-4'
      const b = '123e+4'
      assert.deepStrictEqual(run(L.floatValue, a), success(a, stream(a.split(''), 6), stream(a.split(''))))
      assert.deepStrictEqual(run(L.floatValue, b), success(b, stream(b.split(''), 6), stream(b.split(''))))
    })

    it('should parse a signed floating point number in scientific notation', () => {
      const a = '-1.123e4'
      const b = '-1.123E4'
      const c = '-1.123e4567'
      assert.deepStrictEqual(run(L.floatValue, a), success(a, stream(a.split(''), 8), stream(a.split(''))))
      assert.deepStrictEqual(run(L.floatValue, b), success(b, stream(b.split(''), 8), stream(b.split(''))))
      assert.deepStrictEqual(run(L.floatValue, c), success(c, stream(c.split(''), 11), stream(c.split(''))))
    })

    it('should parse a signed floating point number in scientific notation with a signed exponent', () => {
      const a = '-1.123e-4'
      const b = '-1.123e+4'
      assert.deepStrictEqual(run(L.floatValue, a), success(a, stream(a.split(''), 9), stream(a.split(''))))
      assert.deepStrictEqual(run(L.floatValue, b), success(b, stream(b.split(''), 9), stream(b.split(''))))
    })
  })

  describe('name', () => {
    it('should parse a name', () => {
      const a = 'foo'
      assert.deepStrictEqual(run(L.name, a), success(a, stream(a.split(''), 3), stream(a.split(''))))
    })

    it('should parse a name with a leading underscore', () => {
      const a = '_foo'
      assert.deepStrictEqual(run(L.name, a), success(a, stream(a.split(''), 4), stream(a.split(''))))
    })

    it('should parse a name ignoring whitespace and comments', () => {
      const a = 'foo#comment'
      assert.deepStrictEqual(run(L.name, a), success('foo', stream(a.split(''), 11), stream(a.split(''))))
    })
  })

  describe('punctuation', () => {
    it('should parse a bang character', () => {
      const a = '!'
      assert.deepStrictEqual(run(L.bang, a), success(a, stream(a.split(''), 1), stream(a.split(''))))
    })

    it('should parse a dollar sign character', () => {
      const a = '$'
      assert.deepStrictEqual(run(L.dollar, a), success(a, stream(a.split(''), 1), stream(a.split(''))))
    })

    it('should parse a bar character', () => {
      const a = '|'
      assert.deepStrictEqual(run(L.bar, a), success(a, stream(a.split(''), 1), stream(a.split(''))))
    })

    it('should parse a colon character', () => {
      const a = ':'
      assert.deepStrictEqual(run(L.colon, a), success(a, stream(a.split(''), 1), stream(a.split(''))))
    })

    it('should parse an equals sign', () => {
      const a = '='
      assert.deepStrictEqual(run(L.equals, a), success(a, stream(a.split(''), 1), stream(a.split(''))))
    })

    it('should parse an at character', () => {
      const a = '@'
      assert.deepStrictEqual(run(L.at, a), success(a, stream(a.split(''), 1), stream(a.split(''))))
    })

    it('should parse a spread operator', () => {
      const a = '...'
      assert.deepStrictEqual(run(L.spread, a), success(a, stream(a.split(''), 3), stream(a.split(''))))
    })

    it('should parse a character between parentheses', () => {
      const a = '(a)'
      assert.deepStrictEqual(run(L.parens(char('a')), a), success('a', stream(a.split(''), 3), stream(a.split(''))))
    })

    it('should parse a character between brackets', () => {
      const a = '[a]'
      assert.deepStrictEqual(run(L.brackets(char('a')), a), success('a', stream(a.split(''), 3), stream(a.split(''))))
    })

    it('should parse a character between braces', () => {
      const a = '{a}'
      assert.deepStrictEqual(run(L.braces(char('a')), a), success('a', stream(a.split(''), 3), stream(a.split(''))))
    })
  })
})
