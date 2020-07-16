import * as Eq from 'fp-ts/lib/Eq'
import * as O from 'fp-ts/lib/Option'
import { min, ordNumber } from 'fp-ts/lib/Ord'
import * as M from 'fp-ts/lib/Monoid'
import * as RA from 'fp-ts/lib/ReadonlyArray'
import { not, pipe, Predicate } from 'fp-ts/lib/function'
import * as C from 'parser-ts/lib/char'
import * as P from 'parser-ts/lib/Parser'
import * as S from 'parser-ts/lib/string'

import { intercalate } from 'fp-ts/lib/Foldable'
import { dropRightWhile } from './Internal'

export const takeUntil = <I>(predicate: Predicate<I>): P.Parser<I, Array<I>> => P.many(P.sat(not(predicate)))

const any = M.fold(M.monoidAny)

const all = M.fold(M.monoidAll)

const stringElem = RA.elem(Eq.eqString)

const isChunkDelimiter = (char: C.Char): boolean => not(stringElem(char))([`"`, `\\`, `\n`, `\r`])

const isSourceCharacter = (char: C.Char): boolean => {
  const code = char.charCodeAt(0)

  return any([
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

const isEmptyString = (s: string): boolean => s.length === 0

const isWhitespace = (char: C.Char): boolean => stringElem(char)([' ', '\t'])

export const ignoredCharacters = pipe(
  C.space,
  P.alt(() => C.char(','))
)

export const comment = pipe(
  C.char('#'),
  P.chain(() =>
    pipe(
      takeUntil((c: C.Char) => c === '\n'),
      P.map((a) => a.join(''))
    )
  )
)

export const spaceConsumer = pipe(
  C.space,
  P.alt(() => ignoredCharacters),
  P.alt(() => comment)
)

export const lexeme = (s: string): P.Parser<string, string> => pipe(S.string(s), P.apFirst(S.many(spaceConsumer)))

export const symbol = (c: C.Char): P.Parser<C.Char, string> => lexeme(c)

export const bang = symbol('!')

export const dollar = symbol('$')

export const at = symbol('@')

export const amp = symbol('&')

export const colon = symbol(':')

export const equals = symbol('=')

export const spread = symbol('...')

export const bar = symbol('|')

export const parens = P.between(symbol('('), symbol(')'))

export const brackets = P.between(symbol('['), symbol(']'))

export const braces = P.between(symbol('{'), symbol('}'))

const quotes = P.surroundedBy(C.char('"'))

const tripleQuotes = P.surroundedBy(S.string('"""'))

const lineTerminator = pipe(
  S.string('\r\n'),
  P.alt(() => C.char('\n')),
  P.alt(() => C.char('\r'))
)

const hexDigit = pipe(
  C.digit,
  P.alt(() => C.letter)
)

const mapEscaped = (escaped: string): string => {
  switch (escaped) {
    case 'b':
      return '\b'
    case 'f':
      return '\f'
    case 'n':
      return '\n'
    case 'r':
      return '\r'
    case 't':
      return '\t'
    default:
      return escaped
  }
}

const parseUnicode = pipe(
  S.fold([C.char('u'), hexDigit, hexDigit, hexDigit, hexDigit]),
  P.map((s) => String.fromCharCode(parseInt(s.slice(1), 16)))
)

export const escapeSequence = pipe(
  C.char('\\'),
  P.chain(() =>
    pipe(
      C.oneOf('"\\/bfnrt'),
      P.map(mapEscaped),
      P.alt(() => parseUnicode)
    )
  )
)

export const unicodeBOM = C.char('\ufeff')

const validStringCharacter = P.sat((c: C.Char) => all([isChunkDelimiter(c), isSourceCharacter(c)]))

const stringCharacter = pipe(
  validStringCharacter,
  P.alt(() => escapeSequence)
)

export const string = quotes(pipe(S.many(stringCharacter), P.apFirst(S.many(spaceConsumer))))

const escapeTripleQuote = pipe(
  C.char('\\'),
  P.chain(() => S.string('"""'))
)

const blockEscapeSequence = pipe(
  S.fold([C.char('\\'), C.oneOf('"\\/bfnrt')]),
  P.alt(() => S.fold([C.char('\\'), C.char('u'), hexDigit, hexDigit, hexDigit, hexDigit]))
)

const blockStringCharacter = pipe(
  S.many1(P.sat(isWhitespace)),
  P.alt(() => S.many1(validStringCharacter)),
  P.alt(() => escapeTripleQuote),
  P.alt(() => blockEscapeSequence),
  P.alt(() => S.fold([C.char('"'), C.notChar('"'), C.notChar('"')]))
)

const countWhitespace = (chunk: string): number => chunk.search(/\S|$/)

export const commonIndent: (init: number) => (chunks: ReadonlyArray<string>) => number = (init) =>
  RA.foldLeft(
    () => init,
    (head, rest) => {
      return isEmptyString(head)
        ? commonIndent(init)(rest)
        : min(ordNumber)(countWhitespace(head), commonIndent(countWhitespace(head))(rest))
    }
  )

export const indentSize = (chunks: ReadonlyArray<string>): number =>
  pipe(
    RA.tail(chunks),
    O.fold(() => 0, commonIndent(0))
  )

const removeIndent = (indent: number) => (chunk: string): string => chunk.slice(indent)

export const withoutIndents = (chunks: ReadonlyArray<string>) => (indent: number): ReadonlyArray<string> =>
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

export const blockString = tripleQuotes(
  pipe(
    P.sepBy(lineTerminator, S.many(blockStringCharacter)),
    P.map((byLine) => {
      const withoutEmpty = pipe(
        RA.fromArray(byLine),
        indentSize,
        withoutIndents(byLine),
        RA.dropLeftWhile(isEmptyString),
        dropRightWhile(isEmptyString)
      )
      return intercalate(M.monoidString, RA.readonlyArray)('\n', withoutEmpty)
    }),
    P.apFirst(P.many(spaceConsumer))
  )
)

const integerPart = pipe(
  S.fold([S.maybe(C.char('-')), C.char('0')]),
  P.alt(() => S.fold([S.maybe(C.char('-')), C.oneOf('123456789'), S.many(C.digit)]))
)

export const intValue = P.expected(integerPart, 'IntValue')

const exponentPart = S.fold([C.oneOf('eE'), S.maybe(C.oneOf('-+')), S.many1(C.digit)])

const fractionalPart = S.fold([C.char('.'), S.many1(C.digit)])

export const floatValue = P.expected(
  S.fold([
    integerPart,
    pipe(
      S.fold([fractionalPart, exponentPart]),
      P.alt(() => fractionalPart),
      P.alt(() => exponentPart)
    )
  ]),
  'FloatValue'
)

export const name = pipe(
  S.fold([
    C.alphanum,
    C.many(
      pipe(
        C.alphanum,
        P.alt(() => C.digit)
      )
    )
  ]),
  P.apFirst(P.many(spaceConsumer))
)
