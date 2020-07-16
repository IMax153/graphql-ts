import { Char } from 'parser-ts/lib/char'
import { ParseResult } from 'parser-ts/lib/ParseResult'
import { stream } from 'parser-ts/lib/Stream'
import { Parser } from 'parser-ts/lib/Parser'

export const run = <A>(p: Parser<Char, A>, s: string): ParseResult<Char, A> => p(stream(s.split('')))
