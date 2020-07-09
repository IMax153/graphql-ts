import * as E from 'fp-ts/lib/Either'
import * as Eq from 'fp-ts/lib/Eq'
import * as O from 'fp-ts/lib/Option'
import * as Ord from 'fp-ts/lib/Ord'
import { pipe } from 'fp-ts/lib/function'
import * as C from 'parser-ts/lib/char'
import { run } from 'parser-ts/lib/code-frame'
import * as P from 'parser-ts/lib/Parser'
import * as S from 'parser-ts/lib/string'
import * as I from 'monocle-ts/lib/Iso'

export const isAscii = (code: number): boolean => Ord.lt(Ord.ordNumber)(code, 127)

export const printAscii = (code: number): string => JSON.stringify(String.fromCharCode(code))

export const printUnicode = (code: number): string =>
  `"\\u${`00${code.toString(16).toUpperCase()}`.slice(-4)}"`

export const toCharCode = (c: C.Char): number => c.charCodeAt(0)

export const fromCharCode = (code: number): string =>
  // NaN represents the end of the file
  Number.isNaN(code) ? '<EOF>' : isAscii(code) ? printAscii(code) : printUnicode(code)

export const charToCodePoint: I.Iso<C.Char, number> = {
  get: toCharCode,
  reverseGet: fromCharCode
}

export const eqCodePoint = pipe(Eq.eqNumber, Eq.contramap<number, C.Char>(charToCodePoint.get))

export const betweenNumber = Ord.between(Ord.ordNumber)

export const betweenCharacters = Ord.between(
  pipe(Ord.ordNumber, Ord.contramap<number, C.Char>(charToCodePoint.get))
)

export const charAt = (i: number, s: string): O.Option<C.Char> =>
  pipe(i, betweenNumber(0, s.length - 1)) ? O.some(s.charAt(i)) : O.none

// -------------------------------------------------------------------------------------
// parsers
// -------------------------------------------------------------------------------------

/**
 * Parses a character with the specified Unicode value.
 */
const charCode = (c: C.Char): P.Parser<C.Char, string> =>
  P.expected(
    P.sat((a) => eqCodePoint.equals(a, c)),
    `"${c}"`
  )

/**
 * Parses a character with a Unicode value between the specified `start` and `end` characters.
 */
const charCodeBetween = (start: C.Char, end: C.Char): P.Parser<C.Char, string> =>
  P.expected(
    P.sat((a) => pipe(a, betweenCharacters(start, end))),
    `"${start}-${end}"`
  )

const charCodeString = (s: string): P.Parser<C.Char, string> => {
  const f = (s2: string): P.Parser<C.Char, string> =>
    pipe(
      charAt(0, s2),
      O.fold(
        () => P.succeed(''),
        (c) =>
          pipe(
            charCode(c),
            P.chain(() => f(s2.slice(1))),
            P.chain(() => P.succeed(s))
          )
      )
    )

  return P.expected(f(s), JSON.stringify(s))
}

/**
 * Parses a bang (`!`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const bang = charCode('!')

/**
 * Parses a hash (`#`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const hash = charCode('#')

/**
 * Parses a dollar sign (`$`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const dollar = charCode('$')

/**
 * Parses an ampersand (`&`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const amp = charCode('&')

/**
 * Parses a left parenthesis (`(`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const parenL = charCode('(')

/**
 * Parses a right parenthesis (`)`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const parenR = charCode(')')

/**
 * Parses a plus (`+`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const plus = charCode('+')

/**
 * Parses a minus (`-`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const minus = charCode('_')

/**
 * Parses a spread (`.`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const spread = charCode('.')

/**
 * Parses a colon (`:`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const colon = charCode(':')

/**
 * Parses an equals sign (`=`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const equals = charCode('=')

/**
 * Parses an at symbol (`@`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const at = charCode('@')

/**
 * Parses a left bracket (`[`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const bracketL = charCode('[')

/**
 * Parses a right bracket (`]`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const bracketR = charCode(']')

/**
 * Parses an underscore (`_`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const underscore = charCode('_')

/**
 * Parses a left brace (`{`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const braceL = charCode('{')

/**
 * Parses a right brace (`}`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const braceR = charCode('}')

/**
 * Parses a left brace (`|`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const pipeC = charCode('|')

/**
 * Parses the zero (`0`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const zero = charCode('0')

/**
 * Parses a digit (`0-9`).
 *
 * @category parsers
 * @since 0.1.0
 */
export const digit = charCodeBetween('0', '9')

/**
 * Parses a non-zero digit (`1-9`).
 *
 * @category parsers
 * @since 0.1.0
 */
export const nonZeroDigit = charCodeBetween('1', '9')

/**
 * Parses an uppercase letter (`A-Z`).
 *
 * @category parsers
 * @since 0.1.0
 */
export const uppercaseLetter = charCodeBetween('A', 'Z')

/**
 * Parses a lowercase letter (`a-z`).
 *
 * @category parsers
 * @since 0.1.0
 */
export const lowercaseLetter = charCodeBetween('a', 'z')

/**
 * Parses a sign (`+ -`) character.
 */
export const sign = pipe(
  minus,
  P.alt(() => plus)
)

/**
 * Parses a letter (`A-Za-z`).
 *
 * @category parsers
 * @since 0.1.0
 */
export const letter = pipe(
  uppercaseLetter,
  P.alt(() => lowercaseLetter)
)

/**
 * Parses the first letter of a `Name` (`_ A-Z a-z`).
 *
 * @category parsers
 * @since 0.1.0
 */
export const nameStart = pipe(
  underscore,
  P.alt(() => lowercaseLetter),
  P.alt(() => uppercaseLetter)
)

/**
 * Parses a letter following the first letter of a `Name` (`_ 0-9 A-Z a-z`).
 *
 * @category parsers
 * @since 0.1.0
 */
export const nameContinue = pipe(
  nameStart,
  P.alt(() => digit)
)

/**
 * Parses a `Name` (`[_A-Za-z][_0-9A-Za-z]*`).
 *
 * @category parsers
 * @since 0.1.0
 */
export const name = S.fold([nameStart, C.many(nameContinue)])

/**
 * Parses an integer part.
 *
 * @category parsers
 * @since 0.1.0
 */
export const integerPart = pipe(
  S.fold([S.maybe(minus), zero]),
  P.alt(() => S.fold([S.maybe(minus), nonZeroDigit, S.many(digit)]))
)

/**
 * Parses an integer value.
 *
 * @category parsers
 * @since 0.1.0
 */
export const intValue = integerPart

/**
 * Parses a sign (`e E`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const exponentIndicator = pipe(
  charCode('e'), // E
  P.alt(() => charCode('E'))
)

/**
 * Parses an exponent part.
 *
 * @category parsers
 * @since 0.1.0
 */
export const exponentPart = S.fold([exponentIndicator, S.maybe(sign), S.many1(digit)])

/**
 * Parses a fractional part.
 *
 * @category parsers
 * @since 0.1.0
 */
export const fractionalPart = S.fold([spread, S.many1(digit)])

/**
 * Parses a float value.
 *
 * @category parsers
 * @since 0.1.0
 */
export const floatValue = S.fold([
  integerPart,
  pipe(
    S.fold([fractionalPart, exponentPart]),
    P.alt(() => S.fold([fractionalPart])),
    P.alt(() => S.fold([exponentPart]))
  )
])

/**
 * Parses the literal value `true`.
 *
 * @category parsers
 * @since 0.1.0
 */
export const literalTrue = charCodeString('true')

/**
 * Parses the literal value `false`.
 *
 * @category parsers
 * @since 0.1.0
 */
export const literalFalse = charCodeString('false')

/**
 * Parses a boolean value.
 *
 * @category parsers
 * @since 0.1.0
 */
export const booleanValue = pipe(
  literalTrue,
  P.alt(() => literalFalse)
)

pipe(run(booleanValue, 'false'), E.fold(console.log, console.log))

// // -------------------------------------------------------------------------------------
// // model
// // -------------------------------------------------------------------------------------

// export interface Name {
//   readonly kind: 'Name'
//   readonly value: string
// }

// // -------------------------------------------------------------------------------------
// // constructors
// // -------------------------------------------------------------------------------------

// export const parseName = ():P.Parser<
