import * as E from 'fp-ts/lib/Either'
import { Foldable, Foldable1 } from 'fp-ts/lib/Foldable'
import { Functor, Functor1 } from 'fp-ts/lib/Functor'
import { HKT, Kind, URIS } from 'fp-ts/lib/HKT'
import * as O from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/function'
import * as C from 'parser-ts/lib/char'
import * as P from 'parser-ts/lib/Parser'
import { success } from 'parser-ts/lib/ParseResult'
import * as S from 'parser-ts/lib/string'

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

const charAt: (index: number, s: string) => O.Option<C.Char> = (index, s) =>
  index >= 0 && index < s.length ? O.some(s.charAt(index)) : O.none

/**
* Fails if the specified string is matched, otherwise succeeds with an empty result and
* consumes no input.
*
* @example
* import { run } from 'parser-ts/lib/code-frame'
* import * as S from 'parser-ts/lib/string'
*
* const parser = S.notString('foo')
*
* run(parser, 'bar')
* // { _tag: 'Right', right: '' }
*
* run(parser, 'foo')
* // { _tag: 'Left', left: '> 1 | foo\n    | ^ Expected: not "foo"' }

* @internal
*/
export const notString: (s: string) => P.Parser<string, string> = (s) => (i) => {
  const _string: (s2: string) => P.Parser<string, string> = (s2) =>
    pipe(
      charAt(0, s2),
      O.fold(
        () => P.succeed(''),
        (c) =>
          pipe(
            C.notChar(c),
            P.chain(() => _string(s2.slice(1))),
            P.chain(() => P.succeed(''))
          )
      )
    )
  return pipe(
    P.expected(_string(s), `not ${JSON.stringify(s)}`)(i),
    E.chain((next) => success(next.value, i, i))
  )
}

/**
 * Fails if any of the specified strings are matched, otherwise succeeds with an empty result and
 * consumes no input.
 *
 * @internal
 */
export const notOneOf: {
  <F extends URIS>(F: Functor1<F> & Foldable1<F>): (ss: Kind<F, string>) => P.Parser<string, string>
  <F>(F: Functor<F> & Foldable<F>): (ss: HKT<F, string>) => P.Parser<string, string>
} = <F>(F: Functor<F> & Foldable<F>) => (ss: HKT<F, string>): P.Parser<string, string> =>
  F.reduce(ss, P.succeed(''), (p, s) => S.fold([p, notString(s)]))

/**
 * Returns `Some<A>` if the specified parser succeeds, otherwise returns `None`.
 *
 * @internal
 */
export const optional = <I, A>(parser: P.Parser<I, A>): P.Parser<I, O.Option<A>> =>
  pipe(
    parser,
    P.map(O.some),
    P.alt<I, O.Option<A>>(() => P.of(O.none))
  )

// -------------------------------------------------------------------------------------
// do notation
// -------------------------------------------------------------------------------------

/**
 * @internal
 */
const bind_ = <A, N extends string, B>(
  a: A,
  name: Exclude<N, keyof A>,
  b: B
): { [K in keyof A | N]: K extends keyof A ? A[K] : B } => ({ ...a, [name]: b } as any)

/**
 * @internal
 */
export const bindTo = <N extends string>(name: N) => <I, A>(fa: P.Parser<I, A>): P.Parser<I, { [K in N]: A }> =>
  pipe(
    fa,
    P.map((a) => bind_({}, name, a))
  )

/**
 * @internal
 */
export const bind = <N extends string, I, A, B>(name: Exclude<N, keyof A>, f: (a: A) => P.Parser<I, B>) => (
  fa: P.Parser<I, A>
): P.Parser<I, { [K in keyof A | N]: K extends keyof A ? A[K] : B }> =>
  pipe(
    fa,
    P.chain((a) =>
      pipe(
        f(a),
        P.map((b) => bind_(a, name, b))
      )
    )
  )
