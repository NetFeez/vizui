/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Holds the live bindings of a DOM node: its event tracker and reactive pool.
 * @license Apache-2.0
 */

import EventTracker from './element/EventTracker.js';
import _Reactive from './reactive/Reactive.js';

import Store from '../state/Store.js';
const REGISTRY = Symbol('vizui/live.registry');

export class LiveStorage {
    private static [REGISTRY]: LiveStorage.Registry = new WeakMap();

    /** The native DOM node owning the live bindings. **/
    private readonly vNode: globalThis.Node;

    private readonly vTracker = new EventTracker();

    private readonly vReactive: LiveStorage.Reactive = new Map();

    private constructor(node: globalThis.Node) {
        this.vNode = node;
    }

    /** The event tracker of the node. **/
    public get tracker(): EventTracker { return this.vTracker; }

    /**
     * Registers a reactive under its store for teardown.
     * @param reactive - The reactive to register.
     */
    public register(reactive: _Reactive<any>): void {
        let pool = this.vReactive.get(reactive.store);
        if (!pool) this.vReactive.set(reactive.store, pool = new Set());
        pool.add(reactive);
    }

    /**
     * Unregisters the reactives bound to a store, unsubscribing matching ones.
     * @param store - The store the reactives are bound to.
     * @param filter - Optional type or predicate to select which reactives to detach.
     */
    public unregister(store: Store<any>, filter?: _Reactive.Type | _Reactive.Filter): void {
        const pool = this.vReactive.get(store);
        if (!pool) return;
        for (const reactive of [...pool]) {
            if (typeof filter === 'string' && reactive.type !== filter) continue;
            if (typeof filter === 'function' && !filter(reactive)) continue;
            reactive.unsubscribe();
            pool.delete(reactive);
        }
        if (pool.size === 0) this.vReactive.delete(store);
    }

    /**
     * Destroys the live bindings of the node: detaches event listeners,
     * unsubscribes the reactives and empties the reactive pool.
     */
    public destroy(): void {
        for (const entry of this.vTracker.entries) this.vNode.removeEventListener(entry.name, entry.wrapped || entry.listener, entry.options);
        this.vTracker.delete();

        for (const pool of this.vReactive.values()) {
            for (const reactive of pool) reactive.unsubscribe();
        }
        this.vReactive.clear();
    }

    /**
     * Gets the live storage of a DOM node, creating it on first use.
     * @param node - The native DOM node owning the live bindings.
     * @returns The live storage shared by every wrapper of the node.
     */
    public static of(node: globalThis.Node): LiveStorage {
        let live = LiveStorage[REGISTRY].get(node);
        if (!live) LiveStorage[REGISTRY].set(node, live = new LiveStorage(node));
        return live;
    }
}

export namespace LiveStorage {
    /** The registry of live storages keyed by native DOM node. **/
    export type Registry = WeakMap<globalThis.Node, LiveStorage>;

    /** The reactive pool of a node, grouped by store. **/
    export type Reactive = Map<Store<any>, Set<_Reactive<any>>>;
}

export default LiveStorage;