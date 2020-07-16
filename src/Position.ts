import { foldRight } from 'fp-ts/lib/Array'
import { eqNumber, getStructEq, Eq } from 'fp-ts/lib/Eq'
import { ordNumber, Ord } from 'fp-ts/lib/Ord'
import { getStructShow, showNumber, Show } from 'fp-ts/lib/Show'
import { pipe } from 'fp-ts/lib/function'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

/**
 * @category model
 * @since 0.1.0
 */
export interface Position {
  line: number
  column: number
}

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 0.1.0
 */
export const position = (line: number, column: number): Position => ({
  line,
  column
})

/**
 * @category constructors
 * @since 0.1.0
 */
export const initialPos: Position = position(1, 1)

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

/**
 * @category Eq
 * @since 0.1.0
 */
export const eqPosition: Eq<Position> = getStructEq({
  line: eqNumber,
  column: eqNumber
})

/**
 * @category Ord
 * @since 0.1.0
 */
export const ordPosition: Ord<Position> = {
  ...eqPosition,
  compare: (x, y) => {
    const ordLine = ordNumber.compare(x.line, y.line)
    return ordLine === 0 ? ordNumber.compare(x.column, y.column) : ordLine
  }
}

/**
 * @category Show
 * @since 0.1.0
 */
export const showPosition: Show<Position> = getStructShow({
  line: showNumber,
  column: showNumber
})

// -------------------------------------------------------------------------------------
// pipeables
// -------------------------------------------------------------------------------------

const updatePosChar = (char: string) => ({ line, column }: Position): Position => {
  switch (char) {
    case '\n':
      return position(line + 1, 1)

    case '\r':
      return position(line + 1, 1)

    case '\t':
      return position(line, column + 8 - ((column - 1) % 8))

    default:
      return position(line, column + 1)
  }
}

const foldPosition: (pos: Position) => (chars: Array<string>) => Position = (pos) =>
  foldRight(
    () => pos,
    (init, last) => updatePosChar(last)(foldPosition(pos)(init))
  )

/**
 * @category pipeables
 * @since 0.1.0
 */
export const updatePos = (pos: Position) => (str: string): Position => {
  return pipe(str.split(''), foldPosition(pos))
}
