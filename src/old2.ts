// import * as E from 'fp-ts/lib/Either'
// import * as O from 'fp-ts/lib/Option'
// import { between, contramap, lt, ordNumber } from 'fp-ts/lib/Ord'
// import { pipe } from 'fp-ts/lib/function'
// import { Iso } from 'monocle-ts/lib/Iso'
// import * as C from 'parser-ts/lib/char'
// import * as P from 'parser-ts/lib/Parser'
// import * as S from 'parser-ts/lib/string'
// import { run } from 'parser-ts/lib/code-frame'

// const isAscii = (code: number): boolean => lt(ordNumber)(code, 127)

// const printAscii = (code: number): string => JSON.stringify(String.fromCharCode(code))

// const printUnicode = (code: number): string =>
//   `"\\u${`00${code.toString(16).toUpperCase()}`.slice(-4)}"`

// const toCharCode = (c: C.Char): number => c.charCodeAt(0)

// const fromCharCode = (code: number): string =>
//   // NaN represents the end of the file
//   Number.isNaN(code) ? '<EOF>' : isAscii(code) ? printAscii(code) : printUnicode(code)

// const charToCodePoint: Iso<C.Char, number> = {
//   get: toCharCode,
//   reverseGet: fromCharCode
// }

// const betweenCharacters = between(pipe(ordNumber, contramap<number, C.Char>(charToCodePoint.get)))

// /**
//  * Parses a character with a Unicode value between the specified `start` and `end` characters.
//  */
// const charCodeBetween = (start: C.Char, end: C.Char): P.Parser<C.Char, string> =>
//   P.expected(
//     P.sat((a) => pipe(a, betweenCharacters(start, end))),
//     `"${start} - ${end}"`
//   )

// /**
//  * Parses a horizontal tab (`U+0009`) character.
//  */
// const horizontalTab = C.char(`\t`)

// /**
//  * Parses a line feed (`U+000A`) character.
//  */
// const newline = C.char(`\n`)

// /**
//  * Parses a carriage return (`U+000D`) character.
//  */
// const carriageReturn = C.char(`\r`)

// // /**
// //  * Parses an exclamation mark (`U+0021`) character.
// //  */
// // const exclamationMark = C.char(`!`)

// /**
//  * Parses a quotation mark (`U+0022`) character.
//  */
// const quotationMark = C.char(`"`)

// /**
//  * Parses a hash tag (`U+0023`) character.
//  */
// const hashtag = C.char(`#`)

// // /**
// //  * Parses a dollar sign (`U+0024`) character.
// //  */
// // const dollarSign = C.char(`$`)

// // /**
// //  * Parses a percent sign (`U+0025`) character.
// //  */
// // const percentSign = C.char(`%`)

// // /**
// //  * Parses an ampersand (`U+0026`) character.
// //  */
// // const ampersand = C.char(`&`)

// // /**
// //  * Parses an apostrophe (`U+0027`) character.
// //  */
// // const apostrophe = C.char(`'`)

// // /**
// //  * Parses a left parenthesis (`U+0028`) character.
// //  */
// // const parenL = C.char(`(`)

// // /**
// //  * Parses a right parenthesis (`U+0029`) character.
// //  */
// // const parenR = C.char(`)`)

// // /**
// //  * Parses an asterisk (`U+002A`) character.
// //  */
// // const asterisk = C.char(`*`)

// /**
//  * Parses a plus sign (`U+002B`) character.
//  */
// const plusSign = C.char(`+`)

// /**
//  * Parses a comma (`U+002C`) character.
//  */
// export const comma = C.char(`,`)

// /**
//  * Parses a minus sign (`U+002D`) character.
//  */
// const minusSign = C.char(`-`)

// /**
//  * Parses a full stop (`U+002E`) character.
//  */
// const fullStop = C.char(`.`)

// // /**
// //  * Parses a slash (`U+002F`) character.
// //  */
// // const slash = C.char(`/`)

// // /**
// //  * Parses a colon (`U+003A`) character.
// //  */
// // const colon = C.char(`:`)

// // /**
// //  * Parses a semicolon (`U+003B`) character.
// //  */
// // const semicolon = C.char(`;`)

// // /**
// //  * Parses a less than sign (`U+003C`) character.
// //  */
// // const lessThanSign = C.char(`<`)

// // /**
// //  * Parses a equals sign (`U+003D`) character.
// //  */
// // const equals = C.char(`=`)

// // /**
// //  * Parses a greater than sign (`U+003E`) character.
// //  */
// // const greaterThanSign = C.char(`>`)

// // /**
// //  * Parses a question mark (`U+003F`) character.
// //  */
// // const questionMark = C.char(`?`)

// // /**
// //  * Parses a at sign (`U+0040`) character.
// //  */
// // const atSign = C.char(`@`)

// // /**
// //  * Parses a left bracket (`U+005B`) character.
// //  */
// // const bracketL = C.char(`[`)

// // /**
// //  * Parses a backslash (`U+005C`) character.
// //  */
// // const backslash = C.char(`\\`)

// // /**
// //  * Parses a right bracket (`U+005D`) character.
// //  */
// // const bracketR = C.char(`]`)

// // /**
// //  * Parses a caret (`U+005E`) character.
// //  */
// // const caret = C.char(`^`)

// /**
//  * Parses a right bracket (`U+005F`) character.
//  */
// const underscore = C.char(`_`)

// // /**
// //  * Parses a grave accent (`U+0060`) character.
// //  */
// // const graveAccent = C.char('`')

// const basicLatinCharacter = charCodeBetween('\u0020', '\uffff')

// /**
//  * Parses a source character.
//  *
//  * @category parsers
//  * @since 0.1.0
//  */
// export const sourceCharacter = P.expected(
//   pipe(
//     horizontalTab,
//     P.alt(() => newline),
//     P.alt(() => carriageReturn),
//     P.alt(() => basicLatinCharacter)
//   ),
//   'a source character'
// )

// /**
//  * Parses a Unicode byte order mark (`U+FEFF`) character.
//  *
//  * @category parsers
//  * @since 0.1.0
//  */
// export const byteOrderMark = P.expected(C.char(`\ufeff`), 'a byte order mark character')

// /**
//  * Parses a whitespace character.
//  *
//  * @category parsers
//  * @since 0.1.0
//  */
// export const whitespace = P.expected(
//   pipe(
//     horizontalTab,
//     P.alt(() => C.space)
//   ),
//   'white space'
// )

// /**
//  * Parses a line terminator.
//  *
//  * @category parsers
//  * @since 0.1.0
//  */
// export const lineTerminator = P.expected(
//   pipe(
//     newline,
//     P.alt(() => carriageReturn),
//     P.alt(() => S.fold([carriageReturn, newline]))
//   ),
//   'a line terminator'
// )

// /**
//  * Parses a comment.
//  *
//  * @category parsers
//  * @since 0.1.0
//  */
// export const comment = P.expected(
//   S.fold([
//     hashtag,
//     S.many(
//       pipe(
//         horizontalTab,
//         P.alt(() => basicLatinCharacter)
//       )
//     )
//   ]),
//   'a comment'
// )

// const integerPart = pipe(
//   S.fold([S.maybe(minusSign), C.char('0')]),
//   P.alt(() => S.fold([S.maybe(minusSign), C.oneOf('123456789'), S.many(C.digit)]))
// )

// /**
//  * Parses an integer.
//  *
//  * @category parsers
//  * @since 0.1.0
//  */
// export const intValue = P.expected(integerPart, 'an integer value')

// const sign = pipe(
//   minusSign,
//   P.alt(() => plusSign)
// )

// const exponentIndicator = C.oneOf('eE')

// const exponentPart = S.fold([exponentIndicator, S.maybe(sign), S.many1(C.digit)])

// const fractionalPart = S.fold([fullStop, S.many1(C.digit)])

// /**
//  * Parses a float value.
//  *
//  * @category parsers
//  * @since 0.1.0
//  */
// export const floatValue = P.expected(
//   S.fold([
//     integerPart,
//     pipe(
//       S.fold([fractionalPart, exponentPart]),
//       P.alt(() => fractionalPart),
//       P.alt(() => exponentPart)
//     )
//   ]),
//   'a float value'
// )

// /**
//  * Parses the first letter of a `Name` (`_ A-Z a-z`).
//  *
//  * @category parsers
//  * @since 0.1.0
//  */
// export const nameStart = pipe(
//   underscore,
//   P.alt(() => C.letter)
// )

// /**
//  * Parses a letter following the first letter of a `Name` (`_ 0-9 A-Z a-z`).
//  *
//  * @category parsers
//  * @since 0.1.0
//  */
// export const nameContinue = pipe(
//   nameStart,
//   P.alt(() => C.digit)
// )

// /**
//  * Parses a `Name` (`[_A-Za-z][_0-9A-Za-z]*`).
//  *
//  * @category parsers
//  * @since 0.1.0
//  */
// export const name = S.fold([nameStart, C.many(nameContinue)])

// const charAt = (index: number, s: string): O.Option<C.Char> =>
//   between(ordNumber)(0, s.length - 1)(index) ? O.some(s.charAt(index)) : O.none

// /**
//  * Matches the exact string provided.
//  *
//  * @since 0.6.0
//  */
// export const notString = (s: string): P.Parser<C.Char, string> => {
//   const f = (s2: string): P.Parser<C.Char, string> =>
//     pipe(
//       charAt(0, s2),
//       O.fold(
//         () => P.succeed(''),
//         (c) =>
//           pipe(
//             C.notChar(c),
//             P.chain(() => f(s2.slice(1))),
//             P.chain(() => P.succeed(s))
//           )
//       )
//     )

//   return P.expected(f(s), `anything except ${JSON.stringify(s)}`)
// }

// // export const choice = <A>(...fs: Parser<A>[]): Parser<A> => fs.reduce((fx, fy) => fx.alt(fy), fail)

// pipe(
//   run(
//     P.surroundedBy(S.string('"""'))(
//       P.many(
//         pipe(
//           pipe(
//             horizontalTab,
//             P.alt(() => newline),
//             P.alt(() => carriageReturn),
//             P.alt(() => charCodeBetween('\u0020', '\u0021')),
//             P.alt(() => charCodeBetween('\u0023', '\uffff'))
//           ),
//           P.alt(() => quotationMark),
//           P.alt(() => S.fold([quotationMark, quotationMark])),
//           P.alt(() => notString('hello'))
//         )
//       )
//     ),
//     '"""hello"""""'
//   ),
//   E.fold(console.log, console.log)
// )
