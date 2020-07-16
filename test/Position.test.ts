import * as assert from 'assert'

import * as P from '../src/Position'

describe('Position', () => {
  describe('constructors', () => {
    it('should construct a position', () => {
      assert.deepStrictEqual(P.position(10, 10), { line: 10, column: 10 })
    })

    it('should construct an initial position', () => {
      assert.deepStrictEqual(P.initialPos, { line: 1, column: 1 })
    })
  })

  describe('instances', () => {
    describe('eqPosition', () => {
      it('should determine if two instances of Position are equal', () => {
        assert.strictEqual(P.eqPosition.equals(P.position(1, 1), P.position(1, 1)), true)
        assert.strictEqual(P.eqPosition.equals(P.position(1, 1), P.position(2, 2)), false)
      })
    })

    describe('ordPosition', () => {
      it('should determine the ordering between instances of Position', () => {
        assert.strictEqual(P.ordPosition.compare(P.position(1, 1), P.position(2, 1)), -1)
        assert.strictEqual(P.ordPosition.compare(P.position(1, 1), P.position(1, 2)), -1)
        assert.strictEqual(P.ordPosition.compare(P.position(1, 1), P.position(1, 1)), 0)
        assert.strictEqual(P.ordPosition.compare(P.position(2, 1), P.position(1, 1)), 1)
        assert.strictEqual(P.ordPosition.compare(P.position(1, 2), P.position(1, 1)), 1)
      })
    })

    describe('showPosition', () => {
      it('should display a position as a string', () => {
        assert.strictEqual(P.showPosition.show(P.position(1, 1)), '{ line: 1, column: 1 }')
      })
    })
  })

  describe('pipeables', () => {
    describe('updatePos', () => {
      it('should update a position', () => {
        assert.deepStrictEqual(P.updatePos(P.initialPos)('hello'), { line: 1, column: 6 })
        assert.deepStrictEqual(P.updatePos(P.initialPos)('\nhello'), { line: 2, column: 6 })
        assert.deepStrictEqual(P.updatePos(P.initialPos)('hel\rlo'), { line: 2, column: 3 })
        assert.deepStrictEqual(P.updatePos(P.initialPos)('hello\t'), { line: 1, column: 9 })
      })
    })
  })
})
