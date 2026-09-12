/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Wraps a DOM Node with a fluent, typed API.
 * @license Apache-2.0
 */

import { NODE, APPENDABLE } from '../symbols.js';

import EventTracker from './EventTracker.js';
import Store from '../state/Store.js';

const SUBSCRIPTION_MAP = Symbol('vizui.node/subscriptions');
const TRACKER_MAP = Symbol('vizui.node/tracker');

export class Node<T extends globalThis.Node = globalThis.Node> implements Node.IsAppendable {
    private static [SUBSCRIPTION_MAP]: Node.Storage.Reactivity = new WeakMap();
    private static [TRACKER_MAP]: Node.Storage.Tracking = new WeakMap();

    /**
     * When true, every reactive child group is wrapped in opening/closing `Comment`
     * markers so the group boundaries are visible while debugging. Defaults to false.
     **/
    public static debugGroups = false;

    public readonly [APPENDABLE] = true;
    public readonly [NODE] = true;

    /** The wrapped DOM node. **/
    public readonly root: T;

    /** The event tracker for this node. **/
    protected eventTracker: Node.Storage.Tracking.Entry;

    /** The reactive map for this node. **/
    protected reactiveSubscriptions: Node.Storage.Reactivity.Entry;

    /**
     * Wraps an existing DOM node.
     * @param node - The node to wrap.
     */
    public constructor(node: T) {
        if (!Node.isNative(node)) throw new Error('the node is not a Node');
        this.root = node;

        let tracker = Node[TRACKER_MAP].get(this.root);
        if (!tracker) Node[TRACKER_MAP].set(this.root, tracker = new EventTracker());
        this.eventTracker = tracker;

        let reactive = Node[SUBSCRIPTION_MAP].get(this.root);
        if (!reactive) Node[SUBSCRIPTION_MAP].set(this.root, reactive = new WeakMap());
        this.reactiveSubscriptions = reactive;
    }

    /** Whether the node is attached to the document. **/
    public get isConnected(): boolean { return this.root.isConnected; }

    /** The parent node of this node. **/
    public get parent(): globalThis.Node | null { return this.root.parentNode; }

    /** The child nodes of this node. **/
    public get childNodes(): NodeListOf<globalThis.ChildNode> { return this.root.childNodes as NodeListOf<globalThis.ChildNode>; }

    /** The first child node of this node. **/
    public get firstChild(): globalThis.Node | null { return this.root.firstChild; }

    /** The last child node of this node. **/
    public get lastChild(): globalThis.Node | null { return this.root.lastChild; }

    /**
     * Appends one or more children to this node.
     * @param childList - The nodes to append.
     * @returns This node, for chaining.
     *
     * @example
     * ```ts
     * const parent = new Node(document.createElement('div'));
     * const child = new Node(document.createElement('span'));
     *
     * parent.append(child);
     * ```
     */
    public append(...childList: Node.NodeValueType[]): this {
        const rawList = childList.flatMap((node) => {
            if (Node.isAppendable(node)) return [Node.getNativeNode(node)];
            if (node instanceof Store) return this.createReactive(node, this.root);
            return [new Text(String(node))];
        });
        for (const child of rawList) this.root.appendChild(child);
        return this;
    }

    /**
     * Appends this node to a parent.
     * @param parent - The parent node.
     * @returns This node, for chaining.
     *
     * @example
     * ```ts
     * const parent = new Node(document.createElement('div'));
     * const child = new Node(document.createElement('span'));
     *
     * child.appendTo(parent);
     * ```
     */
    public appendTo(parent: Node.NodeType): this {
        const raw = Node.getNativeNode(parent);
        raw.appendChild(this.root);
        return this;
    }

    /**
     * Replaces this node with another node.
     * @param newNode - The node that will replace this one.
     * @returns This node, for chaining.
     */
    public replaceWith(newNode: Node.NodeValueType): this {
        if (!this.root.parentNode) throw new Error('the node has no parent');

        if (newNode instanceof Store) {
            const parent = this.root.parentNode;
            const group = this.createReactive(newNode, parent);
            const reference = this.root.nextSibling;
            parent.removeChild(this.root);
            for (const node of group) parent.insertBefore(node, reference);
            return this;
        }

        let raw: globalThis.Node;
        if (Node.isAppendable(newNode)) raw = Node.getNativeNode(newNode);
        else raw = new Text(String(newNode));

        this.root.parentNode.replaceChild(raw, this.root);
        return this;
    }

    /**
     * Removes this node from the DOM.
     * @returns This node, for chaining.
     */
    public remove(): this {
        if (!this.root.parentNode) return this;
        this.root.parentNode.removeChild(this.root);
        return this;
    }

    /**
     * Removes one or more children from this node.
     * @param childList - The nodes to remove.
     * @returns This node, for chaining.
     */
    public removeChild(...childList: Node.NodeType[]): this {
        const rawList = childList.map(Node.getNativeNode);
        for (const child of rawList) this.root.removeChild(child);
        return this;
    }

    /**
     * Checks whether this node contains another node.
     * @param child - The node to check.
     * @returns True if this node contains the given node, false otherwise.
     */
    public contains(child: Node.NodeType): boolean {
        const raw = Node.getNativeNode(child);
        return this.root.contains(raw);
    }

    /**
     * Adds an event listener to this node and tracks it for teardown.
     * @param name - The name of the event.
     * @param listener - The callback to execute.
     * @param options - The listener options.
     * @returns This node, for chaining.
     */
    public on(name: string, listener: Node.Listener<T>, options?: EventTracker.Options): this {
        const wrapped = this.wrapListener(listener);
        this.eventTracker.add({ name: name, listener, wrapped, options });
        this.root.addEventListener(name, wrapped, options);
        return this;
    }

    /**
     * Adds a one-time event listener to this node and tracks it for teardown.
     * @param name - The name of the event.
     * @param listener - The callback to execute.
     * @param options - The listener options.
     * @returns This node, for chaining.
     */
    public once(name: string, listener: Node.Listener<T>, options?: EventTracker.Options): this {
        const listenerOptions: EventTracker.Options = !options || typeof options === 'boolean'
            ? { once: true }
            : { ...options, once: true };

        const wrapped = this.wrapListener(listener);
        this.eventTracker.add({ name: name, listener, wrapped, options: listenerOptions });
        this.root.addEventListener(name, wrapped, listenerOptions);
        return this;
    }

    /**
     * Removes a previously added event listener.
     * @param name - The name of the event.
     * @param listener - The listener to remove.
     * @param options - The listener options.
     * @returns This node, for chaining.
     */
    public off(name: string, listener: Node.Listener<T>, options?: EventTracker.Options): this {
        const entry = this.eventTracker.find({ name, listener, options });
        if (!entry) return this;
        this.root.removeEventListener(name, entry.wrapped || entry.listener, options);
        this.eventTracker.delete(entry);
        return this;
    }

    /**
     * Removes a previously added one-time event listener.
     * @param name - The name of the event.
     * @param listener - The listener to remove.
     * @param options - The listener options.
     * @returns This node, for chaining.
     */
    public offOnce(name: string, listener: Node.Listener<T>, options?: EventTracker.Options): this {
        const listenerOptions: EventTracker.Options = !options || typeof options === 'boolean'
            ? { once: true }
            : { ...options, once: true };
        this.off(name, listener, listenerOptions);
        return this;
    }

    /**
     * Removes all tracked event listeners registered on this node.
     * @returns This node, for chaining.
     *
     * @remarks
     * This removes every listener added through {@link on} or {@link once}.
     */
    public unbindAll(): this {
        for (const entry of this.eventTracker.entries) this.root.removeEventListener(entry.name, entry.wrapped || entry.listener, entry.options);
        this.eventTracker.delete();
        return this;
    }

    /**
     * Creates a reactive node based on the provided store.
     * @param store - The store to bind to the node.
     * @returns This node, for chaining.
     */
    public offReactive(store: Store<any>, filter?: Node.Subscription.Type | Node.Subscription.Filter): this {
        const subscriptions = this.reactiveSubscriptions.get(store);
        if (subscriptions) subscriptions.forEach((unsubscribe) => {
            if (typeof filter === 'string' && unsubscribe.type !== filter) return;
            if (typeof filter === 'function' && !filter(unsubscribe)) return;
            unsubscribe.unsubscribe();
        });
        this.reactiveSubscriptions.delete(store);
        return this;
    }

    /**
     * Removes all reactive subscriptions from this node.
     * @returns This node, for chaining.
     */
    private wrapListener(listener: Node.Listener<T>): Node.Listener<T> {
    if (typeof listener === 'function') return (...args) => listener.call(this, ...args);
        return {
            ...listener,
            handleEvent: (event) => listener.handleEvent.call(this, event)
        };
    }

    /**
     * Creates the reactive child group of a store, bound to a parent.
     * @param store - The store to bind to the group.
     * @param parent - The parent the group will be appended to.
     * @returns The DOM nodes representing the current state of the store.
     *
     * @remarks
     * The group is a set of contiguous siblings that is fully re-rendered whenever
     * the store changes (no keyed diffing: update the whole state with `set()`).
     * Position is kept via the live reference to the next sibling, so an empty
     * array inside the group keeps its slot on refill; a store that starts empty
     * with no following sibling degrades to appending at the end of the parent.
     * When {@link debugGroups} is enabled, the group is wrapped in opening/closing
     * `Comment` markers so boundaries are visible while debugging.
     */
    private createReactive(store: Store<unknown>, parent: globalThis.Node): globalThis.Node[] {
        const build = (value: unknown): globalThis.Node[] => {
            const nodes = Node.toNodes(value);
            return Node.debugGroups
                ? [new Comment('[vizui:group]'), ...nodes, new Comment('[/vizui:group]')]
                : nodes;
        };

        let group = build(store.state);
        let anchor: globalThis.Node | null = null;

        const render = (value: unknown): void => {
            if (group.length > 0) anchor = group[group.length - 1].nextSibling;
            for (const node of group) node.parentNode?.removeChild(node);
            group = build(value);
            for (const node of group) parent.insertBefore(node, anchor);
        }

        const unsubscribe = store.subscribe(render);
        let subscriptions = this.reactiveSubscriptions.get(store)
        if (!subscriptions) this.reactiveSubscriptions.set(store, subscriptions = new Set());
        subscriptions.add({ type: 'child', unsubscribe });
        return group;
    }

    /**
     * Checks whether a given object is a Node wrapper.
     * @param object - The object to check.
     * @returns True if the object is a Node wrapper, false otherwise.
     */
    public static isNode(object: unknown): object is Node<any> {
        return object instanceof Node;
    }

    /**
     * Checks whether a given object is a DOM node.
     * @param object - The object to check.
     * @returns True if the object is a DOM node, false otherwise.
     */
    public static isNative(object: unknown): object is globalThis.Node {
        return object instanceof globalThis.Node;
    }

    /**
     * Checks whether a given object is appendable (has a root DOM node).
     * @param object - The object to check.
     * @returns True if the object is appendable, false otherwise.
     */
    public static isAppendable(object: unknown): object is Node.NodeType {
        if (typeof object !== 'object' || object === null) return false;
        return APPENDABLE in object || object instanceof globalThis.Node;
    }

    /**
     * Gets the native DOM node from a Node wrapper or appendable object.
     * @param node - The node to unwrap.
     * @returns The raw DOM node.
     */
    public static getNativeNode(node: Node.NodeType): globalThis.Node {
        if (Node.isNative(node)) return node;
        if (Node.isNode(node)) return node.root;
        if (Node.isAppendable(node)) return Node.getNativeNode(node.root);
        throw new Error('The node is not a valid DOM node.');
    }
    
    /**
     * Resolves a store state (array or single value) to a flat list of DOM nodes.
     * @param value - The state value to resolve.
     * @returns Raw DOM nodes for render: appendables are unwrapped, primitives become text.
     */
    private static toNodes(value: unknown): globalThis.Node[] {
        const list = Array.isArray(value) ? value : [value];
        return list.flatMap((item) => {
            if (Array.isArray(item)) return Node.toNodes(item);
            if (Node.isAppendable(item)) return [Node.getNativeNode(item)];
            return [new Text(String(item))];
        });
    }
}

export namespace Node {
    export import Tracker = EventTracker;
    export namespace Subscription {
        export type Type = 'child' | 'attribute' | (string & {});
        export type Filter = (subscription: Subscription) => boolean;
    }
    export interface Subscription {
        type: Subscription.Type;
        unsubscribe: Store.Unsubscribe;
    };
    export namespace Storage {
        export namespace Reactivity {
            export type Subscriptions = Set<Subscription>;
            export type Entry = WeakMap<Store<any>, Subscriptions>;
        };
        export namespace Tracking {
            export type Entry = EventTracker;
        }
        export type Reactivity = WeakMap<globalThis.Node, Storage.Reactivity.Entry>;
        export type Tracking = WeakMap<globalThis.Node, Tracking.Entry>;
    }
    export namespace Listener {
        export interface Listener<T extends globalThis.Node = globalThis.Node> {
            (this: Node<T>, event: Event): void;
        }
        export interface ListenerObject<T extends globalThis.Node = globalThis.Node> {
            handleEvent: (this: Node<T>, event: Event) => void;
        }
    }
    export type Listener<T extends globalThis.Node> = Listener.Listener<T> | Listener.ListenerObject<T>;
    
    /** The contract shared by everything that can receive appended children. **/
    export interface IsAppendable {
        readonly [APPENDABLE]: true;
        readonly root: IsAppendable | Node<any> | globalThis.Node;
    }

    /** The values accepted as children by a Node. **/
    export type NodeType =
        | IsAppendable
        | Node<any>
        | globalThis.Node;

    export type NodeValueType = NodeType | Store<any> | string | number;
}

export default Node;