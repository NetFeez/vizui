/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Scoped context for providing shared values down a tree.
 * @license Apache-2.0
 */

export class Context<Value> {
    /** The unique key the context reads and writes on scopes. **/
    private readonly vKey: symbol;

    /**
     * Creates a new context key with an optional default value.
     * @param defaultValue - The value used when no provider is present.
     * @returns The created context.
     */
    public static create<Value>(defaultValue?: Value): Context<Value> { return new Context(defaultValue); }

    /**
     * Creates a context with an optional default value.
     * @param vDefault - The value used when no provider is present.
     */
    public constructor(
        private readonly vDefault?: Value
    ) { this.vKey = Symbol('vizui.context'); }

    /**
     * Creates a provider scope that supplies a value.
     * @param value - The value to provide.
     * @returns A scope handle.
     */
    public provide(value: Value): Context.Scope<Value> {
        const scope: Context.Scope<Value> = {
            [this.vKey]: value,
            close: (): void => { delete scope[this.vKey]; }
        };
        return scope;
    }

    /**
     * Reads the value provided by a given scope, falling back to the default.
     * @param scope - The scope from which to read.
     * @returns The provided or default value.
     */
    public consume(scope: Context.Scope<Value>): Value {
        return scope[this.vKey] ?? this.vDefault as Value;
    }
}

export namespace Context {
    /** The record a scope uses to expose provided values. **/
    export interface Provider<Value> {
        [key: symbol]: Value;
    }

    /** A provider scope with an explicit close handle. **/
    export interface Scope<Value> extends Provider<Value> {
        /** Removes the provided value from the scope. **/
        close(): void;
    }
}
export default Context;
