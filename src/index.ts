import * as E from 'fp-ts/lib/Either'
import * as Ord from 'fp-ts/lib/Ord'
import { pipe } from 'fp-ts/lib/function'
import * as C from 'parser-ts/lib/char'
import { run } from 'parser-ts/lib/code-frame'
import * as P from 'parser-ts/lib/Parser'
import * as S from 'parser-ts/lib/string'
import * as I from 'monocle-ts/lib/Iso'

export const betweenNumber = Ord.between(Ord.ordNumber)

export const isAscii = (code: number): boolean => Ord.lt(Ord.ordNumber)(code, 127)

export const printAscii = (code: number): string => JSON.stringify(String.fromCharCode(code))

export const printUnicode = (code: number): string =>
  `"\\u${`00${code.toString(16).toUpperCase()}`.slice(-4)}"`

export const toCharCode = (c: C.Char): number => c.charCodeAt(0)

export const fromCharCode = (code: number): string =>
  // NaN represents the end of the file
  Number.isNaN(code) ? '<EOF>' : isAscii(code) ? printAscii(code) : printUnicode(code)

const charToCodePoint: I.Iso<C.Char, number> = {
  get: toCharCode,
  reverseGet: fromCharCode
}

// -------------------------------------------------------------------------------------
// parsers
// -------------------------------------------------------------------------------------

/**
 * Parses a character with the specified UTF-16 code unit.
 */
const charCode = (code: number): P.Parser<C.Char, string> =>
  P.expected(
    P.sat((a) => a.charCodeAt(0) === code),
    `"${String.fromCharCode(code)}"`
  )

/**
 * Parses a character with a UTF-16 code unit between the specified `start` and `end` values.
 */
const charCodeBetween = (start: number, end: number, expected: string): P.Parser<C.Char, string> =>
  P.expected(
    P.sat((a) => pipe(a.charCodeAt(0), betweenNumber(start, end))),
    `"${expected}"`
  )

/**
 * Parses a bang (`!`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const bang = charCode(33)

/**
 * Parses a hash (`#`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const hash = charCode(35)

/**
 * Parses a dollar sign (`$`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const dollar = charCode(36)

/**
 * Parses an ampersand (`&`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const amp = charCode(38)

/**
 * Parses a left parenthesis (`(`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const parenL = charCode(40)

/**
 * Parses a right parenthesis (`)`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const parenR = charCode(41)

/**
 * Parses a plus (`+`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const plus = charCode(43)

/**
 * Parses a minus (`-`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const minus = charCode(45)

/**
 * Parses a spread (`.`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const spread = charCode(46)

/**
 * Parses the zero (`0`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const zero = charCode(48)

/**
 * Parses a digit (`0-9`).
 *
 * @category parsers
 * @since 0.1.0
 */
export const digit = charCodeBetween(48, 57, '0-9')

/**
 * Parses a non-zero digit (`1-9`).
 *
 * @category parsers
 * @since 0.1.0
 */
export const nonZeroDigit = charCodeBetween(49, 57, '1-9')

/**
 * Parses a colon (`:`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const colon = charCode(58)

/**
 * Parses an equals sign (`=`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const equals = charCode(61)

/**
 * Parses an at symbol (`@`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const at = charCode(64)

/**
 * Parses a left bracket (`[`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const bracketL = charCode(91)

/**
 * Parses a right bracket (`]`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const bracketR = charCode(93)

/**
 * Parses an underscore (`_`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const underscore = charCode(95)

/**
 * Parses a left brace (`{`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const braceL = charCode(123)

/**
 * Parses a right brace (`}`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const braceR = charCode(125)

/**
 * Parses a left brace (`|`) character.
 *
 * @category parsers
 * @since 0.1.0
 */
export const pipeC = charCode(124)

/**
 * Parses an uppercase letter (`A-Z`).
 *
 * @category parsers
 * @since 0.1.0
 */
export const uppercaseLetter = charCodeBetween(65, 90, 'A-Z')

/**
 * Parses a lowercase letter (`a-z`).
 *
 * @category parsers
 * @since 0.1.0
 */
export const lowercaseLetter = charCodeBetween(97, 122, 'a-z')

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
  charCode(69), // E
  P.alt(() => charCode(101))
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
export const literalTrue = S.fold([
  charCode(116), // t
  charCode(114), // r
  charCode(117), // u
  charCode(101) // e
])

/**
 * Parses the literal value `false`.
 *
 * @category parsers
 * @since 0.1.0
 */
export const literalFalse = S.fold([
  charCode(102), // f
  charCode(97), // a
  charCode(108), // l
  charCode(115), // s
  charCode(101) // e
])

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

pipe(run(booleanValue, 'hello world'), E.fold(console.log, console.log))

console.log(pipe(charToCodePoint, I.reverse).get(127))

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
