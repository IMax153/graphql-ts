import * as RA from 'fp-ts/lib/ReadonlyArray'
import { Endomorphism, Predicate } from 'fp-ts/lib/function'

/**
 * Remove the longest suffix of an array for which all elements satisfy the given predicate,
 * creating a new array.
 *
 * @example
 * assert.deepStrictEqual(dropRightWhile((n: number) => n % 2 === 1)([1, 3, 2, 4, 5]), [2, 4, 5])
 *
 * @internal
 */
export const dropRightWhile = <A>(p: Predicate<A>): Endomorphism<ReadonlyArray<A>> =>
  RA.reduceRight<A, ReadonlyArray<A>>(RA.empty, (a, b) => (p(a) && b.length === 0 ? [] : RA.cons(a, b)))
