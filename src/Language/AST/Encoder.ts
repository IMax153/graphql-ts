import { intercalate } from 'fp-ts/lib/Foldable'
import * as M from 'fp-ts/lib/Monoid'
import * as O from 'fp-ts/lib/Option'
import * as R from 'fp-ts/lib/Reader'
import * as RA from 'fp-ts/lib/ReadonlyArray'
import { showBoolean, showNumber, showString } from 'fp-ts/lib/Show'
import { absurd, Endomorphism, flow, not, pipe, Predicate } from 'fp-ts/lib/function'

import * as D from './Document'

const foldAny = M.fold(M.monoidAny)

const foldS = M.fold(M.monoidString)

const intercalateS: (sep: string) => (xs: ReadonlyArray<string>) => string = (sep) => (xs) =>
  intercalate(M.monoidString, RA.Foldable)(sep, xs)

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

/**
 * Represents an formatted version of a GraphQL document.
 *
 * @category model
 * @since 0.0.1
 */
export type Formatter<A> = R.Reader<Format, A>

/**
 * Determines if the format of the GraphQL document should be minified or pretty.
 *
 * @category model
 * @since 0.0.1
 */
export type Format = Minified | Pretty

/**
 * @category model
 * @since 0.0.1
 */
export interface Minified {
  readonly _tag: 'Minified'
}

/**
 * @category model
 * @since 0.0.1
 */
export interface Pretty {
  readonly _tag: 'Pretty'
  readonly indentation: number
}

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

const Minified: Format = {
  _tag: 'Minified'
}

const Pretty = (indentation: number): Format => ({
  _tag: 'Pretty',
  indentation
})

/**
 * Constructs a formatter for pretty printing.
 *
 * @category constructors
 * @since 0.0.1
 */
export const pretty: Format = Pretty(0)

/**
 * Constructs a formatter for minifying.
 *
 * @category constructors
 * @since 0.0.1
 */
export const minified: Format = Minified

// -------------------------------------------------------------------------------------
// destructors
// -------------------------------------------------------------------------------------

/**
 * @category destructors
 * @since 0.0.1
 */
export const fold = <R>(patterns: {
  readonly Pretty: (indentation: number) => R
  readonly Minified: () => R
}): ((format: Format) => R) => {
  const f = (x: Format): R => {
    switch (x._tag) {
      case 'Pretty':
        return patterns.Pretty(x.indentation)
      case 'Minified':
        return patterns.Minified()
      default:
        return absurd<R>(x as never)
    }
  }
  return f
}

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 0.0.1
 */
export const definition: (definition: D.ExecutableDefinition) => Formatter<string> = (def) =>
  fold({
    Pretty: () =>
      pipe(
        encodeDefinition(def),
        R.map((s) => foldS([s, '\n']))
      )(pretty),
    Minified: () => encodeDefinition(def)(minified)
  })

const encodeDefinition: (definition: D.ExecutableDefinition) => Formatter<string> = (def) =>
  pipe(
    def,
    D.foldExecutableDefinition({
      DefinitionOperation: (...args) => operationDefinition(D.DefinitionOperation(...args) as D.DefinitionOperation),
      FragmentDefinition: (...args) => fragmentDefinition(D.FragmentDefinition(...args) as D.FragmentDefinition),
      SelectionSet: (selection) => operationDefinition(D.DefinitionSelectionSet(selection) as D.DefinitionSelectionSet)
    })
  )

const operationDefinition: (operationDefinition: D.OperationDefinition) => Formatter<string> = (def) =>
  pipe(
    def,
    D.foldOperationDefinition({
      Operation: (operation, name, variables, directives, selectionSet) =>
        pipe(
          operation,
          D.foldOperation({
            Query: () =>
              pipe(
                node(name, variables, directives, selectionSet),
                R.map((s) => foldS(['query ', s]))
              ),
            Mutation: () =>
              pipe(
                node(name, variables, directives, selectionSet),
                R.map((s) => foldS(['mutation ', s]))
              ),
            Subscription: () =>
              pipe(
                node(name, variables, directives, selectionSet),
                R.map((s) => foldS(['subscription ', s]))
              )
          })
        ),
      SelectionSet: (selections) => selectionSet(selections)
    })
  )

const node: (
  name: O.Option<D.Name>,
  variables: ReadonlyArray<D.VariableDefinition>,
  directives: ReadonlyArray<D.Directive>,
  selectionSet: D.SelectionSet
) => Formatter<string> = (name, vars, dirs, sels) =>
  pipe(
    R.of(O.getOrElse(() => '')(name)),
    R.bindTo('name'),
    R.bind('vars', () => variableDefinitions(vars)),
    R.bind('dirs', () => directives(dirs)),
    R.bind('sep', () => fold({ Pretty: () => ' ', Minified: () => '' })),
    R.bind('sels', () => selectionSet(sels)),
    R.map(({ name, vars, dirs, sep, sels }) => foldS([name, vars, dirs, sep, sels]))
  )

const variableDefinition: (variableDefinition: D.VariableDefinition) => Formatter<string> = (def) =>
  pipe(
    variable(def.name),
    R.bindTo('variable'),
    R.bind('colon', () => fold({ Pretty: () => ': ', Minified: () => ':' })),
    R.bind('type', () => R.of(type(def.type))),
    R.bind('defaultValue', () =>
      pipe(def.defaultValue, O.traverse(R.Applicative)(defaultValue), R.map(O.getOrElse(() => '')))
    ),
    R.map(({ variable, colon, type, defaultValue }) => foldS([variable, colon, type, defaultValue]))
  )

const variableDefinitions: (xs: ReadonlyArray<D.VariableDefinition>) => Formatter<string> = (xs) =>
  pipe(xs, RA.traverse(R.Applicative)(variableDefinition), R.chain(parensCommas))

const defaultValue: (defaultValue: D.ConstValue) => Formatter<string> = (val) =>
  pipe(
    fold({ Pretty: () => ' = ', Minified: () => '=' }),
    R.bindTo('equals'),
    R.bind('value', () => value(fromConstValue(val))),
    R.map(({ equals, value }) => foldS([equals, value]))
  )

const selection: (selection: D.Selection) => Formatter<string> = (selection) =>
  pipe(
    incrementIndent,
    R.chain(() => indentFormat),
    R.bindTo('indent'),
    R.bind('sel', () =>
      pipe(
        selection,
        D.foldSelection({
          Field: (...args) => field(D.Field(...args) as D.Field),
          FragmentSpread: (...args) => fragmentSpread(D.FragmentSpread(...args) as D.FragmentSpread),
          InlineFragment: (...args) => inlineFragment(D.InlineFragment(...args) as D.InlineFragment)
        })
      )
    ),
    R.map(({ indent, sel }) => foldS([indent, sel]))
  )

const alias: (alias: O.Option<D.Name>) => Formatter<string> = (alias) =>
  pipe(
    colon,
    R.map((colon) =>
      pipe(
        alias,
        O.fold(
          () => '',
          (a) => foldS([a, colon])
        )
      )
    )
  )

const selectionSet: (selectionSet: D.SelectionSet) => Formatter<string> = (selections) =>
  pipe(selections, RA.traverse(R.Applicative)(selection), R.chain(bracesList))

const optionalSelectionSet: (optionalSelectionSet: D.OptionalSelectionSet) => Formatter<string> = (selections) =>
  pipe(selections, RA.traverse(R.Applicative)(selection), R.chain(bracesList))

const field: (field: D.Field) => Formatter<string> = (field) =>
  pipe(
    alias(field.alias),
    R.bindTo('alias'),
    R.bind('args', () => args(field.arguments)),
    R.bind('dirs', () => directives(field.directives)),
    R.bind('set', () => (field.selectionSet.length === 0 ? R.of('') : optionalSelectionSet(field.selectionSet))),
    R.bind('setPrefix', () => fold({ Pretty: () => ' ', Minified: () => '' })),
    R.map(({ alias, args, dirs, set, setPrefix }) => foldS([alias, field.name, args, dirs, setPrefix, set]))
  )

const fragmentSpread: (fragmentSpread: D.FragmentSpread) => Formatter<string> = (spread) =>
  pipe(
    directives(spread.directives),
    R.map((dirs) => foldS(['...', spread.name, dirs]))
  )

const inlineFragment: (inlineFragment: D.InlineFragment) => Formatter<string> = (frag) =>
  pipe(
    directives(frag.directives),
    R.bindTo('dirs'),
    R.bind('tc', () => R.of(O.getOrElse(() => '')(frag.typeCondition))),
    R.bind('sep', () => fold({ Pretty: () => ' ', Minified: () => '' })),
    R.bind('set', () => selectionSet(frag.selectionSet)),
    R.map(({ dirs, tc, sep, set }) => foldS(['... on ', tc, dirs, sep, set]))
  )

const fragmentDefinition: (fragmentDefinition: D.FragmentDefinition) => Formatter<string> = (def) =>
  pipe(
    directives(def.directives),
    R.bindTo('dirs'),
    R.bind('sep', () => fold({ Pretty: () => ' ', Minified: () => '' })),
    R.bind('set', () => selectionSet(def.selectionSet)),
    R.map(({ dirs, sep, set }) => foldS(['fragment ', def.name, ' on ', def.typeCondition, dirs, sep, set]))
  )

const arg: (arg: D.Argument) => Formatter<string> = (arg) =>
  pipe(
    R.ask<Format>(),
    R.bind('name', () => R.of(arg.name)),
    R.bind('sep', () => colon),
    R.bind('value', () => value(arg.value)),
    R.map(({ name, sep, value }) => foldS([name, sep, value]))
  )

const args: (args: ReadonlyArray<D.Argument>) => Formatter<string> = (args) =>
  pipe(args, RA.traverse(R.Applicative)(arg), R.chain(parensCommas))

/**
 * @category combinators
 * @since 0.0.1
 */
export const directive: (directive: D.Directive) => Formatter<string> = (directive) =>
  pipe(
    R.ask<Format>(),
    R.bind('name', () => R.of(directive.name)),
    R.bind('args', () => args(directive.arguments)),
    R.map(({ name, args }) => foldS(['@', name, args]))
  )

const directives: (directives: ReadonlyArray<D.Directive>) => Formatter<string> = (directives) =>
  fold({
    Minified: () => pipe(directives, RA.traverse(R.Applicative)(directive), R.chain(spaces))(minified),
    Pretty: () => pipe(directives, RA.traverse(R.Applicative)(directive), R.map(RA.cons(' ')), R.chain(spaces))(pretty)
  })

const fromConstValue: (constValue: D.ConstValue) => D.Value = D.foldConstValue({
  ConstInt: (x) => D.Int(x),
  ConstFloat: (x) => D.Float(x),
  ConstBool: (x) => D.Bool(x),
  ConstNull: () => D.Null,
  ConstStr: (x) => D.Str(x),
  ConstEnum: (x) => D.Enum(x),
  ConstList: (x) => pipe(x, RA.map(fromConstValue), D.List),
  ConstObj: (x) =>
    pipe(
      x,
      RA.map(({ key, value }) => D.ObjField(key, fromConstValue(value))),
      D.Obj
    )
})

/**
 * @category combinators
 * @since 0.0.1
 */
export const value: (value: D.Value) => Formatter<string> = D.foldValue({
  Variable: (x) => variable(x),
  Int: (x) => intValue(x),
  Float: (x) => floatValue(x),
  Bool: (x) => boolValue(x),
  Null: () => nullValue,
  Str: (x) => stringValue(x),
  Enum: (x) => enumValue(x),
  List: (x) => listValue(x),
  Obj: (x) => objValue(x)
})

const variable: (name: D.Name) => Formatter<string> = (name) => R.of(foldS(['$', name]))

const intValue: (integer: number) => Formatter<string> = (integer) => R.of(showNumber.show(integer))

const floatValue: (float: number) => Formatter<string> = (float) => R.of(showNumber.show(float))

const boolValue: (bool: boolean) => Formatter<string> = (bool) => R.of(showBoolean.show(bool))

const nullValue: Formatter<string> = R.of('null')

const stringValue: (str: string) => Formatter<string> = (str) =>
  fold({
    Minified: () => showString.show(str),
    Pretty: (i) => (hasEscaped(str) ? pipe(Minified, stringValue(str)) : pipe(lines(str), encode(i)))
  })

const enumValue: (enumName: D.Name) => Formatter<string> = (enumName) => R.of(enumName)

const listValue: (values: ReadonlyArray<D.Value>) => Formatter<string> = (values) =>
  pipe(
    R.ask<Format>(),
    R.chain(() => pipe(values, RA.traverse(R.Applicative)(value))),
    R.chain(bracketsCommas)
  )

const objValue: (fields: ReadonlyArray<D.ObjField<D.Value>>) => Formatter<string> = (fields) =>
  pipe(
    R.ask<Format>(),
    R.chain(() => pipe(fields, RA.traverse(R.Applicative)(objField))),
    R.bindTo('fields'),
    R.bind('sep', () => fold({ Pretty: () => ', ', Minified: () => ',' })),
    R.map(({ fields, sep }) => pipe(fields, intercalateS(sep), braces))
  )

const objField: (field: D.ObjField<D.Value>) => Formatter<string> = (field) =>
  pipe(
    R.ask<Format>(),
    R.chain(() => value(field.value)),
    R.bindTo('value'),
    R.bind('sep', () => colon),
    R.map(({ value, sep }) => foldS([field.key, sep, value]))
  )

/**
 * @category combinators
 * @since 0.0.1
 */
export const type: (type: D.Type) => string = D.foldType({
  NamedType: (x) => x,
  ListType: (x) => listType(x),
  NonNullType: (x) => nonNullType(x)
})

const listType: (type: D.Type) => string = (x) => brackets(type(x))

const nonNullType: (type: D.NamedType | D.ListType) => string = (x) => {
  switch (x._tag) {
    case 'NamedType':
      return foldS([x.name, '!'])
    case 'ListType':
      return foldS([listType(x.type), '!'])
    default:
      return absurd<string>(x as never)
  }
}

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

const colon: Formatter<string> = fold({ Pretty: () => ': ', Minified: () => ':' })

const comma: Formatter<string> = fold({ Pretty: () => ', ', Minified: () => ',' })

const between = (left: string, right: string): Endomorphism<string> => (x) => foldS([left, x, right])

const parens: Endomorphism<string> = between('(', ')')

const brackets: Endomorphism<string> = between('[', ']')

const braces: Endomorphism<string> = between('{', '}')

const bracketsCommas = (xs: ReadonlyArray<string>): Formatter<string> =>
  pipe(
    comma,
    R.map((sep) => pipe(xs, intercalateS(sep), brackets))
  )

const parensCommas = (xs: ReadonlyArray<string>): Formatter<string> =>
  pipe(
    comma,
    R.map((sep) => pipe(xs, intercalateS(sep), parens))
  )

const bracesList = (xs: ReadonlyArray<string>): Formatter<string> =>
  fold({
    Pretty: (i) =>
      foldS([pipe(xs, RA.cons('{'), intercalateS('\n')), '\n', foldS(RA.snoc(RA.replicate(i, '  '), '}'))]),
    Minified: () => pipe(xs, intercalateS(','), braces)
  })

const spaces = (xs: ReadonlyArray<string>): Formatter<string> => pipe(xs, intercalateS(' '), R.of)

const whitespaceRe = /^[ \t\uFEFF\xA0]+|[ \t\uFEFF\xA0]+$/g // Matches space and tabulation characters

const strip: (s: string) => string = (s) => s.replace(whitespaceRe, '')

const replace: (pattern: string | RegExp, replacement: string) => (s: string) => string = (p, r) => (s) =>
  s.replace(p, r)

const split: (splitter: string | RegExp) => (s: string) => ReadonlyArray<string> = (split) => (s) => s.split(split)

const isAllowed: Predicate<string> = (c) => {
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

const hasEscaped: Predicate<string> = (s) => pipe(s.split(''), RA.map(not(isAllowed)), foldAny)

const indent: (spaces: number) => string = (n) => foldS(RA.replicate(n, '  '))

const indentFormat: Formatter<string> = fold({
  Pretty: (i) => indent(i + 1),
  Minified: () => ''
})

const incrementIndent: Formatter<Format> = fold({
  Pretty: (i) => Pretty(i + 1),
  Minified: () => Minified
})

const lines: (s: string) => ReadonlyArray<string> = flow(strip, replace('\r\n', '\n'), split(/\n|\r/))

const transformLines: (indentation: number) => (xs: ReadonlyArray<string>) => string = (n) =>
  RA.reduceRight('', (line, acc) => (line.length === 0 ? foldS(['\n', acc]) : foldS([indent(n + 1), line, '\n', acc])))

const encode: (indentation: number) => (xs: ReadonlyArray<string>) => string = (n) =>
  RA.foldLeft(
    () => '""',
    (x, xs) =>
      xs.length === 0
        ? pipe(x, between('"', '"'))
        : pipe(xs, RA.cons(x), transformLines(n), between(foldS(['"""', '\n']), foldS([indent(n), '"""'])))
  )
