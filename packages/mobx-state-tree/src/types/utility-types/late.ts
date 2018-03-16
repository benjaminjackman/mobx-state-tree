import {
    fail,
    INode,
    Type,
    IType,
    IContext,
    IValidationResult,
    TypeFlags,
    isType
} from "../../internal"

export class Late<C, S, T> extends Type<C, S, T> {
    readonly definition: () => IType<C, S, T>
    private _subType: IType<C, S, T> | null = null

    get flags() {
        return this.subType.flags | TypeFlags.Late
    }

    get shouldAttachNode() {
        return this.subType.shouldAttachNode
    }

    get subType(): IType<C, S, T> {
        if (this._subType === null) {
            this._subType = this.definition()
        }
        return this._subType
    }

    constructor(name: string, definition: () => IType<C, S, T>) {
        super(name)
        this.definition = definition
    }

    instantiate(parent: INode | null, subpath: string, environment: any, snapshot: any): INode {
        return this.subType.instantiate(parent, subpath, environment, snapshot)
    }

    reconcile(current: INode, newValue: any): INode {
        return this.subType.reconcile(current, newValue)
    }

    describe() {
        return this.subType.name
    }

    isValidSnapshot(value: any, context: IContext): IValidationResult {
        return this.subType.validate(value, context)
    }

    isAssignableFrom(type: IType<any, any, any>) {
        return this.subType.isAssignableFrom(type)
    }
}

export type ILateType<C, S, T> = () => IType<C, S, T>

export function late<S = any, T = any>(type: ILateType<C, S, T>): IType<C, S, T>
export function late<S = any, T = any>(name: string, type: ILateType<C, S, T>): IType<C, S, T>
/**
 * Defines a type that gets implemented later. This is useful when you have to deal with circular dependencies.
 * Please notice that when defining circular dependencies TypeScript isn't smart enough to inference them.
 * You need to declare an interface to explicit the return type of the late parameter function.
 *
 * @example
 *  interface INode {
 *       childs: INode[]
 *  }
 *
 *   // TypeScript is'nt smart enough to infer self referencing types.
 *  const Node = types.model({
 *       childs: types.optional(types.array(types.late<any, INode>(() => Node)), [])
 *  })
 *
 * @export
 * @alias types.late
 * @template S
 * @template T
 * @param {string} [name] The name to use for the type that will be returned.
 * @param {ILateType<C, S, T>} type A function that returns the type that will be defined.
 * @returns {IType<C, S, T>}
 */
export function late<C, S, T>(nameOrType: any, maybeType?: ILateType<C, S, T>): IType<C, S, T> {
    const name = typeof nameOrType === "string" ? nameOrType : `late(${nameOrType.toString()})`
    const type = typeof nameOrType === "string" ? maybeType : nameOrType
    // checks that the type is actually a late type
    if (process.env.NODE_ENV !== "production") {
        if (!(typeof type === "function" && type.length === 0))
            fail(
                "Invalid late type, expected a function with zero arguments that returns a type, got: " +
                    type
            )
    }
    return new Late<C, S, T>(name, type)
}

export function isLateType(type: any): type is Late<any, any, any> {
    return isType(type) && (type.flags & TypeFlags.Late) > 0
}
