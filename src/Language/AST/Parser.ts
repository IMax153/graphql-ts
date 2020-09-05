import { Foldable1 } from 'fp-ts/lib/Foldable'
import { Kind, URIS } from 'fp-ts/lib/HKT'
import * as O from 'fp-ts/lib/Option'
import * as RA from 'fp-ts/lib/ReadonlyArray'
import * as RNEA from 'fp-ts/lib/ReadonlyNonEmptyArray'
import { constant, pipe } from 'fp-ts/lib/function'
import * as P from 'parser-ts/lib/Parser'

import { bind, bindTo, notOneOf, notString, optional } from '../../Extras/Parser'
import * as D from './Document'
import * as L from './Lexer'

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

const maybeWithin = <A>(
  surround: (parser: P.Parser<string, ReadonlyArray<A>>) => P.Parser<string, ReadonlyArray<A>>
) => (fa: P.Parser<string, A>): P.Parser<string, ReadonlyArray<A>> =>
  pipe(
    surround(P.many(fa)),
    P.alt(() => P.of<string, ReadonlyArray<A>>(RA.empty))
  )

// -------------------------------------------------------------------------------------
// Input Values
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 0.0.1
 */
export const variable: P.Parser<string, string> = P.expected(pipe(L.dollar, P.apSecond(L.name)), 'Variable')

/**
 * @category combinators
 * @since 0.0.1
 */
export const intValue: P.Parser<string, number> = P.expected(L.intValue, 'IntValue')

/**
 * @category combinators
 * @since 0.0.1
 */
export const floatValue: P.Parser<string, number> = P.expected(L.floatValue, 'FloatValue')

/**
 * @category combinators
 * @since 0.0.1
 */
export const stringValue: P.Parser<string, string> = P.expected(
  pipe(
    L.string,
    P.alt(() => L.blockString)
  ),
  'StringValue'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const boolValue: P.Parser<string, boolean> = P.expected(
  pipe(
    L.symbol('true'),
    P.alt(() => L.symbol('false')),
    P.map((s) => s === 'true')
  ),
  'BooleanValue'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const nullValue: P.Parser<string, string> = P.expected(L.symbol('null'), 'NullValue')

/**
 * @category combinators
 * @since 0.0.1
 */
export const enumValue: P.Parser<string, string> = P.expected(
  pipe(notOneOf(RA.Traversable)(['true', 'false', 'null']), P.apSecond(L.name)),
  'EnumValue'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const value: P.Parser<string, D.Value> = P.expected(
  pipe(
    variable,
    P.map(D.Variable),
    P.alt(() => pipe(floatValue, P.map(D.Float))),
    P.alt(() => pipe(intValue, P.map(D.Int))),
    P.alt(() => pipe(boolValue, P.map(D.Bool))),
    P.alt(() => pipe(nullValue, P.map(constant(D.Null)))),
    P.alt(() => pipe(stringValue, P.map(D.Str))),
    P.alt(() => pipe(enumValue, P.map(D.Enum))),
    P.alt(() => pipe(L.brackets(P.many1(value)), P.map(D.List))),
    P.alt(() => pipe(L.braces(P.many1(objField(value))), P.map(D.Obj)))
  ),
  'Value'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const objField = <A>(valueParser: P.Parser<string, A>): P.Parser<string, D.ObjField<A>> =>
  P.expected(
    pipe(
      L.name,
      P.apFirst(L.colon),
      bindTo('key'),
      bind('value', () => valueParser),
      P.map(({ key, value }) => D.ObjField(key, value))
    ),
    'ObjectField'
  )

/**
 * @category combinators
 * @since 0.0.1
 */
export const constValue: P.Parser<string, D.ConstValue> = P.expected(
  pipe(
    floatValue,
    P.map(D.ConstFloat),
    P.alt(() => pipe(intValue, P.map(D.ConstInt))),
    P.alt(() => pipe(boolValue, P.map(D.ConstBool))),
    P.alt(() => pipe(nullValue, P.map(constant(D.ConstNull)))),
    P.alt(() => pipe(stringValue, P.map(D.ConstStr))),
    P.alt(() => pipe(enumValue, P.map(D.ConstEnum))),
    P.alt(() => pipe(L.brackets(P.many1(constValue)), P.map(D.ConstList))),
    P.alt(() => pipe(L.braces(P.many1(objField(constValue))), P.map(D.ConstObj)))
  ),
  'Value'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const defaultValue: P.Parser<string, O.Option<D.ConstValue>> = P.expected(
  optional(pipe(L.equals, P.apSecond(constValue))),
  'DefaultValue'
)

// -------------------------------------------------------------------------------------
// Arguments
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 0.0.1
 */
export const argument: P.Parser<string, D.Argument> = P.expected(
  pipe(
    L.name,
    P.apFirst(L.colon),
    bindTo('name'),
    bind('value', () => value),
    P.map(({ name, value }) => D.Argument(name, value))
  ),
  'Argument'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const args: P.Parser<string, ReadonlyArray<D.Argument>> = P.expected(
  pipe(argument, maybeWithin(L.parens)),
  'Arguments'
)

// -------------------------------------------------------------------------------------
// Field Alias
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 0.0.1
 */
export const alias: P.Parser<string, D.Alias> = P.expected(pipe(L.name, P.apFirst(L.colon)), 'Alias')

// -------------------------------------------------------------------------------------
// Directives
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 0.0.1
 */
export const directive: P.Parser<string, D.Directive> = P.expected(
  pipe(
    L.at,
    P.apSecond(L.name),
    bindTo('name'),
    bind('args', () => args),
    P.map(({ name, args }) => D.Directive(name, args))
  ),
  'Directive'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const directives: P.Parser<string, ReadonlyArray<D.Directive>> = P.expected(P.many(directive), 'Directives')

/**
 * @category combinators
 * @since 0.0.1
 */
export const typeSystemDirectiveLocation: P.Parser<string, D.DirectiveLocation> = P.expected(
  pipe(
    L.symbol('SCHEMA'),
    P.map(constant(D.SCHEMA)),
    P.alt(() => pipe(L.symbol('SCALAR'), P.map(constant(D.SCALAR)))),
    P.alt(() => pipe(L.symbol('OBJECT'), P.map(constant(D.OBJECT)))),
    P.alt(() => pipe(L.symbol('FIELD_DEFINITION'), P.map(constant(D.FIELD_DEFINITION)))),
    P.alt(() => pipe(L.symbol('ARGUMENT_DEFINITION'), P.map(constant(D.ARGUMENT_DEFINITION)))),
    P.alt(() => pipe(L.symbol('INTERFACE'), P.map(constant(D.INTERFACE)))),
    P.alt(() => pipe(L.symbol('UNION'), P.map(constant(D.UNION)))),
    P.alt(() => pipe(L.symbol('ENUM'), P.map(constant(D.ENUM)))),
    P.alt(() => pipe(L.symbol('ENUM_VALUE'), P.map(constant(D.ENUM_VALUE)))),
    P.alt(() => pipe(L.symbol('INPUT_OBJECT'), P.map(constant(D.INPUT_OBJECT)))),
    P.alt(() => pipe(L.symbol('INPUT_FIELD_DEFINITION'), P.map(constant(D.INPUT_FIELD_DEFINITION))))
  ),
  'TypeSystemDirectiveLocation'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const executableDirectiveLocation: P.Parser<string, D.DirectiveLocation> = P.expected(
  pipe(
    L.symbol('QUERY'),
    P.map(constant(D.QUERY)),
    P.alt(() => pipe(L.symbol('MUTATION'), P.map(constant(D.MUTATION)))),
    P.alt(() => pipe(L.symbol('SUBSCRIPTION'), P.map(constant(D.SUBSCRIPTION)))),
    P.alt(() => pipe(L.symbol('FIELD'), P.map(constant(D.FIELD)))),
    P.alt(() => pipe(L.symbol('FRAGMENT_DEFINITION'), P.map(constant(D.FRAGMENT_DEFINITION)))),
    P.alt(() => pipe(L.symbol('FRAGMENT_SPREAD'), P.map(constant(D.FRAGMENT_SPREAD)))),
    P.alt(() => pipe(L.symbol('INLINE_FRAGMENT'), P.map(constant(D.INLINE_FRAGMENT))))
  ),
  'ExecutableDirectiveLocation'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const directiveLocation: P.Parser<string, D.DirectiveLocation> = P.expected(
  P.either(executableDirectiveLocation, () => typeSystemDirectiveLocation),
  'DirectiveLocation'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const directiveLocations: P.Parser<string, RNEA.ReadonlyNonEmptyArray<D.DirectiveLocation>> = P.expected(
  pipe(optional(L.vbar), P.apSecond(P.sepBy1(L.vbar, directiveLocation))),
  'DirectiveLocations'
)

// -------------------------------------------------------------------------------------
// Type References
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 0.0.1
 */
export const nonNullType: P.Parser<string, D.Type> = P.expected(
  pipe(
    L.name,
    P.apFirst(L.bang),
    P.map((name) => D.NonNullType({ _tag: 'NamedType', name })),
    P.alt(() =>
      pipe(
        L.brackets(type),
        P.apFirst(L.bang),
        P.map((type) => D.NonNullType({ _tag: 'ListType', type }))
      )
    )
  ),
  'NonNullType'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const type: P.Parser<string, D.Type> = P.expected(
  pipe(
    L.name,
    P.map(D.NamedType),
    P.alt(() => pipe(L.brackets(type), P.map(D.ListType))),
    P.alt<string, D.Type>(() => nonNullType)
  ),
  'Type'
)

// -------------------------------------------------------------------------------------
// Variables
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 0.0.1
 */
export const variableDefinition: P.Parser<string, D.VariableDefinition> = P.expected(
  pipe(
    variable,
    P.apFirst(L.colon),
    bindTo('name'),
    bind('type', () => type),
    bind('defaultValue', () => defaultValue),
    P.map(({ name, type, defaultValue }) => D.VariableDefinition(name, type, defaultValue))
  ),

  'VariableDefinition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const variableDefinitions: P.Parser<string, ReadonlyArray<D.VariableDefinition>> = P.expected(
  L.parens(P.many(variableDefinition)),
  'VariableDefinitions'
)

// -------------------------------------------------------------------------------------
// Fragments
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 0.0.1
 */
export const typeCondition: P.Parser<string, D.TypeCondition> = P.expected(
  pipe(L.symbol('on'), P.apSecond(L.name)),
  'TypeCondition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const fragmentName: P.Parser<string, D.Name> = P.expected(
  pipe(notString('on'), P.apSecond(L.name)),
  'FragmentName'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const fragmentDefinition: P.Parser<string, D.ExecutableDefinition> = P.expected(
  pipe(
    L.symbol('fragment'),
    P.apSecond(L.name),
    bindTo('name'),
    bind('typeCondition', () => typeCondition),
    bind('directives', () => directives),
    bind('selectionSet', () => selectionSet),
    P.map(({ name, typeCondition, directives, selectionSet }) =>
      D.FragmentDefinition(name, typeCondition, directives, selectionSet)
    )
  ),
  'FragmentDefinition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const fragmentSpread: P.Parser<string, D.Selection> = P.expected(
  pipe(
    L.spread,
    P.apSecond(fragmentName),
    bindTo('name'),
    bind('directives', () => directives),
    P.map(({ name, directives }) => D.FragmentSpread(name, directives))
  ),
  'FragmentSpread'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const inlineFragment: P.Parser<string, D.Selection> = P.expected(
  pipe(
    L.spread,
    P.apSecond(optional(typeCondition)),
    bindTo('typeCondition'),
    bind('directives', () => directives),
    bind('selectionSet', () => selectionSet),
    P.map(({ typeCondition, directives, selectionSet }) => D.InlineFragment(typeCondition, directives, selectionSet))
  ),
  'InlineFragment'
)

// -------------------------------------------------------------------------------------
// Selection Sets
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 0.0.1
 */
export const field: P.Parser<string, D.Selection> = P.expected(
  pipe(
    optional(alias),
    bindTo('alias'),
    bind('name', () => L.name),
    bind('args', () => args),
    bind('directives', () => directives),
    bind('selectionSet', () => selectionSetOpt),
    P.map(({ alias, name, args, directives, selectionSet }) => D.Field(name, alias, args, directives, selectionSet))
  ),
  'Field'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const selection: P.Parser<string, D.Selection> = P.expected(
  pipe(
    field,
    P.alt(() => fragmentSpread),
    P.alt(() => inlineFragment)
  ),
  'Selection'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const selectionSet: P.Parser<string, D.SelectionSet> = P.expected(L.braces(P.many1(selection)), 'SelectionSet')

/**
 * @category combinators
 * @since 0.0.1
 */
export const selectionSetOpt: P.Parser<string, D.OptionalSelectionSet> = P.expected(
  pipe(selection, maybeWithin(L.braces)),
  'SelectionSet'
)

// -------------------------------------------------------------------------------------
// Operations
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 0.0.1
 */
export const query: P.Parser<string, D.OperationType> = P.expected(
  pipe(L.symbol('query'), P.map(constant(D.Query))),
  'OperationType'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const mutation: P.Parser<string, D.OperationType> = P.expected(
  pipe(L.symbol('mutation'), P.map(constant(D.Mutation))),
  'OperationType'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const subscription: P.Parser<string, D.OperationType> = P.expected(
  pipe(L.symbol('subscription'), P.map(constant(D.Subscription))),
  'OperationType'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const operationType: P.Parser<string, D.OperationType> = P.expected(
  pipe(
    query,
    P.alt(() => mutation),
    P.alt(() => subscription)
  ),
  'OperationType'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const operationDefinition: P.Parser<string, D.ExecutableDefinition> = P.expected(
  pipe(
    selectionSet,
    P.map(D.DefinitionSelectionSet),
    P.alt(() =>
      pipe(
        operationType,
        bindTo('operation'),
        bind('name', () => optional(L.name)),
        bind('variableDefinitions', () => variableDefinitions),
        bind('directives', () => directives),
        bind('selectionSet', () => selectionSet),
        P.map(({ operation, name, variableDefinitions, directives, selectionSet }) =>
          D.DefinitionOperation(operation, name, variableDefinitions, directives, selectionSet)
        )
      )
    )
  ),
  'OperationDefinition'
)

// -------------------------------------------------------------------------------------
// Schema
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 0.0.1
 */
export const operationTypeDefinition: P.Parser<string, D.OperationTypeDefinition> = P.expected(
  pipe(
    operationType,
    P.apFirst(L.colon),
    bindTo('operationType'),
    bind('name', () => L.name),
    P.map(({ name, operationType }) => D.OperationTypeDefinition(name, operationType))
  ),
  'OperationTypeDefinition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const operationTypeDefinitions: P.Parser<
  string,
  RNEA.ReadonlyNonEmptyArray<D.OperationTypeDefinition>
> = L.braces(P.many1(operationTypeDefinition))

/**
 * @category combinators
 * @since 0.0.1
 */
export const schemaExtension: P.Parser<string, D.SchemaExtension> = P.expected(
  pipe(
    RNEA.cons(
      pipe(P.many1(directive), P.map(D.SchemaDirectivesExtension)),
      RNEA.of(
        pipe(
          directives,
          bindTo('directives'),
          bind('operations', () => operationTypeDefinitions),
          P.map(({ directives, operations }) => D.SchemaOperationExtension(directives, operations))
        )
      )
    ),
    L.extend('schema')
  ),
  'SchemaExtension'
)

// -------------------------------------------------------------------------------------
// Descriptions
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 0.0.1
 */
export const description: P.Parser<string, D.Description> = P.expected(optional(stringValue), 'Description')

// -------------------------------------------------------------------------------------
// Objects
// -------------------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @category combinators
 * @since 0.0.14
 */
export const implementsInterfaces = <F extends URIS>(_: Foldable1<F>) => (
  sepBy: (sep: P.Parser<string, string>, p: P.Parser<string, string>) => P.Parser<string, Kind<F, D.Name>>
): P.Parser<string, D.ImplementsInterfaces<F>> =>
  pipe(L.symbol('implements'), P.apSecond(optional(L.ampersand)), P.apSecond(sepBy(L.ampersand, L.name)))
/* eslint-enable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @category combinators
 * @since 0.0.14
 */
export const unionMemberTypes = <F extends URIS>(_: Foldable1<F>) => (
  sepBy: (sep: P.Parser<string, string>, p: P.Parser<string, string>) => P.Parser<string, Kind<F, D.Name>>
): P.Parser<string, D.UnionMemberTypes<F>> =>
  pipe(L.equals, P.apSecond(optional(L.vbar)), P.apSecond(sepBy(L.vbar, L.name)))
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * @category combinators
 * @since 0.0.1
 */
export const inputValueDefinition: P.Parser<string, D.InputValueDefinition> = P.expected(
  pipe(
    description,
    bindTo('description'),
    bind('name', () => L.name),
    P.apFirst(L.colon),
    bind('type', () => type),
    bind('defaultValue', () => defaultValue),
    bind('directives', () => directives),
    P.map(({ name, type, description, defaultValue, directives }) =>
      D.InputValueDefinition(name, type, description, defaultValue, directives)
    )
  ),
  'InputValueDefinition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const argumentsDefinition: P.Parser<string, D.ArgumentsDefinition> = P.expected(
  pipe(inputValueDefinition, maybeWithin(L.parens)),
  'ArgumentsDefinition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const fieldDefinition: P.Parser<string, D.FieldDefinition> = P.expected(
  pipe(
    description,
    bindTo('description'),
    bind('name', () => L.name),
    bind('args', () => argumentsDefinition),
    P.apFirst(L.colon),
    bind('type', () => type),
    bind('directives', () => directives),
    P.map(({ name, type, description, args, directives }) =>
      D.FieldDefinition(name, type, description, args, directives)
    )
  ),
  'FieldDefinition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const enumValueDefinition: P.Parser<string, D.EnumValueDefinition> = P.expected(
  pipe(
    description,
    bindTo('description'),
    bind('name', () => enumValue),
    bind('directives', () => directives),
    P.map(({ name, description, directives }) => D.EnumValueDefinition(name, description, directives))
  ),
  'EnumValueDefinition'
)

// -------------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 0.0.1
 */
export const scalarTypeDefinition: P.Parser<string, D.TypeSystemDefinition> = P.expected(
  pipe(
    description,
    P.apFirst(L.symbol('scalar')),
    bindTo('description'),
    bind('name', () => L.name),
    bind('directives', () => directives),
    P.map(({ name, description, directives }) => D.ScalarTypeDefinition(name, description, directives))
  ),
  'ScalarTypeDefinition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const objectTypeDefinition: P.Parser<string, D.TypeSystemDefinition> = P.expected(
  pipe(
    description,
    P.apFirst(L.symbol('type')),
    bindTo('description'),
    bind('name', () => L.name),
    bind('impls', () => P.maybe(RA.getMonoid<D.Name>())(implementsInterfaces(RA.Foldable)(P.sepBy1))),
    bind('directives', () => directives),
    bind('fields', () => L.braces(P.many(fieldDefinition))),
    P.map(({ name, description, fields, impls, directives }) =>
      D.ObjectTypeDefinition(name, description, fields, impls, directives)
    )
  ),
  'ObjectTypeDefinition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const interfaceTypeDefinition: P.Parser<string, D.TypeSystemDefinition> = P.expected(
  pipe(
    description,
    P.apFirst(L.symbol('interface')),
    bindTo('description'),
    bind('name', () => L.name),
    bind('directives', () => directives),
    bind('fields', () => L.braces(P.many(fieldDefinition))),
    P.map(({ name, description, fields, directives }) =>
      D.InterfaceTypeDefinition(name, description, fields, directives)
    )
  ),
  'InterfaceTypeDefinition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const unionTypeDefinition: P.Parser<string, D.TypeSystemDefinition> = P.expected(
  pipe(
    description,
    P.apFirst(L.symbol('union')),
    bindTo('description'),
    bind('name', () => L.name),
    bind('directives', () => directives),
    bind('members', () => P.maybe(RA.getMonoid<D.Name>())(unionMemberTypes(RA.Foldable)(P.sepBy1))),
    P.map(({ name, description, members, directives }) => D.UnionTypeDefinition(name, description, members, directives))
  ),
  'UnionTypeDefinition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const enumTypeDefinition: P.Parser<string, D.TypeSystemDefinition> = P.expected(
  pipe(
    description,
    P.apFirst(L.symbol('enum')),
    bindTo('description'),
    bind('name', () => L.name),
    bind('directives', () => directives),
    bind('values', () => pipe(enumValueDefinition, maybeWithin(L.braces))),
    P.map(({ name, description, values, directives }) => D.EnumTypeDefinition(name, description, values, directives))
  ),
  'EnumTypeDefinition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const inputObjectTypeDefinition: P.Parser<string, D.TypeSystemDefinition> = P.expected(
  pipe(
    description,
    P.apFirst(L.symbol('input')),
    bindTo('description'),
    bind('name', () => L.name),
    bind('directives', () => directives),
    bind('values', () => pipe(inputValueDefinition, maybeWithin(L.braces))),
    P.map(({ name, description, values, directives }) =>
      D.InputObjectTypeDefinition(name, description, values, directives)
    )
  ),
  'InputObjectTypeDefinition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const scalarTypeExtension: P.Parser<string, D.TypeSystemExtension> = P.expected(
  pipe(
    L.name,
    bindTo('name'),
    bind('directives', () => P.many1(directive)),
    P.map(({ name, directives }) => D.ScalarTypeExtension(name, directives)),
    RNEA.of,
    L.extend('scalar')
  ),
  'ScalarTypeExtension'
)

const objectTypeFieldsDefinitionExtension: P.Parser<string, D.TypeSystemExtension> = pipe(
  L.name,
  bindTo('name'),
  bind('impls', () => P.maybe(RA.getMonoid<D.Name>())(implementsInterfaces(RA.Foldable)(P.sepBy1))),
  bind('directives', () => directives),
  bind('fields', () => L.braces(P.many1(fieldDefinition))),
  P.map(({ name, fields, impls, directives }) => D.ObjectTypeFieldsDefinitionExtension(name, fields, impls, directives))
)

const objectTypeDirectivesExtension: P.Parser<string, D.TypeSystemExtension> = pipe(
  L.name,
  bindTo('name'),
  bind('impls', () => P.maybe(RA.getMonoid<D.Name>())(implementsInterfaces(RA.Foldable)(P.sepBy1))),
  bind('directives', () => P.many1(directive)),
  P.map(({ name, impls, directives }) => D.ObjectTypeDirectivesExtension(name, impls, directives))
)

const objectTypeImplementsInterfacesExtension: P.Parser<string, D.TypeSystemExtension> = pipe(
  L.name,
  bindTo('name'),
  bind('impls', () => implementsInterfaces(RNEA.Foldable)(P.sepBy1)),
  P.map(({ name, impls }) => D.ObjectTypeImplementsInterfacesExtension(name, impls))
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const objectTypeExtension: P.Parser<string, D.TypeSystemExtension> = P.expected(
  pipe(
    [
      objectTypeFieldsDefinitionExtension,
      objectTypeDirectivesExtension,
      objectTypeImplementsInterfacesExtension
    ] as RNEA.ReadonlyNonEmptyArray<P.Parser<string, D.TypeSystemExtension>>,
    L.extend('type')
  ),
  'ObjectTypeExtension'
)

const interfaceTypeFieldsDefinitionExtension: P.Parser<string, D.TypeSystemExtension> = pipe(
  L.name,
  bindTo('name'),
  bind('directives', () => directives),
  bind('fields', () => L.braces(P.many1(fieldDefinition))),
  P.map(({ name, fields, directives }) => D.InterfaceTypeFieldsDefinitionExtension(name, fields, directives))
)

const interfaceTypeDirectivesExtension: P.Parser<string, D.TypeSystemExtension> = pipe(
  L.name,
  bindTo('name'),
  bind('directives', () => P.many1(directive)),
  P.map(({ name, directives }) => D.InterfaceTypeDirectivesExtension(name, directives))
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const interfaceTypeExtension: P.Parser<string, D.TypeSystemExtension> = P.expected(
  pipe(
    [interfaceTypeFieldsDefinitionExtension, interfaceTypeDirectivesExtension] as RNEA.ReadonlyNonEmptyArray<
      P.Parser<string, D.TypeSystemExtension>
    >,
    L.extend('interface')
  ),
  'InterfaceTypeExtension'
)

const unionTypeUnionMemberTypesExtension: P.Parser<string, D.TypeSystemExtension> = pipe(
  L.name,
  bindTo('name'),
  bind('directives', () => directives),
  bind('members', () => unionMemberTypes(RNEA.Foldable)(P.sepBy1)),
  P.map(({ name, members, directives }) => D.UnionTypeUnionMemberTypesExtension(name, members, directives))
)

const unionTypeDirectivesExtension: P.Parser<string, D.TypeSystemExtension> = pipe(
  L.name,
  bindTo('name'),
  bind('directives', () => P.many1(directive)),
  P.map(({ name, directives }) => D.UnionTypeDirectivesExtension(name, directives))
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const unionTypeExtension: P.Parser<string, D.TypeSystemExtension> = P.expected(
  pipe(
    [unionTypeUnionMemberTypesExtension, unionTypeDirectivesExtension] as RNEA.ReadonlyNonEmptyArray<
      P.Parser<string, D.TypeSystemExtension>
    >,
    L.extend('union')
  ),
  'UnionTypeExtension'
)

const enumTypeEnumValuesDefinitionExtension: P.Parser<string, D.TypeSystemExtension> = pipe(
  L.name,
  bindTo('name'),
  bind('directives', () => directives),
  bind('values', () => L.braces(P.many1(enumValueDefinition))),
  P.map(({ name, values, directives }) => D.EnumTypeEnumValuesDefinitionExtension(name, values, directives))
)

const enumTypeDirectivesExtension: P.Parser<string, D.TypeSystemExtension> = pipe(
  L.name,
  bindTo('name'),
  bind('directives', () => P.many1(directive)),
  P.map(({ name, directives }) => D.EnumTypeDirectivesExtension(name, directives))
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const enumTypeExtension: P.Parser<string, D.TypeSystemExtension> = P.expected(
  pipe(
    [enumTypeEnumValuesDefinitionExtension, enumTypeDirectivesExtension] as RNEA.ReadonlyNonEmptyArray<
      P.Parser<string, D.TypeSystemExtension>
    >,
    L.extend('enum')
  ),
  'EnumTypeExtension'
)

const inputObjectTypeInputFieldsDefinitionExtension: P.Parser<string, D.TypeSystemExtension> = pipe(
  L.name,
  bindTo('name'),
  bind('directives', () => directives),
  bind('values', () => L.braces(P.many1(inputValueDefinition))),
  P.map(({ name, values, directives }) => D.InputObjectTypeInputFieldsDefinitionExtension(name, values, directives))
)

const inputObjectTypeDirectivesExtension: P.Parser<string, D.TypeSystemExtension> = pipe(
  L.name,
  bindTo('name'),
  bind('directives', () => P.many1(directive)),
  P.map(({ name, directives }) => D.InputObjectTypeDirectivesExtension(name, directives))
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const inputObjectTypeExtension: P.Parser<string, D.TypeSystemExtension> = P.expected(
  pipe(
    [inputObjectTypeInputFieldsDefinitionExtension, inputObjectTypeDirectivesExtension] as RNEA.ReadonlyNonEmptyArray<
      P.Parser<string, D.TypeSystemExtension>
    >,
    L.extend('input')
  ),
  'InputObjectTypeExtension'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const typeDefinition: P.Parser<string, D.TypeSystemDefinition> = P.expected(
  pipe(
    scalarTypeDefinition,
    P.alt(() => objectTypeDefinition),
    P.alt(() => interfaceTypeDefinition),
    P.alt(() => unionTypeDefinition),
    P.alt(() => enumTypeDefinition),
    P.alt(() => inputObjectTypeDefinition)
  ),
  'TypeDefinition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const typeExtension: P.Parser<string, D.TypeSystemExtension> = P.expected(
  pipe(
    scalarTypeExtension,
    P.alt(() => objectTypeExtension),
    P.alt(() => interfaceTypeExtension),
    P.alt(() => unionTypeExtension),
    P.alt(() => enumTypeExtension),
    P.alt(() => inputObjectTypeExtension)
  ),
  'TypeExtension'
)

// -------------------------------------------------------------------------------------
// Type System
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 0.0.1
 */
export const schemaDefinition: P.Parser<string, D.TypeSystemDefinition> = P.expected(
  pipe(
    L.symbol('schema'),
    P.apSecond(directives),
    bindTo('directives'),
    bind('operations', () => operationTypeDefinitions),
    P.map(({ directives, operations }) => D.SchemaDefinition(directives, operations))
  ),
  'SchemaDefinition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const directiveDefinition: P.Parser<string, D.TypeSystemDefinition> = P.expected(
  pipe(
    description,
    P.apFirst(L.symbol('directive')),
    P.apFirst(L.at),
    bindTo('description'),
    bind('name', () => L.name),
    bind('args', () => argumentsDefinition),
    P.apFirst(L.symbol('on')),
    bind('directiveLocations', () => directiveLocations),
    P.map(({ name, description, args, directiveLocations }) =>
      D.DirectiveDefinition(name, description, args, directiveLocations)
    )
  ),
  'DirectiveDefinition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const typeSystemDefinition: P.Parser<string, D.Definition> = P.expected(
  pipe(
    schemaDefinition,
    P.alt(() => typeDefinition),
    P.alt(() => directiveDefinition)
  ),
  'TypeSystemDefinition'
)

// -------------------------------------------------------------------------------------
// Type System Extensions
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 0.0.1
 */
export const typeSystemExtension: P.Parser<string, D.Definition> = P.expected(
  P.either(schemaExtension, () => typeExtension),
  'TypeSystemExtension'
)

// -------------------------------------------------------------------------------------
// Document
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 0.0.1
 */
export const executableDefinition: P.Parser<string, D.ExecutableDefinition> = P.expected(
  P.either(operationDefinition, () => fragmentDefinition),
  'ExecutableDefinition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const definition: P.Parser<string, D.Definition> = P.expected(
  pipe(
    executableDefinition,
    P.alt(() => typeSystemDefinition),
    P.alt(() => typeSystemExtension)
  ),
  'Definition'
)

/**
 * @category combinators
 * @since 0.0.1
 */
export const document: P.Parser<string, D.Document> = pipe(
  L.unicodeBOM,
  P.apSecond(L.emptySpace),
  P.apSecond(L.lexeme(P.many1(definition)))
)
