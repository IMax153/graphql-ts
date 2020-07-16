// import * as E from 'fp-ts/lib/Either'
// import { pipe } from 'fp-ts/lib/function'
// import { run } from 'parser-ts/lib/code-frame'

import * as L from './Lexer'

// pipe(run(L.blockString, '"""unescaped \\n\\r\\b\\t\\f\\u1234"""'), E.fold(console.log, console.log))

console.log(L.commonIndent(0)([' a', '  b', 'c   ']))
