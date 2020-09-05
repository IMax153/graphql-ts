import * as assert from 'assert'
import * as O from 'fp-ts/lib/Option'
import * as RA from 'fp-ts/lib/ReadonlyArray'
import { pipe } from 'fp-ts/lib/function'

import * as D from '../../../src/Language/AST/Document'
import * as E from '../../../src/Language/AST/Encoder'

describe('Encoder', () => {
  describe('value', () => {
    describe('null value', () => {
      it('minified', () => {
        const a = pipe(E.minified, E.value(D.Null))
        assert.strictEqual(a, 'null')
      })

      it('pretty', () => {
        const a = pipe(E.pretty, E.value(D.Null))
        assert.strictEqual(a, 'null')
      })
    })

    describe('minified', () => {
      it('escapes \\', () => {
        const a = pipe(E.minified, E.value(D.Str('\\')))
        assert.strictEqual(a, '"\\\\"')
      })

      it('escapes double quotes', () => {
        const a = pipe(E.minified, E.value(D.Str('"')))
        assert.strictEqual(a, '"\\""')
      })

      it('escapes \\f', () => {
        const a = pipe(E.minified, E.value(D.Str('\f')))
        assert.strictEqual(a, '"\\f"')
      })

      it('escapes \\n', () => {
        const a = pipe(E.minified, E.value(D.Str('\n')))
        assert.strictEqual(a, '"\\n"')
      })

      it('escapes \\r', () => {
        const a = pipe(E.minified, E.value(D.Str('\r')))
        assert.strictEqual(a, '"\\r"')
      })

      it('escapes \\t', () => {
        const a = pipe(E.minified, E.value(D.Str('\t')))
        assert.strictEqual(a, '"\\t"')
      })

      it('escapes backspace', () => {
        const a = pipe(E.minified, E.value(D.Str('a\bc')))
        assert.strictEqual(a, '"a\\bc"')
      })

      it('escapes Unicode for characters less than 0010', () => {
        const a = pipe(E.minified, E.value(D.Str('\u0000')))
        const b = pipe(E.minified, E.value(D.Str('\u0007')))
        assert.strictEqual(a, '"\\u0000"')
        assert.strictEqual(b, '"\\u0007"')
      })

      it('escapes Unicode for characters less than 0020', () => {
        const a = pipe(E.minified, E.value(D.Str('\u0010')))
        const b = pipe(E.minified, E.value(D.Str('\u0019')))
        assert.strictEqual(a, '"\\u0010"')
        assert.strictEqual(b, '"\\u0019"')
      })

      it('encodes without escape', () => {
        const a = pipe(E.minified, E.value(D.Str('\u0020')))
        const b = pipe(E.minified, E.value(D.Str('\u007e')))
        assert.strictEqual(a, '" "')
        assert.strictEqual(b, '"~"')
      })
    })

    describe('pretty', () => {
      it('encodes with strings for short string values', () => {
        const a = pipe(E.pretty, E.value(D.Str('Short text')))
        assert.strictEqual(a, '"Short text"')
      })

      it('encodes with block strings for text with new lines - newline symbol', () => {
        const a = pipe(E.pretty, E.value(D.Str('Line 1\nLine 2')))
        assert.strictEqual(
          a,
          `"""
  Line 1
  Line 2
"""`
        )
      })

      it('encodes with block strings for text with new lines - CR', () => {
        const a = pipe(E.pretty, E.value(D.Str('Line 1\rLine 2')))
        assert.strictEqual(
          a,
          `"""
  Line 1
  Line 2
"""`
        )
      })

      it('encodes with block strings for text with new lines - CR followed by newline', () => {
        const a = pipe(E.pretty, E.value(D.Str('Line 1\r\nLine 2')))
        assert.strictEqual(
          a,
          `"""
  Line 1
  Line 2
"""`
        )
      })

      it('encodes a Hello World example', () => {
        const a = pipe(E.pretty, E.value(D.Str('Hello,\n  World!\n\nYours,\n  GraphQL.')))
        assert.strictEqual(
          a,
          `"""
  Hello,
    World!

  Yours,
    GraphQL.
"""`
        )
      })

      it('encodes only newlines', () => {
        const a = pipe(E.pretty, E.value(D.Str('\n')))
        assert.strictEqual(
          a,
          `"""


"""`
        )
      })

      it('encodes newlines and one symbol at the beginning', () => {
        const a = pipe(E.pretty, E.value(D.Str('a\n\n')))
        assert.strictEqual(
          a,
          `"""
  a


"""`
        )
      })

      it('encodes newlines and one symbol at the end', () => {
        const a = pipe(E.pretty, E.value(D.Str('\n\na')))
        assert.strictEqual(
          a,
          `"""


  a
"""`
        )
      })

      it('encodes newlines and one symbol in the middle', () => {
        const a = pipe(E.pretty, E.value(D.Str('\na\n')))
        assert.strictEqual(
          a,
          `"""

  a

"""`
        )
      })

      it('encodes while skipping leading and trailing whitespace', () => {
        const a = pipe(E.pretty, E.value(D.Str('  Short\ntext    ')))
        assert.strictEqual(
          a,
          `"""
  Short
  text
"""`
        )
      })
    })
  })

  describe('definition', () => {
    it('should indent block strings in arguments', () => {
      const args = [D.Argument('message', D.Str('line1\nline2'))]
      const field = D.Field('field', O.none, args, RA.empty, RA.empty)
      const operation = D.DefinitionSelectionSet([field])

      const a = pipe(E.pretty, E.definition(operation))

      assert.strictEqual(
        a,
        `{
  field(message: """
    line1
    line2
  """)
}        `
      )
    })
  })
})
