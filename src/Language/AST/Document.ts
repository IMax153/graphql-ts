import { absurd } from 'fp-ts/lib/function'
import { Kind, URIS } from 'fp-ts/lib/HKT'
import * as O from 'fp-ts/lib/Option'
import * as RA from 'fp-ts/lib/ReadonlyArray'
import * as RNEA from 'fp-ts/lib/ReadonlyNonEmptyArray'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------
// Source Text
// -------------------------------------------------------------------------------------

/**
 * Represents a named identifier.
 *
 * @category model
 * @since 0.0.1
 */
export type Name = string

// -------------------------------------------------------------------------------------
// Document
// -------------------------------------------------------------------------------------

/**
 * Represents a GraphQL document.
 *
 * @category model
 * @since 0.0.1
 */
export type Document = RNEA.ReadonlyNonEmptyArray<Definition>

/**
 * Represents the definitions that can occur throughout a GraphQL document.
 *
 * @category model
 * @since 0.0.1
 */
export type Definition = ExecutableDefinition | TypeSystemDefinition | TypeSystemExtension

/**
 * Represents the top-level definitions of a document - either an operation
 * or a fragment.
 *
 * @category model
 * @since 0.0.1
 */
export type ExecutableDefinition = OperationDefinition | FragmentDefinition

// -------------------------------------------------------------------------------------
// Operations
// -------------------------------------------------------------------------------------

/**
 * Represents a GraphQL operation type.
 *
 * GraphQL has 3 operation types:
 * - `Query` - a read-only fetch
 * - `Mutation` - a write operation followed by a fetch
 * - `Subscription` - a long-lived request that fetches data in response
 * to source events
 *
 * @category model
 * @since 0.0.1
 */
export type OperationType = 'Query' | 'Mutation' | 'Subscription'

/**
 * Represents an operation definition.
 *
 * @category model
 * @since 0.0.1
 */
/**
 * @category model
 * @since 0.0.1
 */
export type OperationDefinition = DefinitionSelectionSet | DefinitionOperation

/**
 * @category model
 * @since 0.0.1
 */
export interface DefinitionSelectionSet {
  readonly _tag: 'SelectionSet'
  readonly selection: SelectionSet
}

/**
 * @category model
 * @since 0.0.1
 */
export interface DefinitionOperation {
  readonly _tag: 'DefinitionOperation'
  readonly operation: OperationType
  readonly name: O.Option<Name>
  readonly variables: ReadonlyArray<VariableDefinition>
  readonly directives: ReadonlyArray<Directive>
  readonly selectionSet: SelectionSet
}

// -------------------------------------------------------------------------------------
// Selection Sets
// -------------------------------------------------------------------------------------

/**
 * A top-level selection of fields for an operation or fragment.
 *
 * @category model
 * @since 0.0.1
 */
export type SelectionSet = RNEA.ReadonlyNonEmptyArray<Selection>

/**
 * Represents a selection of fields
 *
 * @category model
 * @since 0.0.1
 */
export type OptionalSelectionSet = ReadonlyArray<Selection>

/**
 * Represents a single entry in a `SelectionSet`. A `Selection` can be
 * a single field, fragment spread, or inline fragment.
 *
 * @category model
 * @since 0.0.1
 */
export type Selection = Field | FragmentSpread | InlineFragment

/**
 * Represents a single field within a selection.
 *
 * The only required property of a field is its name. Optionally, it
 * can also have an alias, arguments, directives, and a list of subfields.
 *
 * In the following query, `"user"` is a field with two subfields,
 * `"id"` and `"name"`.
 *
 * @example
 * ```graphql
 * {
 *   user {
 *     id
 *     name
 *   }
 * }
 * ```
 *
 * @category model
 * @since 0.0.1
 */
export interface Field {
  readonly _tag: 'Field'
  readonly name: Name
  readonly alias: O.Option<Alias>
  readonly arguments: ReadonlyArray<Argument>
  readonly directives: ReadonlyArray<Directive>
  readonly selectionSet: OptionalSelectionSet
}

/**
 * Represents a fragment spread within a selection.
 *
 * A fragment spread refers to a fragment defined outside the operation,
 * and is expanded at runtime.
 *
 * @example
 * ```graphql
 * {
 *   user {
 *     ...userFragment
 *   }
 * }
 *
 * fragment userFragment on UserType {
 *   id
 *   name
 * }
 * ```
 *
 * @category model
 * @since 0.0.1
 */
export interface FragmentSpread {
  readonly _tag: 'FragmentSpread'
  readonly name: Name
  readonly directives: ReadonlyArray<Directive>
}

/**
 * Represents an inline fragment within a selection.
 *
 * Inline fragments are similar to fragment spreads, but they do not have
 * any name and the type condition (i.e. `"on User"`) is optional.
 *
 * @example
 * ```graphql
 * {
 *   user {
 *     ... on UserType {
 *       id
 *       name
 *     }
 *   }
 * }
 * ```
 *
 * @category model
 * @since 0.0.1
 */
export interface InlineFragment {
  readonly _tag: 'InlineFragment'
  readonly typeCondition: O.Option<TypeCondition>
  readonly directives: ReadonlyArray<Directive>
  readonly selectionSet: SelectionSet
}

// -------------------------------------------------------------------------------------
// Arguments
// -------------------------------------------------------------------------------------

/**
 * Represents a single argument.
 *
 * In the query below, the argument `"id"` is supplied to the field
 * for a `"user"` with a value of `4`.
 *
 * @example
 * ```graphql
 * {
 *   user(id: 4) {
 *     name
 *   }
 * }
 * ```
 *
 * @category model
 * @since 0.0.1
 */
export interface Argument {
  readonly name: Name
  readonly value: Value
}

// -------------------------------------------------------------------------------------
// Field Alias
// -------------------------------------------------------------------------------------

/**
 * Represents an alternative name for a `Field`.
 *
 * Below, `smallPic` and `bigPic` are aliases for the same field,
 * `profilePic`, used to distinguish between profile pictures with
 * different arguments.
 *
 * @example
 * ```graphql
 * {
 *   smallPic: profilePic(size: 64)
 *   largePic: profilePic(size: 1024)
 * }
 * ```
 *
 * @category model
 * @since 0.0.1
 */
export type Alias = Name

// -------------------------------------------------------------------------------------
// Fragments
// -------------------------------------------------------------------------------------

/**
 * Represents the definition of a fragment.
 *
 * @example
 * ```graphql
 * {
 *   fragment userFields on UserType {
 *     id
 *     name
 *   }
 * }
 * ```
 *
 * @category model
 * @since 0.0.1
 */
export interface FragmentDefinition {
  readonly _tag: 'FragmentDefinition'
  readonly name: Name
  readonly typeCondition: TypeCondition
  readonly directives: ReadonlyArray<Directive>
  readonly selectionSet: SelectionSet
}

/**
 * Represents a constraint on a fragment that specifies what type
 * the fragment applies to.
 *
 * Below, the type condition `on User` indicates that the fragment
 * can only be applied to type `User`.
 *
 * @example
 * ```graphql
 * {
 *   fragment userFields on UserType {
 *     id
 *     name
 *   }
 * }
 * ```
 *
 * @category model
 * @since 0.0.1
 */
export type TypeCondition = Name

// -------------------------------------------------------------------------------------
// Input Values
// -------------------------------------------------------------------------------------

/**
 * Represents an input value. The input value can be either a literal value or a
 * variable.
 *
 * @category model
 * @since 0.0.1
 */
export type Value = Variable | Int | Float | Str | Bool | Null | Enum | List | Obj

/**
 * @category model
 * @since 0.0.1
 */
export interface Variable {
  readonly _tag: 'Variable'
  readonly name: Name
}

/**
 * @category model
 * @since 0.0.1
 */
export interface Int {
  readonly _tag: 'Int'
  readonly value: number
}

/**
 * @category model
 * @since 0.0.1
 */
export interface Float {
  readonly _tag: 'Float'
  readonly value: number
}

/**
 * @category model
 * @since 0.0.1
 */
export interface Str {
  readonly _tag: 'Str'
  readonly value: string
}

/**
 * @category model
 * @since 0.0.1
 */
export interface Bool {
  readonly _tag: 'Bool'
  readonly value: boolean
}

/**
 * @category model
 * @since 0.0.1
 */
export interface Null {
  readonly _tag: 'Null'
}

/**
 * @category model
 * @since 0.0.1
 */
export interface Enum {
  readonly _tag: 'Enum'
  readonly name: Name
}

/**
 * @category model
 * @since 0.0.1
 */
export interface List {
  readonly _tag: 'List'
  readonly values: ReadonlyArray<Value>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface Obj {
  readonly _tag: 'Obj'
  readonly fields: ReadonlyArray<ObjField<Value>>
}

/**
 * Represents a constant input value. The input value can be either a literal value
 * or a variable.
 *
 * @category model
 * @since 0.0.1
 */
export type ConstValue = ConstInt | ConstFloat | ConstStr | ConstBool | ConstNull | ConstEnum | ConstList | ConstObj

/**
 * @category model
 * @since 0.0.1
 */
export interface ConstInt {
  readonly _tag: 'ConstInt'
  readonly value: number
}

/**
 * @category model
 * @since 0.0.1
 */
export interface ConstFloat {
  readonly _tag: 'ConstFloat'
  readonly value: number
}

/**
 * @category model
 * @since 0.0.1
 */
export interface ConstStr {
  readonly _tag: 'ConstStr'
  readonly value: string
}

/**
 * @category model
 * @since 0.0.1
 */
export interface ConstBool {
  readonly _tag: 'ConstBool'
  readonly value: boolean
}

/**
 * @category model
 * @since 0.0.1
 */
export interface ConstNull {
  readonly _tag: 'ConstNull'
}

/**
 * @category model
 * @since 0.0.1
 */
export interface ConstEnum {
  readonly _tag: 'ConstEnum'
  readonly name: Name
}

/**
 * @category model
 * @since 0.0.1
 */
export interface ConstList {
  readonly _tag: 'ConstList'
  readonly values: ReadonlyArray<ConstValue>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface ConstObj {
  readonly _tag: 'ConstObj'
  readonly fields: ReadonlyArray<ObjField<ConstValue>>
}

/**
 * A key-value pair.
 *
 * A list of `ObjField`s represents a GraphQL object type.
 *
 * @category model
 * @since 0.0.1
 */
export interface ObjField<A> {
  readonly key: Name
  readonly value: A
}

// -------------------------------------------------------------------------------------
// Variables
// -------------------------------------------------------------------------------------

/**
 * Represents the definition of a variable.
 *
 * Each operation can include a list of variables. The query below
 * defines an optional variable `protagonist` of type `String`, with
 * a default value of `"Zarathustra"`. If no default value is defined,
 * and no value is provided, a variable can still be `null` if its
 * type is nullable.
 *
 * @example
 * ```graphql
 * query (protagonist: String = "Zarathustra") {
 *   getAuthor(protagonist: $protagonist)
 * }
 * ```
 *
 * Variables are usually passed along with the query, but not in the
 * query itself. They make queries reusable.
 *
 * @category model
 * @since 0.0.1
 */
export interface VariableDefinition {
  readonly name: Name
  readonly type: Type
  readonly defaultValue: O.Option<ConstValue>
}

// -------------------------------------------------------------------------------------
// Type References
// -------------------------------------------------------------------------------------

/**
 * Represents a GraphQL type.
 *
 * @category model
 * @since 0.0.1
 */
export type Type = NamedType | ListType | NonNullType

/**
 * Represents a GraphQL nullable named type.
 *
 * @category model
 * @since 0.0.1
 */
export interface NamedType {
  readonly _tag: 'NamedType'
  readonly name: Name
}

/**
 * Represents a GraphQL list type.
 *
 * @category model
 * @since 0.0.1
 */
export interface ListType {
  readonly _tag: 'ListType'
  readonly type: Type
}

/**
 * Represents a GraphQL non-nullable named or list type.
 *
 * @category model
 * @since 0.0.1
 */
export interface NonNullType {
  readonly _tag: 'NonNullType'
  readonly type: NamedType | ListType
}

// -------------------------------------------------------------------------------------
// Directives
// -------------------------------------------------------------------------------------

/**
 * Represents the locations that a directive can appear within a GraphQL document.
 *
 * All directives can be split into two groups:
 * 1. Directives used to annotate various parts of executable definitions
 * 2. Directives used to annotate various parts of schema definitions
 *
 * @category model
 * @since 0.0.1
 */
export type DirectiveLocation = ExecutableDirectiveLocation | TypeSystemDirectiveLocation

/**
 * Represents the locations that a directive can appear in an executable definition, such
 * as a query.
 *
 * @category model
 * @since 0.0.1
 */
export type ExecutableDirectiveLocation =
  | 'Query'
  | 'Mutation'
  | 'Subscription'
  | 'Field'
  | 'FragmentDefinition'
  | 'FragmentSpread'
  | 'InlineFragment'

/**
 * Represents where directives can appear in a type system definition.
 *
 * @category model
 * @since 0.0.1
 */
export type TypeSystemDirectiveLocation =
  | 'Schema'
  | 'Scalar'
  | 'Object'
  | 'FieldDefinition'
  | 'ArgumentDefinition'
  | 'Interface'
  | 'Union'
  | 'Enum'
  | 'EnumValue'
  | 'InputObject'
  | 'InputFieldDefinition'
/**
 * Represents a directive.
 *
 * Directives begin with `"@"`, can accept arguments, and can be applied
 * to most GraphQL elements to provide additional information.
 *
 * @category model
 * @since 0.0.1
 */
export interface Directive {
  readonly name: Name
  readonly arguments: ReadonlyArray<Argument>
}

// -------------------------------------------------------------------------------------
// Type System
// -------------------------------------------------------------------------------------

/**
 * Represents the definition of a GraphQL schema, type, or directive.
 *
 * In the example below, a custom directive `"@test"` is defined, which
 * is applied to a field definition `"Query"`. The top-level schema
 * definition then makes use of the type `Query` to define the query operation.
 *
 * @example
 * ```graphql
 * schema {
 *   query: Query
 * }
 *
 * directive @test on FIELD_DEFINITION
 *
 * type Query {
 *   field: String @test
 * }
 * ```
 *
 * @category model
 * @since 0.0.1
 */
export type TypeSystemDefinition = SchemaDefinition | TypeDefinition | DirectiveDefinition

/**
 * Represents the definition of a GraphQL schema.
 *
 * In the example below, the schema is defined with a single operation `"query"`
 * of type `Query`.
 *
 * @example
 * ```graphql
 * schema {
 *   query: Query
 * }
 * ``
 *
 * @category model
 * @since 0.0.1
 */
export interface SchemaDefinition {
  readonly _tag: 'SchemaDefinition'
  readonly directives: ReadonlyArray<Directive>
  readonly operations: RNEA.ReadonlyNonEmptyArray<OperationTypeDefinition>
}

/**
 * Represents the definition of a GraphQL directive.
 *
 * In the example below, a field directive, `"@test"` is defined.
 *
 * @example
 * ```graphql
 * directive @test on FIELD_DEFINITION
 * ```
 *
 * @category model
 * @since 0.0.1
 */
export interface DirectiveDefinition {
  readonly _tag: 'DirectiveDefinition'
  readonly name: Name
  readonly description: Description
  readonly arguments: ArgumentsDefinition
  readonly directiveLocations: RNEA.ReadonlyNonEmptyArray<DirectiveLocation>
}

// -------------------------------------------------------------------------------------
// Type System Extensions
// -------------------------------------------------------------------------------------

/**
 * Represents the extension of a GraphQL type system definition. Only schema and
 * type definitions can be extended.
 *
 * @category model
 * @since 0.0.1
 */
export type TypeSystemExtension = SchemaExtension | TypeExtension

// -------------------------------------------------------------------------------------
// Schema
// -------------------------------------------------------------------------------------

/**
 * Represents the root operation type definition.
 *
 * Defining the root operation types is not required since they have defaults.
 * The default query root type is `Query` and the default mutation root type is
 * `Mutation`. These defaults can be modified for a specific schema.
 *
 * In the following example, the root query type is changed to `MyRootQueryType`,
 * and the root mutation type is changed to `MyRootMutationType`.
 *
 * @example
 * ```graphql
 * schema {
 *   query: MyRootQueryType
 *   mutation: MyRootMutationType
 * }
 * ```
 *
 * @category model
 * @since 0.0.1
 */
export interface OperationTypeDefinition {
  readonly name: Name
  readonly operation: OperationType
}

/**
 * Represents further extension of the schema definition through extension of
 * operations or directives.
 *
 * @category model
 * @since 0.0.1
 */
export type SchemaExtension = SchemaOperationExtension | SchemaDirectivesExtension

/**
 * @category model
 * @since 0.0.1
 */
export interface SchemaOperationExtension {
  readonly _tag: 'SchemaOperationExtension'
  readonly directives: ReadonlyArray<Directive>
  readonly operations: RNEA.ReadonlyNonEmptyArray<OperationTypeDefinition>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface SchemaDirectivesExtension {
  readonly _tag: 'SchemaDirectivesExtension'
  readonly directives: RNEA.ReadonlyNonEmptyArray<Directive>
}

// -------------------------------------------------------------------------------------
// Descriptions
// -------------------------------------------------------------------------------------

/**
 * Represents the description of a GraphQL element.
 *
 * GraphQL has the built-in capability to document service APIs. Documentation
 * is a GraphQL string that precedes a particular definition and contains
 * Markdown. Any GraphQL definition can be documented in this manner.
 *
 * @example
 * ```graphql
 * """
 * Supported languages.
 * """
 * enum Language {
 *   "English"
 *   EN
 *
 *   "Russian"
 *   RU
 * }
 * ```
 *
 * @category model
 * @since 0.0.1
 */
export type Description = O.Option<string>

// -------------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------------

/**
 * Represents type definitions which describe various user-defined types.
 *
 * @category model
 * @since 0.0.1
 */
export type TypeDefinition =
  | ScalarTypeDefinition
  | ObjectTypeDefinition
  | InterfaceTypeDefinition
  | UnionTypeDefinition
  | EnumTypeDefinition
  | InputObjectTypeDefinition

/**
 * @category model
 * @since 0.0.1
 */
export interface ScalarTypeDefinition {
  readonly _tag: 'ScalarTypeDefinition'
  readonly name: Name
  readonly description: Description
  readonly directives: ReadonlyArray<Directive>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface ObjectTypeDefinition {
  readonly _tag: 'ObjectTypeDefinition'
  readonly name: Name
  readonly description: Description
  readonly fields: ReadonlyArray<FieldDefinition>
  readonly implements: ImplementsInterfaces<RA.URI>
  readonly directives: ReadonlyArray<Directive>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface InterfaceTypeDefinition {
  readonly _tag: 'InterfaceTypeDefinition'
  readonly name: Name
  readonly description: Description
  readonly fields: ReadonlyArray<FieldDefinition>
  readonly directives: ReadonlyArray<Directive>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface UnionTypeDefinition {
  readonly _tag: 'UnionTypeDefinition'
  readonly name: Name
  readonly description: Description
  readonly members: UnionMemberTypes<RA.URI>
  readonly directives: ReadonlyArray<Directive>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface EnumTypeDefinition {
  readonly _tag: 'EnumTypeDefinition'
  readonly name: Name
  readonly description: Description
  readonly values: ReadonlyArray<EnumValueDefinition>
  readonly directives: ReadonlyArray<Directive>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface InputObjectTypeDefinition {
  readonly _tag: 'InputObjectTypeDefinition'
  readonly name: Name
  readonly description: Description
  readonly values: ReadonlyArray<InputValueDefinition>
  readonly directives: ReadonlyArray<Directive>
}

/**
 * Represents extensions for custom, already defined types.
 *
 * @category model
 * @since 0.0.1
 */
export type TypeExtension =
  | ScalarTypeExtension
  | ObjectTypeFieldsDefinitionExtension
  | ObjectTypeDirectivesExtension
  | ObjectTypeImplementsInterfacesExtension
  | InterfaceTypeFieldsDefinitionExtension
  | InterfaceTypeDirectivesExtension
  | UnionTypeUnionMemberTypesExtension
  | UnionTypeDirectivesExtension
  | EnumTypeEnumValuesDefinitionExtension
  | EnumTypeDirectivesExtension
  | InputObjectTypeInputFieldsDefinitionExtension
  | InputObjectTypeDirectivesExtension

/**
 * @category model
 * @since 0.0.1
 */
export interface ScalarTypeExtension {
  readonly _tag: 'ScalarTypeExtension'
  readonly name: Name
  readonly directives: RNEA.ReadonlyNonEmptyArray<Directive>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface ObjectTypeFieldsDefinitionExtension {
  readonly _tag: 'ObjectTypeFieldsDefinitionExtension'
  readonly name: Name
  readonly fields: RNEA.ReadonlyNonEmptyArray<FieldDefinition>
  readonly implements: ImplementsInterfaces<RA.URI>
  readonly directives: ReadonlyArray<Directive>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface ObjectTypeDirectivesExtension {
  readonly _tag: 'ObjectTypeDirectivesExtension'
  readonly name: Name
  readonly implements: ImplementsInterfaces<RA.URI>
  readonly directives: RNEA.ReadonlyNonEmptyArray<Directive>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface ObjectTypeImplementsInterfacesExtension {
  readonly _tag: 'ObjectTypeImplementsInterfacesExtension'
  readonly name: Name
  readonly implements: ImplementsInterfaces<RNEA.URI>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface InterfaceTypeFieldsDefinitionExtension {
  readonly _tag: 'InterfaceTypeFieldsDefinitionExtension'
  readonly name: Name
  readonly fields: RNEA.ReadonlyNonEmptyArray<FieldDefinition>
  readonly directives: ReadonlyArray<Directive>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface InterfaceTypeDirectivesExtension {
  readonly _tag: 'InterfaceTypeDirectivesExtension'
  readonly name: Name
  readonly directives: RNEA.ReadonlyNonEmptyArray<Directive>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface UnionTypeUnionMemberTypesExtension {
  readonly _tag: 'UnionTypeUnionMemberTypesExtension'
  readonly name: Name
  readonly members: UnionMemberTypes<RNEA.URI>
  readonly directives: ReadonlyArray<Directive>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface UnionTypeDirectivesExtension {
  readonly _tag: 'UnionTypeDirectivesExtension'
  readonly name: Name
  readonly directives: RNEA.ReadonlyNonEmptyArray<Directive>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface EnumTypeEnumValuesDefinitionExtension {
  readonly _tag: 'EnumTypeEnumValuesDefinitionExtension'
  readonly name: Name
  readonly values: RNEA.ReadonlyNonEmptyArray<EnumValueDefinition>
  readonly directives: ReadonlyArray<Directive>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface EnumTypeDirectivesExtension {
  readonly _tag: 'EnumTypeDirectivesExtension'
  readonly name: Name
  readonly directives: RNEA.ReadonlyNonEmptyArray<Directive>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface InputObjectTypeInputFieldsDefinitionExtension {
  readonly _tag: 'InputObjectTypeInputFieldsDefinitionExtension'
  readonly name: Name
  readonly values: RNEA.ReadonlyNonEmptyArray<InputValueDefinition>
  readonly directives: ReadonlyArray<Directive>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface InputObjectTypeDirectivesExtension {
  readonly _tag: 'InputObjectTypeDirectivesExtension'
  readonly name: Name
  readonly directives: RNEA.ReadonlyNonEmptyArray<Directive>
}

// -------------------------------------------------------------------------------------
// Objects
// -------------------------------------------------------------------------------------

/**
 * Represents a list of interfaces implemented by a given object type.
 *
 * In the example below, the object type `Business` implements two interfaces,
 * `NamedEntity` and `ValuedEntity`.
 *
 * @example
 * ```graphql
 * type Business implements NamedEntity & ValuedEntity {
 *   name: String
 * }
 * ```
 *
 * @category model
 * @since 0.0.1
 */
export type ImplementsInterfaces<F extends URIS> = Kind<F, Name>

/**
 * Represents the definition of a single field within a GraphQL type.
 *
 * In the example below, `"name"` and `"picture"` are field definitions,
 * including their arguments and their types.
 *
 * @example
 * ```graphql
 * type Person {
 *   name: String
 *   picture(width: Int, height: Int): Url
 * }
 * ```
 *
 * @category model
 * @since 0.0.1
 */
export interface FieldDefinition {
  readonly name: Name
  readonly type: Type
  readonly description: Description
  readonly arguments: ArgumentsDefinition
  readonly directives: ReadonlyArray<Directive>
}

/**
 * Represents a list of values passed to a field.
 *
 * In the example below, the `Person` type has two fields, `"name"` and
 * `"picture"`. The `"name"` field does not have any arguments, so its
 * `ArgumentsDefinition` would be an empty list. However, `"picture"`
 * contains definitions for two arguments: `"width"` and `"height"`.
 *
 * @category model
 * @since 0.0.1
 */
export type ArgumentsDefinition = ReadonlyArray<InputValueDefinition>

/**
 * Represents the definition of an input value.
 *
 * An input value can define field arguments (@see ArgumentsDefinition).
 * They can also be used as field definitions in an input type.
 *
 * In the example below, the input type `Point2D` contains two value
 * definitions: `"x"` and `"y"`.
 *
 * @example
 * ```graphql
 * input Point2D {
 *   x: Float
 *   y: Float
 * }
 * ```
 *
 * @category model
 * @since 0.0.1
 */
export interface InputValueDefinition {
  readonly name: Name
  readonly type: Type
  readonly description: Description
  readonly value: O.Option<ConstValue>
  readonly directives: ReadonlyArray<Directive>
}

/**
 * Represents a list of types that form a union.
 *
 * In the example below, `Person` and `Photo` are member types of the
 * union `SearchResult`.
 *
 * @example
 * ```graphql
 * union SearchResult = Person | Photo
 * ```
 *
 * @category model
 * @since 0.0.1
 */
export type UnionMemberTypes<F extends URIS> = Kind<F, Name>

/**
 * Represents a single value within an enum definition.
 *
 * In the example below, `"NORTH"`, `"EAST"`, `"SOUTH"`, and `"WEST"`
 * are all value definitions within the enum type `Direction`.
 *
 * @example
 * ```graphql
 * enum Direction {
 *   NORTH
 *   EAST
 *   SOUTH
 *   WEST
 * }
 * ```
 *
 * @category model
 * @since 0.0.1
 */
export interface EnumValueDefinition {
  readonly name: Name
  readonly description: Description
  readonly directives: ReadonlyArray<Directive>
}

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------
// Operations
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 0.0.1
 */
export const Query: OperationType = 'Query'

/**
 * @category constructors
 * @since 0.0.1
 */
export const Mutation: OperationType = 'Mutation'

/**
 * @category constructors
 * @since 0.0.1
 */
export const Subscription: OperationType = 'Subscription'

/**
 * @category constructors
 * @since 0.0.1
 */
export const DefinitionSelectionSet = (selection: SelectionSet): ExecutableDefinition => ({
  _tag: 'SelectionSet',
  selection
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const DefinitionOperation = (
  operation: OperationType,
  name: O.Option<Name>,
  variables: ReadonlyArray<VariableDefinition>,
  directives: ReadonlyArray<Directive>,
  selectionSet: SelectionSet
): ExecutableDefinition => ({
  _tag: 'DefinitionOperation',
  operation,
  name,
  variables,
  directives,
  selectionSet
})

// -------------------------------------------------------------------------------------
// Selection Sets
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 0.0.1
 */
export const Field = (
  name: Name,
  alias: O.Option<Alias>,
  arguments_: ReadonlyArray<Argument>,
  directives: ReadonlyArray<Directive>,
  selectionSet: OptionalSelectionSet
): Selection => ({
  _tag: 'Field',
  name,
  alias,
  arguments: arguments_,
  directives,
  selectionSet
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const FragmentSpread = (name: Name, directives: ReadonlyArray<Directive>): Selection => ({
  _tag: 'FragmentSpread',
  name,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const InlineFragment = (
  typeCondition: O.Option<TypeCondition>,
  directives: ReadonlyArray<Directive>,
  selectionSet: SelectionSet
): Selection => ({
  _tag: 'InlineFragment',
  typeCondition,
  directives,
  selectionSet
})

// -------------------------------------------------------------------------------------
// Arguments
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 0.0.1
 */
export const Argument = (name: Name, value: Value): Argument => ({
  name,
  value
})

// -------------------------------------------------------------------------------------
// Fragments
// -------------------------------------------------------------------------------------

export const FragmentDefinition = (
  name: Name,
  typeCondition: TypeCondition,
  directives: ReadonlyArray<Directive>,
  selectionSet: SelectionSet
): ExecutableDefinition => ({
  _tag: 'FragmentDefinition',
  name,
  typeCondition,
  directives,
  selectionSet
})

// -------------------------------------------------------------------------------------
// Input Values
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 0.0.1
 */
export const Variable = (name: Name): Value => ({
  _tag: 'Variable',
  name
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const Int = (value: number): Value => ({
  _tag: 'Int',
  value
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const Float = (value: number): Value => ({
  _tag: 'Float',
  value
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const Str = (value: string): Value => ({
  _tag: 'Str',
  value
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const Bool = (value: boolean): Value => ({
  _tag: 'Bool',
  value
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const Null: Value = {
  _tag: 'Null'
}

/**
 * @category constructors
 * @since 0.0.1
 */
export const Enum = (name: Name): Value => ({
  _tag: 'Enum',
  name
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const List = (values: ReadonlyArray<Value>): Value => ({
  _tag: 'List',
  values
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const Obj = (fields: ReadonlyArray<ObjField<Value>>): Value => ({
  _tag: 'Obj',
  fields
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const ConstInt = (value: number): ConstValue => ({
  _tag: 'ConstInt',
  value
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const ConstFloat = (value: number): ConstValue => ({
  _tag: 'ConstFloat',
  value
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const ConstStr = (value: string): ConstValue => ({
  _tag: 'ConstStr',
  value
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const ConstBool = (value: boolean): ConstValue => ({
  _tag: 'ConstBool',
  value
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const ConstNull: ConstValue = {
  _tag: 'ConstNull'
}

/**
 * @category constructors
 * @since 0.0.1
 */
export const ConstEnum = (name: Name): ConstValue => ({
  _tag: 'ConstEnum',
  name
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const ConstList = (values: ReadonlyArray<ConstValue>): ConstValue => ({
  _tag: 'ConstList',
  values
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const ConstObj = (fields: ReadonlyArray<ObjField<ConstValue>>): ConstValue => ({
  _tag: 'ConstObj',
  fields
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const ObjField = <A>(key: Name, value: A): ObjField<A> => ({
  key,
  value
})

// -------------------------------------------------------------------------------------
// Variables
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 0.0.1
 */
export const VariableDefinition = (name: Name, type: Type, defaultValue: O.Option<ConstValue>): VariableDefinition => ({
  name,
  type,
  defaultValue
})

// -------------------------------------------------------------------------------------
// Type Reference
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 0.0.1
 */
export const NamedType = (name: Name): Type => ({
  _tag: 'NamedType',
  name
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const ListType = (type: Type): Type => ({
  _tag: 'ListType',
  type
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const NonNullType = (type: NamedType | ListType): Type => ({
  _tag: 'NonNullType',
  type
})

// -------------------------------------------------------------------------------------
// Directives
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 0.0.1
 */
export const QUERY: DirectiveLocation = 'Query'

/**
 * @category constructors
 * @since 0.0.1
 */
export const MUTATION: DirectiveLocation = 'Mutation'

/**
 * @category constructors
 * @since 0.0.1
 */
export const SUBSCRIPTION: DirectiveLocation = 'Subscription'

/**
 * @category constructors
 * @since 0.0.1
 */
export const FIELD: DirectiveLocation = 'Field'

/**
 * @category constructors
 * @since 0.0.1
 */
export const FRAGMENT_DEFINITION: DirectiveLocation = 'FragmentDefinition'

/**
 * @category constructors
 * @since 0.0.1
 */
export const FRAGMENT_SPREAD: DirectiveLocation = 'FragmentSpread'

/**
 * @category constructors
 * @since 0.0.1
 */
export const INLINE_FRAGMENT: DirectiveLocation = 'InlineFragment'

/**
 * @category constructors
 * @since 0.0.1
 */
export const SCHEMA: DirectiveLocation = 'Schema'

/**
 * @category constructors
 * @since 0.0.1
 */
export const SCALAR: DirectiveLocation = 'Scalar'

/**
 * @category constructors
 * @since 0.0.1
 */
export const OBJECT: DirectiveLocation = 'Object'

/**
 * @category constructors
 * @since 0.0.1
 */
export const FIELD_DEFINITION: DirectiveLocation = 'FieldDefinition'

/**
 * @category constructors
 * @since 0.0.1
 */
export const ARGUMENT_DEFINITION: DirectiveLocation = 'ArgumentDefinition'

/**
 * @category constructors
 * @since 0.0.1
 */
export const INTERFACE: DirectiveLocation = 'Interface'

/**
 * @category constructors
 * @since 0.0.1
 */
export const UNION: DirectiveLocation = 'Union'

/**
 * @category constructors
 * @since 0.0.1
 */
export const ENUM: DirectiveLocation = 'Enum'

/**
 * @category constructors
 * @since 0.0.1
 */
export const ENUM_VALUE: DirectiveLocation = 'EnumValue'

/**
 * @category constructors
 * @since 0.0.1
 */
export const INPUT_OBJECT: DirectiveLocation = 'InputObject'

/**
 * @category constructors
 * @since 0.0.1
 */
export const INPUT_FIELD_DEFINITION: DirectiveLocation = 'InputFieldDefinition'

/**
 * @category constructors
 * @since 0.0.1
 */
export const Directive = (name: Name, arguments_: ReadonlyArray<Argument>): Directive => ({
  name,
  arguments: arguments_
})

// -------------------------------------------------------------------------------------
// Type System
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 0.0.1
 */
export const SchemaDefinition = (
  directives: ReadonlyArray<Directive>,
  operations: RNEA.ReadonlyNonEmptyArray<OperationTypeDefinition>
): TypeSystemDefinition => ({
  _tag: 'SchemaDefinition',
  directives,
  operations
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const DirectiveDefinition = (
  name: Name,
  description: Description,
  arguments_: ArgumentsDefinition,
  directiveLocations: RNEA.ReadonlyNonEmptyArray<DirectiveLocation>
): TypeSystemDefinition => ({
  _tag: 'DirectiveDefinition',
  name,
  description,
  arguments: arguments_,
  directiveLocations
})

// -------------------------------------------------------------------------------------
// Schema
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 0.0.1
 */
export const OperationTypeDefinition = (name: Name, operation: OperationType): OperationTypeDefinition => ({
  name,
  operation
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const SchemaOperationExtension = (
  directives: ReadonlyArray<Directive>,
  operations: RNEA.ReadonlyNonEmptyArray<OperationTypeDefinition>
): SchemaExtension => ({
  _tag: 'SchemaOperationExtension',
  directives,
  operations
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const SchemaDirectivesExtension = (directives: RNEA.ReadonlyNonEmptyArray<Directive>): SchemaExtension => ({
  _tag: 'SchemaDirectivesExtension',
  directives
})

// -------------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 0.0.1
 */
export const ScalarTypeDefinition = (
  name: Name,
  description: Description,
  directives: ReadonlyArray<Directive>
): TypeSystemDefinition => ({
  _tag: 'ScalarTypeDefinition',
  name,
  description,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const ObjectTypeDefinition = (
  name: Name,
  description: Description,
  fields: ReadonlyArray<FieldDefinition>,
  implements_: ImplementsInterfaces<RA.URI>,
  directives: ReadonlyArray<Directive>
): TypeSystemDefinition => ({
  _tag: 'ObjectTypeDefinition',
  name,
  description,
  fields,
  implements: implements_,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const InterfaceTypeDefinition = (
  name: Name,
  description: Description,
  fields: ReadonlyArray<FieldDefinition>,
  directives: ReadonlyArray<Directive>
): TypeSystemDefinition => ({
  _tag: 'InterfaceTypeDefinition',
  name,
  description,
  fields,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const UnionTypeDefinition = (
  name: Name,
  description: Description,
  members: UnionMemberTypes<RA.URI>,
  directives: ReadonlyArray<Directive>
): TypeSystemDefinition => ({
  _tag: 'UnionTypeDefinition',
  name,
  description,
  members,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const EnumTypeDefinition = (
  name: Name,
  description: Description,
  values: ReadonlyArray<EnumValueDefinition>,
  directives: ReadonlyArray<Directive>
): TypeSystemDefinition => ({
  _tag: 'EnumTypeDefinition',
  name,
  description,
  values,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const InputObjectTypeDefinition = (
  name: Name,
  description: Description,
  values: ReadonlyArray<InputValueDefinition>,
  directives: ReadonlyArray<Directive>
): TypeSystemDefinition => ({
  _tag: 'InputObjectTypeDefinition',
  name,
  description,
  values,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const ScalarTypeExtension = (
  name: Name,
  directives: RNEA.ReadonlyNonEmptyArray<Directive>
): TypeSystemExtension => ({
  _tag: 'ScalarTypeExtension',
  name,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const ObjectTypeFieldsDefinitionExtension = (
  name: Name,
  fields: RNEA.ReadonlyNonEmptyArray<FieldDefinition>,
  implements_: ImplementsInterfaces<RA.URI>,
  directives: ReadonlyArray<Directive>
): TypeSystemExtension => ({
  _tag: 'ObjectTypeFieldsDefinitionExtension',
  name,
  fields,
  implements: implements_,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const ObjectTypeDirectivesExtension = (
  name: Name,
  implements_: ImplementsInterfaces<RA.URI>,
  directives: RNEA.ReadonlyNonEmptyArray<Directive>
): TypeSystemExtension => ({
  _tag: 'ObjectTypeDirectivesExtension',
  name,
  implements: implements_,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const ObjectTypeImplementsInterfacesExtension = (
  name: Name,
  implements_: ImplementsInterfaces<RNEA.URI>
): TypeSystemExtension => ({
  _tag: 'ObjectTypeImplementsInterfacesExtension',
  name,
  implements: implements_
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const InterfaceTypeFieldsDefinitionExtension = (
  name: Name,
  fields: RNEA.ReadonlyNonEmptyArray<FieldDefinition>,
  directives: ReadonlyArray<Directive>
): TypeSystemExtension => ({
  _tag: 'InterfaceTypeFieldsDefinitionExtension',
  name,
  fields,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const InterfaceTypeDirectivesExtension = (
  name: Name,
  directives: RNEA.ReadonlyNonEmptyArray<Directive>
): TypeSystemExtension => ({
  _tag: 'InterfaceTypeDirectivesExtension',
  name,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const UnionTypeUnionMemberTypesExtension = (
  name: Name,
  members: UnionMemberTypes<RNEA.URI>,
  directives: ReadonlyArray<Directive>
): TypeSystemExtension => ({
  _tag: 'UnionTypeUnionMemberTypesExtension',
  name,
  members,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const UnionTypeDirectivesExtension = (
  name: Name,
  directives: RNEA.ReadonlyNonEmptyArray<Directive>
): TypeSystemExtension => ({
  _tag: 'UnionTypeDirectivesExtension',
  name,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const EnumTypeEnumValuesDefinitionExtension = (
  name: Name,
  values: RNEA.ReadonlyNonEmptyArray<EnumValueDefinition>,
  directives: ReadonlyArray<Directive>
): TypeSystemExtension => ({
  _tag: 'EnumTypeEnumValuesDefinitionExtension',
  name,
  values,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const EnumTypeDirectivesExtension = (
  name: Name,
  directives: RNEA.ReadonlyNonEmptyArray<Directive>
): TypeSystemExtension => ({
  _tag: 'EnumTypeDirectivesExtension',
  name,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const InputObjectTypeInputFieldsDefinitionExtension = (
  name: Name,
  values: RNEA.ReadonlyNonEmptyArray<InputValueDefinition>,
  directives: ReadonlyArray<Directive>
): TypeSystemExtension => ({
  _tag: 'InputObjectTypeInputFieldsDefinitionExtension',
  name,
  values,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const InputObjectTypeDirectivesExtension = (
  name: Name,
  directives: RNEA.ReadonlyNonEmptyArray<Directive>
): TypeSystemExtension => ({
  _tag: 'InputObjectTypeDirectivesExtension',
  name,
  directives
})

// -------------------------------------------------------------------------------------
// Objects
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 0.0.1
 */
export const FieldDefinition = (
  name: Name,
  type: Type,
  description: Description,
  arguments_: ArgumentsDefinition,
  directives: ReadonlyArray<Directive>
): FieldDefinition => ({
  name,
  type,
  description,
  arguments: arguments_,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const InputValueDefinition = (
  name: Name,
  type: Type,
  description: Description,
  value: O.Option<ConstValue>,
  directives: ReadonlyArray<Directive>
): InputValueDefinition => ({
  name,
  type,
  description,
  value,
  directives
})

/**
 * @category constructors
 * @since 0.0.1
 */
export const EnumValueDefinition = (
  name: Name,
  description: Description,
  directives: ReadonlyArray<Directive>
): EnumValueDefinition => ({
  name,
  description,
  directives
})

// -------------------------------------------------------------------------------------
// destructors
// -------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------
// Document
// -------------------------------------------------------------------------------------

/**
 * @category destructors
 * @since 0.0.1
 */
export const foldExecutableDefinition = <R>(patterns: {
  readonly DefinitionOperation: (
    operation: OperationType,
    name: O.Option<Name>,
    variables: ReadonlyArray<VariableDefinition>,
    directives: ReadonlyArray<Directive>,
    selectionSet: SelectionSet
  ) => R
  readonly FragmentDefinition: (
    name: Name,
    typeCondition: TypeCondition,
    directives: ReadonlyArray<Directive>,
    selectionSet: SelectionSet
  ) => R
  readonly SelectionSet: (selection: RNEA.ReadonlyNonEmptyArray<Selection>) => R
}): ((definition: ExecutableDefinition) => R) => {
  const f = (x: ExecutableDefinition): R => {
    switch (x._tag) {
      case 'DefinitionOperation':
        return patterns.DefinitionOperation(x.operation, x.name, x.variables, x.directives, x.selectionSet)
      case 'FragmentDefinition':
        return patterns.FragmentDefinition(x.name, x.typeCondition, x.directives, x.selectionSet)
      case 'SelectionSet':
        return patterns.SelectionSet(x.selection)
      default:
        return absurd<R>(x as never)
    }
  }
  return f
}

// -------------------------------------------------------------------------------------
// Operations
// -------------------------------------------------------------------------------------

/**
 * @category destructors
 * @since 0.0.1
 */
export const foldOperation = <R>(patterns: {
  readonly Query: () => R
  readonly Mutation: () => R
  readonly Subscription: () => R
}): ((operation: OperationType) => R) => {
  const f = (x: OperationType): R => {
    switch (x) {
      case 'Query':
        return patterns.Query()
      case 'Mutation':
        return patterns.Mutation()
      case 'Subscription':
        return patterns.Subscription()
      default:
        return absurd<R>(x as never)
    }
  }
  return f
}

/**
 * @category destructors
 * @since 0.0.1
 */
export const foldOperationDefinition = <R>(patterns: {
  readonly Operation: (
    operation: OperationType,
    name: O.Option<Name>,
    variables: ReadonlyArray<VariableDefinition>,
    directives: ReadonlyArray<Directive>,
    selectionSet: SelectionSet
  ) => R
  readonly SelectionSet: (selection: RNEA.ReadonlyNonEmptyArray<Selection>) => R
}): ((operation: OperationDefinition) => R) => {
  const f = (x: OperationDefinition): R => {
    switch (x._tag) {
      case 'DefinitionOperation':
        return patterns.Operation(x.operation, x.name, x.variables, x.directives, x.selectionSet)
      case 'SelectionSet':
        return patterns.SelectionSet(x.selection)
      default:
        return absurd<R>(x as never)
    }
  }
  return f
}

// -------------------------------------------------------------------------------------
// Selection Sets
// -------------------------------------------------------------------------------------

/**
 * @category destructors
 * @since 0.0.1
 */
export const foldSelection = <R>(patterns: {
  readonly Field: (
    name: Name,
    alias: O.Option<Alias>,
    arguments_: ReadonlyArray<Argument>,
    directives: ReadonlyArray<Directive>,
    selectionSet: OptionalSelectionSet
  ) => R
  readonly FragmentSpread: (name: Name, directives: ReadonlyArray<Directive>) => R
  readonly InlineFragment: (
    typeCondition: O.Option<TypeCondition>,
    directives: ReadonlyArray<Directive>,
    selectionSet: SelectionSet
  ) => R
}): ((selection: Selection) => R) => {
  const f = (x: Selection): R => {
    switch (x._tag) {
      case 'Field':
        return patterns.Field(x.name, x.alias, x.arguments, x.directives, x.selectionSet)
      case 'FragmentSpread':
        return patterns.FragmentSpread(x.name, x.directives)
      case 'InlineFragment':
        return patterns.InlineFragment(x.typeCondition, x.directives, x.selectionSet)
      default:
        return absurd<R>(x as never)
    }
  }
  return f
}

// -------------------------------------------------------------------------------------
// Input Values
// -------------------------------------------------------------------------------------

/**
 * @category destructors
 * @since 0.0.1
 */
export const foldValue = <R>(patterns: {
  readonly Variable: (name: Name) => R
  readonly Int: (value: number) => R
  readonly Float: (value: number) => R
  readonly Str: (value: string) => R
  readonly Bool: (value: boolean) => R
  readonly Null: () => R
  readonly Enum: (name: Name) => R
  readonly List: (values: ReadonlyArray<Value>) => R
  readonly Obj: (fields: ReadonlyArray<ObjField<Value>>) => R
}): ((value: Value) => R) => {
  const f = (x: Value): R => {
    switch (x._tag) {
      case 'Variable':
        return patterns.Variable(x.name)
      case 'Int':
        return patterns.Int(x.value)
      case 'Float':
        return patterns.Float(x.value)
      case 'Str':
        return patterns.Str(x.value)
      case 'Bool':
        return patterns.Bool(x.value)
      case 'Null':
        return patterns.Null()
      case 'Enum':
        return patterns.Enum(x.name)
      case 'List':
        return patterns.List(x.values)
      case 'Obj':
        return patterns.Obj(x.fields)
      default:
        return absurd<R>(x as never)
    }
  }
  return f
}

/**
 * @category destructors
 * @since 0.0.1
 */
export const foldConstValue = <R>(patterns: {
  readonly ConstInt: (value: number) => R
  readonly ConstFloat: (value: number) => R
  readonly ConstStr: (value: string) => R
  readonly ConstBool: (value: boolean) => R
  readonly ConstNull: () => R
  readonly ConstEnum: (name: Name) => R
  readonly ConstList: (values: ReadonlyArray<ConstValue>) => R
  readonly ConstObj: (fields: ReadonlyArray<ObjField<ConstValue>>) => R
}): ((value: ConstValue) => R) => {
  const f = (x: ConstValue): R => {
    switch (x._tag) {
      case 'ConstInt':
        return patterns.ConstInt(x.value)
      case 'ConstFloat':
        return patterns.ConstFloat(x.value)
      case 'ConstStr':
        return patterns.ConstStr(x.value)
      case 'ConstBool':
        return patterns.ConstBool(x.value)
      case 'ConstNull':
        return patterns.ConstNull()
      case 'ConstEnum':
        return patterns.ConstEnum(x.name)
      case 'ConstList':
        return patterns.ConstList(x.values)
      case 'ConstObj':
        return patterns.ConstObj(x.fields)
      default:
        return absurd<R>(x as never)
    }
  }
  return f
}

// -------------------------------------------------------------------------------------
// Type Reference
// -------------------------------------------------------------------------------------

/**
 * @category destructors
 * @since 0.0.1
 */
export const foldType = <R>(patterns: {
  readonly NamedType: (name: Name) => R
  readonly ListType: (type: Type) => R
  readonly NonNullType: (type: NamedType | ListType) => R
}): ((type: Type) => R) => {
  const f = (x: Type): R => {
    switch (x._tag) {
      case 'NamedType':
        return patterns.NamedType(x.name)
      case 'ListType':
        return patterns.ListType(x.type)
      case 'NonNullType':
        return patterns.NonNullType(x.type)
      default:
        return absurd<R>(x as never)
    }
  }
  return f
}
