/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Typed reactive store with subscription and derived selection.
 * @license Apache-2.0
 */

import { EventsEmitter } from '../events/Events.js';

export class Store<State> implements Store.IsReadOnly<State> {
    /** The current state of the store. **/
    private vState: State;
    private vEmitter: EventsEmitter<Store.EventMap<State>>;

    /** Whether the store was destroyed and can no longer be used. **/
    private vDestroyed = false;

    /** Whether the store is an intermediate store. **/
    private vIntermediate: boolean;

    /**
     * Creates a store holding an initial state.
     * @param initialState - The initial state.
     * @param internal - Whether the store is an intermediate store.
     */
    public constructor(initialState: State, internal: boolean = false) {
        this.vState = initialState;
        this.vIntermediate = internal;
        this.vEmitter = new EventsEmitter();
    }

    /** The current state. **/
    public get state(): Readonly<State> { return this.vState; }

    /**
     * Sets a new state, notifying subscribers.
     * @param state - The new state.
     * @returns This store, for chaining.
     */
    public set(state: State): this {
        this.assertNotDestroyed();
        const last = this.vState;
        this.vState = state;
        if (!this.vIntermediate) this.vEmitter.emit('change', this.vState, last);
        else this.vEmitter.emit('internal:change', this.vState, last);
        return this;
    }

    /**
     * Sets a new state only if it differs from the current state, notifying subscribers.
     * @param state - The action producing the new state from the previous one.
     * @returns This store, for chaining.
     */
    public smartSet(state: Store.StateAction<State>): this {
        this.assertNotDestroyed();
        const value = state(this.vState);
        if (!Object.is(value, this.vState)) this.set(value);
        return this;
    }

    /**
     * Updates the state with a deep partial patch, merging it into the current state.
     * @param patch - The partial state to merge.
     * @returns This store, for chaining.
     */
    public deepUpdate(patch: Store.DeepPartial<State>): this {
        this.assertNotDestroyed();
        return this.smartSet((previous) => Store.deepMerge(previous, patch));
    }

    /**
     * Subscribes to state changes.
     * @param listener - The listener invoked with the new state.
     * @returns An unsubscribe function.
     */
    public subscribe(listener: Store.Listener<State>): Store.Unsubscribe {
        this.assertNotDestroyed();
        this.vEmitter.on('change', listener);
        return () => this.vEmitter.off('change', listener);
    }

    /**
     * Derives a store that projects a slice of this store's state.
     * @param selector - The projection function.
     * @param equal - The equality function to determine if the selected value has changed.
     * @returns A derived store.
     */
    public select<Selected>(selector: Store.Selector<State, Selected>, equal: Store.Equal<Selected> = Object.is): Store<Selected> {
        this.assertNotDestroyed();
        const derived = Store.create(selector(this.vState));
        const handler = (state: State): void => {
            const selected = selector(state);
            if (!equal(selected, derived.state)) derived.set(selected);
        }
        this.subscribe(handler);
        this.vEmitter.once('destroy', () => derived.destroy());
        derived.vEmitter.once('destroy', () => this.vEmitter.off('change', handler));
        return derived;
    }

    /**
     * Creates a derived store that can update the parent store based on changes to the selected slice.
     * @param selector - The projection function to select a slice of the state.
     * @param updater - The function to update the parent state based on the selected slice.
     * @param equal - The equality function to determine if the selected value has changed.
     * @returns A derived store that can update the parent store.
     */
    public bind<Selected>(
        selector: Store.Selector<State, Selected>,
        updater: Store.Updater<State, Selected>,
        equal: Store.Equal<Selected> = Object.is
    ): Store<Selected> {
        const derived = new Store<Selected>(selector(this.vState), true);
        const parentHandler = (state: State): void => {
            const selected = selector(state);
            if (!equal(selected, derived.state)) derived.set(selected);
        };
        const derivedHandler = (selected: Selected): void => {
            this.smartSet((state) => updater(selected, state));
        };
        this.subscribe(parentHandler);
        derived.vEmitter.on('internal:change', derivedHandler);
        this.vEmitter.once('destroy', () => derived.destroy());
        derived.vEmitter.once('destroy', () => this.vEmitter.off('change', parentHandler));
        return derived;
    }

    /** Destroys this store, notifying subscribers and preventing further use. **/
    public destroy(): void {
        if (this.vDestroyed) throw new Error('Store is already destroyed');
        this.vDestroyed = true;
        this.vEmitter.emit('destroy');
        this.vEmitter.offAll('change');
        this.vEmitter.offAll('internal:change');
    }

    /**
     * Asserts that this store is not destroyed.
     * @throws When the store is destroyed.
     */
    private assertNotDestroyed(): asserts this is Store<State> { if (this.vDestroyed) throw new Error('Store is destroyed'); }

    /**
     * Creates a store holding an initial state.
     * @param initialState - The initial state.
     * @returns A new store.
     */
    public static create<State>(initialState: State): Store<State> { return new Store(initialState); }

    /**
     * Merges a deep partial source into a target without mutating either, producing a new value.
     * @param target - The value to merge into.
     * @param source - The partial patch to merge.
     * @returns The merged value.
     */
    private static deepMerge<Value>(target: Value, source: Store.DeepPartial<Value>): Value {
        const patch = source as Record<string, unknown>;
        const result = Array.isArray(target) ? [...target] : { ...(target as object) };
        const record = result as Record<string, unknown>;
        for (const key in patch) {
            const value = patch[key];
            if (value && typeof value === 'object') {
                const current = record[key];
                record[key] = Store.deepMerge<unknown>(current && typeof current === 'object' ? current : {}, value);
            } else record[key] = value;
        }
        return result as Value;
    }
}

export namespace Store {
    /** The events emitted by a store. **/
    export type EventMap<State> = {
        /** The state changed. **/
        change: [state: State, last: State];
        'internal:change': [state: State, last: State];

        /** The store was destroyed. **/
        destroy: [];
    };

    export interface IsReadOnly<State> {
        readonly state: State;
        subscribe(listener: Store.Listener<State>): Store.Unsubscribe;
        select<Selected>(selector: Store.Selector<State, Selected>, equal?: Store.Equal<Selected>): Store<Selected>;
    }

    /** A recursive partial of a value. **/
    export type DeepPartial<Value> = Value extends Function ? Value
        : Value extends object ? { [Key in keyof Value]?: DeepPartial<Value[Key]> }
        : Value;

    /** The equality function used to compare derived values. **/
    export type Equal<State> = (a: State, b: State) => boolean;

    /** The function returned by subscriptions to stop listening. **/
    export type Unsubscribe = () => void;

    /** The projection of a store state into a slice. **/
    export type Selector<State, Selected> = (state: State) => Selected;

    export type Updater<State, Selected> = (selected: Selected, state: State) => State;

    /** The listener notified on state changes. **/
    export type Listener<State> = (state: State) => void;

    /** The action producing a new state from the previous one. **/
    export type StateAction<State> = (prev: State) => State;
}
export default Store;
