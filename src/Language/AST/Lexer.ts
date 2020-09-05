import * as Eq from 'fp-ts/lib/Eq'
import { intercalate } from 'fp-ts/lib/Foldable'
import * as M from 'fp-ts/lib/Monoid'
import * as O from 'fp-ts/lib/Option'
import * as Ord from 'fp-ts/lib/Ord'
import * as RA from 'fp-ts/lib/ReadonlyArray'
import * as RNEA from 'fp-ts/lib/ReadonlyNonEmptyArray'
import { constVoid, flow, not, pipe, Predicate } from 'fp-ts/lib/function'
import * as C from 'parser-ts/lib/char'
import * as P from 'parser-ts/lib/Parser'
import * as S from 'parser-ts/lib/string'

import { dropRightWhile } from '../../Extras/ReadonlyArray'

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

const foldAll: (conditions: ReadonlyArray<boolean>) => boolean = M.fold(M.monoidAll)

const foldAny: (conditions: ReadonlyArray<boolean>) => boolean = M.fold(M.monoidAny)

const intercalateNewline: (strings: ReadonlyArray<string>) => string = (xs) =>
  intercalate(M.monoidString, RA.Foldable)(`\n`, xs)

const notChunkDelimiter = (char: C.Char): boolean => not(RA.elem(Eq.eqString)(char))([`"`, `\\`, `\n`, `\r`])

const isSourceCharacter: Predicate<C.Char> = (c) => {
  const code = c.charCodeAt(0)
  return foldAny([
    // basic Latin characters
    code >= 0x0020,
    // horizontal tab (`\t`)
    code === 0x0009,
    // line feed (`\n`)
    code === 0x000a,
    // carraige return (`\r`)
    code === 0x000d
  ])
}

const validStringCharacter: Predicate<C.Char> = (c) => foldAll([isSourceCharacter(c), notChunkDelimiter(c)])

const isEmptyString = (s: string): boolean => s.length === 0

// -------------------------------------------------------------------------------------
// Lexeme
// -------------------------------------------------------------------------------------

const ignoredCharacters: P.Parser<string, string> = pipe(
  C.space,
  P.alt(() => C.char(','))
)

const spaceConsumer: P.Parser<string, string> = pipe(
  C.space,
  P.alt(() => ignoredCharacters),
  P.alt(() => comment)
)

/**
 * Consumes empty space.
 *
 * @category lexers
 * @since 0.0.1
 */
export const emptySpace: P.Parser<string, void> = pipe(S.many(spaceConsumer), P.map(constVoid))

/**
 * Consumes empty space after the specified parser.
 *
 * @category lexers
 * @since 0.0.1
 */
export const lexeme: <A>(parser: P.Parser<string, A>) => P.Parser<string, A> = (p) => pipe(p, P.apFirst(emptySpace))

/**
 * Consumes empty space after the specified parser.
 *
 * @category lexers
 * @since 0.0.1
 */
export const symbol: (token: string) => P.Parser<string, string> = flow(S.string, lexeme)

// -------------------------------------------------------------------------------------
// Common
// -------------------------------------------------------------------------------------

/**
 * @category lexers
 * @since 0.0.1
 */
export const doubleQuotes: <A>(parser: P.Parser<string, A>) => P.Parser<string, A> = P.surroundedBy(symbol('"'))

/**
 * @category lexers
 * @since 0.0.1
 */
export const tripleQuotes: <A>(parser: P.Parser<string, A>) => P.Parser<string, A> = P.surroundedBy(symbol('"""'))

/**
 * @category lexers
 * @since 0.0.1
 */
export const brackets: <A>(parser: P.Parser<string, A>) => P.Parser<string, A> = P.between(symbol('['), symbol(']'))

/**
 * @category lexers
 * @since 0.0.1
 */
export const braces: <A>(parser: P.Parser<string, A>) => P.Parser<string, A> = P.between(symbol('{'), symbol('}'))

/**
 * @category lexers
 * @since 0.0.1
 */
export const parens: <A>(parser: P.Parser<string, A>) => P.Parser<string, A> = P.between(symbol('('), symbol(')'))

// -------------------------------------------------------------------------------------
// Source Text
// -------------------------------------------------------------------------------------

/**
 * Matches a single source character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const sourceCharacter: P.Parser<C.Char, C.Char> = P.expected(P.sat(isSourceCharacter), 'Source Character')

// -------------------------------------------------------------------------------------
// Unicode
// -------------------------------------------------------------------------------------

/**
 * Matches the Unicode Byte Order Mark character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const unicodeBOM: P.Parser<C.Char, C.Char> = S.maybe(C.char('\ufeff'))

// -------------------------------------------------------------------------------------
// White Space
// -------------------------------------------------------------------------------------

const isWhitespace: Predicate<C.Char> = (c) => RA.elem(Eq.eqString)(c)(['\u0009', '\u0020'])

/**
 * Matches a single whitespace character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const whitespace = P.expected(P.sat(isWhitespace), 'Whitespace')

// -------------------------------------------------------------------------------------
// Line Terminators
// -------------------------------------------------------------------------------------

/**
 * Matches a line terminator character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const lineTerminator: P.Parser<C.Char, C.Char> = P.expected(
  pipe(
    C.oneOf(`\n\r`),
    P.alt(() => S.string(`\r\n`))
  ),
  'a line terminator'
)

// -------------------------------------------------------------------------------------
// Comments
// -------------------------------------------------------------------------------------

const hash = C.char('#')

/**
 * Matches a single-line comment.
 *
 * @category lexers
 * @since 0.0.1
 */
export const comment = P.expected(
  pipe(
    hash,
    P.chain(() =>
      pipe(
        P.takeUntil<C.Char>((c) => c === '\n'),
        P.map((chars) => chars.join(''))
      )
    )
  ),
  'a comment'
)

// -------------------------------------------------------------------------------------
// Insignificant Commas
// -------------------------------------------------------------------------------------

/**
 * Matches a single comma character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const comma: P.Parser<C.Char, C.Char> = C.char(',')

// -------------------------------------------------------------------------------------
// Ignored Tokens
// -------------------------------------------------------------------------------------

/**
 * Matches a single insignificant token.
 *
 * @category lexers
 * @since 0.0.1
 */
export const ignoredToken = P.expected(
  pipe(
    unicodeBOM,
    P.alt(() => whitespace),
    P.alt(() => lineTerminator),
    P.alt(() => comment),
    P.alt(() => comma)
  ),
  'an ignored token'
)

// -------------------------------------------------------------------------------------
// Punctuators
// -------------------------------------------------------------------------------------

/**
 * Matches an exclamation point (`!`) character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const bang: P.Parser<string, string> = symbol('!')

/**
 * Matches a dollar sign (`$`) character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const dollar: P.Parser<string, string> = symbol('$')

/**
 * Matches an ampersand (`&`) character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const ampersand: P.Parser<string, string> = symbol('&')

/**
 * Matches a left parenthesis (`(`) character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const parenL: P.Parser<string, string> = symbol('(')

/**
 * Matches a left parenthesis (`)`) character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const parenR: P.Parser<string, string> = symbol(')')

/**
 * Matches a spread (`...`) character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const spread: P.Parser<string, string> = symbol('...')

/**
 * Matches a colon (`:`) character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const colon: P.Parser<string, string> = symbol(':')

/**
 * Matches a equals sign (`=`) character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const equals: P.Parser<string, string> = symbol('=')

/**
 * Matches a at sign (`@`) character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const at: P.Parser<string, string> = symbol('@')

/**
 * Matches a left bracket (`[`) character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const bracketL: P.Parser<string, string> = symbol('[')

/**
 * Matches a right bracket (`]`) character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const bracketR: P.Parser<string, string> = symbol(']')

/**
 * Matches a left brace (`{`) character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const braceL: P.Parser<string, string> = symbol('{')

/**
 * Matches a right brace (`}`) character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const braceR: P.Parser<string, string> = symbol('}')

/**
 * Matches a vertical bar (`|`) character.
 *
 * @category lexers
 * @since 0.0.1
 */
export const vbar: P.Parser<string, string> = symbol('|')

/**
 * Matches a single punctuator token.
 *
 * @category lexers
 * @since 0.0.1
 */
export const punctuator: P.Parser<string, string> = lexeme(P.either(C.oneOf('!$&():=@[]{|}'), () => spread))

// -------------------------------------------------------------------------------------
// Names
// -------------------------------------------------------------------------------------

const nameStart: P.Parser<C.Char, C.Char> = P.either(C.char('_'), () => C.letter)

const nameContinue: P.Parser<C.Char, C.Char> = C.alphanum

/**
 * Matches a name.
 *
 * @category lexers
 * @since 0.0.1
 */
export const name: P.Parser<string, string> = P.expected(lexeme(S.fold([nameStart, C.many(nameContinue)])), 'a name')

// -------------------------------------------------------------------------------------
// Int Value
// -------------------------------------------------------------------------------------

const fromString: (s: string) => O.Option<number> = (s) => {
  const n = +s
  return Number.isNaN(n) || s === '' ? O.none : O.some(n)
}

const negativeSign: P.Parser<C.Char, C.Char> = C.char('-')

const nonZeroDigit: P.Parser<C.Char, C.Char> = C.oneOf('123456789')

const integerPart: P.Parser<string, string> = pipe(
  S.fold([S.maybe(negativeSign), C.char('0')]),
  P.alt(() => S.fold([S.maybe(negativeSign), nonZeroDigit, C.many(C.digit)]))
)

/**
 * Matches an integer value.
 *
 * @category lexers
 * @since 0.0.1
 */
export const intValue: P.Parser<string, number> = pipe(
  lexeme(integerPart),
  P.chain((s) =>
    pipe(
      fromString(s),
      O.fold(() => P.fail(), P.succeed)
    )
  )
)

// -------------------------------------------------------------------------------------
// Float Value
// -------------------------------------------------------------------------------------

const decimal: P.Parser<C.Char, C.Char> = C.char('.')

const sign: P.Parser<C.Char, C.Char> = C.oneOf('+-')

const exponentIndicator: P.Parser<C.Char, C.Char> = C.oneOf('eE')

const exponentPart: P.Parser<string, string> = S.fold([exponentIndicator, S.maybe(sign), S.many1(C.digit)])

const fractionalPart: P.Parser<string, string> = S.fold([decimal, S.many1(C.digit)])

/**
 * Matches a float value.
 *
 * @category lexers
 * @since 0.0.1
 */
export const floatValue: P.Parser<string, number> = pipe(
  lexeme(
    S.fold([
      integerPart,
      pipe(
        S.fold([fractionalPart, exponentPart]),
        P.alt(() => fractionalPart),
        P.alt(() => exponentPart)
      )
    ])
  ),
  P.chain((s) =>
    pipe(
      fromString(s),
      O.fold(() => P.fail(), P.succeed)
    )
  )
)

// -------------------------------------------------------------------------------------
// String Value
// -------------------------------------------------------------------------------------

const hexDigit: P.Parser<C.Char, C.Char> = P.either(C.digit, () => C.letter)

const escapedUnicode: P.Parser<C.Char, C.Char> = S.fold([
  C.char('\\'),
  C.char('u'),
  hexDigit,
  hexDigit,
  hexDigit,
  hexDigit
])

const escapedCharacter: P.Parser<C.Char, C.Char> = S.fold([C.char('\\'), C.oneOf('"\\/bfnrt')])

const escapeTripleQuote: P.Parser<string, string> = pipe(
  C.char('\\'),
  P.chain(() => S.string('"""'))
)

const escapeSequence: P.Parser<C.Char, C.Char> = pipe(
  escapedCharacter,
  P.alt(() => escapedUnicode)
)

const blockStringCharacter: P.Parser<C.Char, C.Char> = pipe(
  whitespace,
  P.alt(() => P.sat(validStringCharacter)),
  P.alt(() => escapeTripleQuote),
  P.alt(() => escapeSequence),
  P.alt(() => S.fold([C.char('"'), C.notChar('"'), C.notChar('"')]))
)

const stringCharacter: P.Parser<C.Char, C.Char> = pipe(
  P.sat(validStringCharacter),
  P.alt(() => escapeSequence)
)

const countWhitespace = (chunk: string): number => chunk.search(/\S|$/)

const commonIndent: (init: number) => (chunks: ReadonlyArray<string>) => number = (init) =>
  RA.foldLeft(
    () => init,
    (head, rest) => {
      return isEmptyString(head)
        ? commonIndent(init)(rest)
        : Ord.min(Ord.ordNumber)(countWhitespace(head), commonIndent(countWhitespace(head))(rest))
    }
  )

export const calculateIndentSize = (chunks: ReadonlyArray<string>): number =>
  pipe(
    RA.tail(chunks),
    O.fold(() => 0, commonIndent(0))
  )

const removeIndent = (indent: number) => (chunk: string): string => chunk.slice(indent)

const removeIndents = (chunks: ReadonlyArray<string>) => (indent: number): ReadonlyArray<string> =>
  pipe(
    RA.tail(chunks),
    O.map(RA.map(removeIndent(indent))),
    O.chain((as) =>
      pipe(
        RA.head(chunks),
        O.map((a) => RA.cons(a, as))
      )
    ),
    O.getOrElse<ReadonlyArray<string>>(() => RA.empty)
  )

/**
 * Matches a string.
 *
 * @category lexers
 * @since 0.0.1
 */
export const string: P.Parser<string, string> = lexeme(doubleQuotes(S.many(stringCharacter)))

/**
 * Matches a block string.
 *
 * @category lexers
 * @since 0.0.1
 */
export const blockString: P.Parser<string, string> = P.expected(
  lexeme(
    tripleQuotes(
      pipe(
        P.sepBy(lineTerminator, S.many(blockStringCharacter)),
        P.map((byLine) => {
          const withoutEmpty = pipe(
            RA.fromArray(byLine),
            calculateIndentSize,
            removeIndents(byLine),
            RA.dropLeftWhile(isEmptyString),
            dropRightWhile(isEmptyString)
          )
          return intercalateNewline(withoutEmpty)
        })
      )
    )
  ),
  'a block string'
)

// -------------------------------------------------------------------------------------
// Schema Extensions
// -------------------------------------------------------------------------------------

/**
 * Parses the literal string `"extend"` followed by a `token`, and then executes the
 * specified list of parsers. Used by schema extensions.
 *
 * @category lexers
 * @since 0.0.1
 */
export const extend = (token: string) => <A>(
  parsers: RNEA.ReadonlyNonEmptyArray<P.Parser<string, A>>
): P.Parser<string, A> => {
  const extension = <A>(extensionParser: P.Parser<string, A>): P.Parser<string, A> =>
    pipe(
      symbol('extend'),
      P.chain(() => symbol(token)),
      P.chain(() => extensionParser)
    )

  return pipe(
    parsers,
    RNEA.reduceRight(extension(RNEA.head(parsers)), (curr, acc) =>
      pipe(
        acc,
        P.alt(() => extension(curr))
      )
    )
  )
}
