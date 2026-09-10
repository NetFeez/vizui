/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Observes mutation and intersection events on an element.
 * @license Apache-2.0
 */

import Events from '../../events/Events.js';

export class DomObserver<T extends HTMLElement = HTMLElement> extends Events<DomObserver.EventMap<T>> {
    private static vShared: DomObserver.Shared | null = null;

    private vMutationRegistered = false;
    private vIntersectionRegistered = false;
    private vWasConnected: boolean;

    /**
     * Returns or creates the shared state container.
     * @returns The shared state.
     */
    private static get shared(): DomObserver.Shared {
        return this.vShared ??= {
            mutation: null,
            intersection: null,
            mutationObservers: new Map(),
            intersectionObservers: new Map()
        };
    }

    /**
     * Returns the shared MutationObserver, creating it lazily on first use.
     * @returns The MutationObserver.
     */
    private static getMutationObserver(): MutationObserver {
        const shared = this.shared;
        if (!shared.mutation) {
            shared.mutation = new MutationObserver((records) => {
                for (const record of records) switch (record.type) {
                    case 'childList': { DomObserver.processChildList(shared, record); break; }
                    case 'attributes': {
                        if (!(record.target instanceof globalThis.HTMLElement)) break;
                        const observers = shared.mutationObservers.get(record.target);
                        if (!observers) break;
                        const { attributeName: name, oldValue: old } = record;
                        if (!name) break;
                        const value = record.target.getAttribute(name);
                        for (const observer of observers) observer.emit('attribute', observer.root, name, value, old);
                        break;
                    }
                }
            });
            shared.mutation.observe(document, { subtree: true, childList: true, attributes: true, attributeOldValue: true });
        }
        return shared.mutation;
    }

    /**
     * Processes a childList mutation record, discovering affected observers via direct lookup or subtree scan.
     * @param shared - The shared observer state.
     * @param record - The mutation record to process.
     *
     * @remarks
     * Affected observers are collected into a Set before processing to avoid
     * duplicates and to decouple discovery from emission. The `vWasConnected`
     * flag on each observer is then compared against `root.isConnected` to
     * detect add/remove transitions.
     */
    private static processChildList(shared: DomObserver.Shared, record: MutationRecord): void {
        const affected = new Set<DomObserver<any>>();
        DomObserver.collectAffected(shared, record.addedNodes, affected);
        DomObserver.collectAffected(shared, record.removedNodes, affected);
        for (const observer of affected) DomObserver.updateConnection(observer);
    }

    /**
     * Discovers observers affected by a NodeList of added or removed nodes.
     * @param shared - The shared observer state.
     * @param nodes - The NodeList to scan (addedNodes or removedNodes).
     * @param affected - The Set to collect affected observers into.
     *
     * @remarks
     * For each element node: O(1) direct root lookup via `Map.get()`, then a
     * subtree fallback that checks `node.contains(root)` for every registered
     * root. The Set guarantees no observer is processed more than once.
     *
     * The direct lookup does NOT short-circuit the subtree scan because a node
     * that is itself a registered root may also contain other registered roots.
     */
    private static collectAffected(shared: DomObserver.Shared, nodes: NodeList, affected: Set<DomObserver<any>>): void {
        for (const node of nodes) {
            if (!(node instanceof HTMLElement)) continue;
            const direct = shared.mutationObservers.get(node);
            if (direct) for (const o of direct) affected.add(o);
            for (const [root, observers] of shared.mutationObservers) {
                if (node !== root && node.contains(root)) for (const o of observers) affected.add(o);
            }
        }
    }

    /**
     * Checks the connection state of an observer's root and emits add/remove on transition.
     * @param observer - The observer to update.
     */
    private static updateConnection(observer: DomObserver<any>): void {
        const isConnected = observer.root.isConnected;
        if (observer.vWasConnected && !isConnected) observer.emit('remove', observer.root);
        else if (!observer.vWasConnected && isConnected) observer.emit('add', observer.root);
        observer.vWasConnected = isConnected;
    }

    /**
     * Returns the shared IntersectionObserver, creating it lazily on first use.
     * @returns The IntersectionObserver.
     */
    private static getIntersectionObserver(): IntersectionObserver {
        const shared = this.shared;
        if (!shared.intersection) {
            shared.intersection = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    const observers = shared.intersectionObservers.get(entry.target);
                    if (!observers) continue;
                    for (const observer of observers) {
                        if (entry.isIntersecting) observer.emit('visible', observer.root);
                        else observer.emit('hidden', observer.root);
                    }
                }
            });
        }
        return shared.intersection;
    }

    /**
     * Creates an observer bound to a root element.
     * @param root - The observed element.
     */
    public constructor(
        public readonly root: T
    ) { super();
        this.vWasConnected = this.root.isConnected;
    }

    /**
     * Counts the total of mutation event listeners.
     * @returns The number of mutation event listeners.
     */
    private get mutationCount(): number { return this.eventCount('add') + this.eventCount('remove') + this.eventCount('attribute'); }

    /**
     * Counts the total of intersection event listeners.
     * @returns The number of intersection event listeners.
     */
    private get intersectionCount(): number { return this.eventCount('visible') + this.eventCount('hidden'); }

    /**
     * Registers the root element with the shared mutation observer.
     */
    private registerMutation(): void {
        if (this.vMutationRegistered) return;
        const shared = DomObserver.shared;
        let observers = shared.mutationObservers.get(this.root);
        if (!observers) shared.mutationObservers.set(this.root, observers = new Set());
        observers.add(this);
        this.vMutationRegistered = true;
        DomObserver.getMutationObserver();
    }

    /**
     * Unregisters the root element from the shared mutation observer when no listeners remain.
     */
    private unregisterMutation(): void {
        if (!this.vMutationRegistered) return;
        if (this.mutationCount > 0) return;
        const shared = DomObserver.shared;
        const observers = shared.mutationObservers.get(this.root);
        if (observers) {
            observers.delete(this);
            if (observers.size === 0) shared.mutationObservers.delete(this.root);
        }
        this.vMutationRegistered = false;
        if (shared.mutationObservers.size === 0 && shared.mutation) {
            shared.mutation.disconnect();
            shared.mutation = null;
        }
    }

    /**
     * Registers the root element with the shared intersection observer.
     */
    private registerIntersection(): void {
        if (this.vIntersectionRegistered) return;
        const shared = DomObserver.shared;
        let observers = shared.intersectionObservers.get(this.root);
        if (!observers) shared.intersectionObservers.set(this.root, observers = new Set());
        observers.add(this);
        this.vIntersectionRegistered = true;
        DomObserver.getIntersectionObserver().observe(this.root);
    }

    /**
     * Unregisters the root element from the shared intersection observer when no listeners remain.
     */
    private unregisterIntersection(): void {
        if (!this.vIntersectionRegistered) return;
        if (this.intersectionCount > 0) return;
        const shared = DomObserver.shared;
        const observers = shared.intersectionObservers.get(this.root);
        if (observers) {
            observers.delete(this);
            if (observers.size === 0) {
                shared.intersection?.unobserve(this.root);
                shared.intersectionObservers.delete(this.root);
            }
        }
        this.vIntersectionRegistered = false;
        if (shared.intersectionObservers.size === 0 && shared.intersection) {
            shared.intersection.disconnect();
            shared.intersection = null;
        }
    }

    /**
     * Forcefully unregisters from the shared mutation observer regardless of listener count.
     */
    private forceUnregisterMutation(): void {
        if (!this.vMutationRegistered) return;
        this.vMutationRegistered = false;
        const shared = DomObserver.vShared;
        if (!shared) return;
        const observers = shared.mutationObservers.get(this.root);
        if (observers) {
            observers.delete(this);
            if (observers.size === 0) shared.mutationObservers.delete(this.root);
        }
        if (shared.mutationObservers.size === 0 && shared.mutation) {
            shared.mutation.disconnect();
            shared.mutation = null;
        }
    }

    /**
     * Forcefully unregisters from the shared intersection observer regardless of listener count.
     */
    private forceUnregisterIntersection(): void {
        if (!this.vIntersectionRegistered) return;
        this.vIntersectionRegistered = false;
        const shared = DomObserver.vShared;
        if (!shared) return;
        const observers = shared.intersectionObservers.get(this.root);
        if (observers) {
            observers.delete(this);
            if (observers.size === 0) {
                shared.intersection?.unobserve(this.root);
                shared.intersectionObservers.delete(this.root);
            }
        }
        if (shared.intersectionObservers.size === 0 && shared.intersection) {
            shared.intersection.disconnect();
            shared.intersection = null;
        }
    }

    /**
     * Initializes the appropriate shared observer for the given event type.
     * @param type - The event type.
     */
    private initObserver(type: DomObserver.EventNames<T>): void {
        if (this.isMutationEvent(type)) this.registerMutation();
        else if (this.isIntersectionEvent(type)) this.registerIntersection();
    }

    /**
     * Unregisters from the appropriate shared observer when listeners drop to zero.
     * @param type - The event type.
     */
    private checkAndUnregister(type: string): void {
        if (this.isMutationEvent(type)) this.unregisterMutation();
        else if (this.isIntersectionEvent(type)) this.unregisterIntersection();
    }

    /**
     * Checks whether the event type is a mutation event.
     * @param type - The type of event.
     * @returns Whether the type belongs to the mutation channel.
     */
    private isMutationEvent(type: string): type is keyof DomObserver.EventMap<T> {
        return type === 'add' || type === 'remove' || type === 'attribute';
    }

    /**
     * Checks whether the event type is an intersection event.
     * @param type - The type of event.
     * @returns Whether the type belongs to the intersection channel.
     */
    private isIntersectionEvent(type: string): type is keyof DomObserver.EventMap<T> {
        return type === 'visible' || type === 'hidden';
    }

    /** Overrides emit to check for unregistration after once listeners fire. **/
    protected override emit<E extends string & keyof DomObserver.EventMap<T>>(...event: [name: E, ...args: DomObserver.EventMap<T>[E]]): void {
        super.emit(...event);
        this.checkAndUnregister(event[0]);
    }

    public override on<E extends DomObserver.EventNames<T>>(type: E, listener: DomObserver.EventListener<T, E>): this {
        super.on(type, listener);
        this.initObserver(type);
        return this;
    }

    public override once<E extends DomObserver.EventNames<T>>(type: E, listener: DomObserver.EventListener<T, E>): this {
        super.once(type, listener);
        this.initObserver(type);
        return this;
    }

    public override off<E extends DomObserver.EventNames<T>>(type: E, listener: DomObserver.EventListener<T, E>): this {
        super.off(type, listener);
        this.checkAndUnregister(type);
        return this;
    }

    public override offOnce<E extends DomObserver.EventNames<T>>(type: E, listener: DomObserver.EventListener<T, E>): this {
        super.offOnce(type, listener);
        this.checkAndUnregister(type);
        return this;
    }

    public override offAll(type: DomObserver.EventNames<T>): this {
        super.offAll(type);
        this.checkAndUnregister(type);
        return this;
    }

    public override offAllOnce(type: DomObserver.EventNames<T>): this {
        super.offAllOnce(type);
        this.checkAndUnregister(type);
        return this;
    }

    /**
     * Disconnects all observers and clears all listeners.
     */
    public destroy(): void {
        for (const type of ['add', 'remove', 'attribute', 'visible', 'hidden'] as const) {
            super.offAll(type);
            super.offAllOnce(type);
        }
        this.forceUnregisterMutation();
        this.forceUnregisterIntersection();
    }
}

export namespace DomObserver {
    export type MutationEventMap<T extends HTMLElement> = {
        add: [root: T];
        remove: [root: T];
        attribute: [root: T, name: string, value: string | null, old: string | null];
    };
    export type IntersectionEventMap<T extends HTMLElement> = {
        visible: [root: T];
        hidden: [root: T];
    };
    export type EventMap<T extends HTMLElement> = MutationEventMap<T> & IntersectionEventMap<T>;
    export type EventNames<T extends HTMLElement> = keyof EventMap<T>;
    export type EventListener<T extends HTMLElement, E extends EventNames<T>> = Events.Listener<EventMap<T>[E]>;

    export interface Shared {
        mutation: MutationObserver | null;
        intersection: IntersectionObserver | null;
        mutationObservers: Map<HTMLElement, Set<DomObserver<any>>>;
        intersectionObservers: Map<Element, Set<DomObserver<any>>>;
    }
}
export default DomObserver;
