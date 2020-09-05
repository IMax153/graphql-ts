import * as assert from 'assert'
import { success } from 'parser-ts/lib/ParseResult'
import { stream } from 'parser-ts/lib/Stream'

import * as P from '../../../src/Language/AST/Parser'
import { run } from '../../helpers'

describe('Parser', () => {
  it('accepts the BOM header', () => {
    assert.deepStrictEqual(run(P.document, '\ufeff{foo}'), success('', stream(['\ufeff'], 1), stream(['\ufeff'])))
  })
})
