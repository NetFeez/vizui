/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Wraps a DOM Node with a fluent, typed API.
 * @license Apache-2.0
 */

import type Reactive from '../reactive/Reactive.js';

import { DESTROYABLE, NODE } from '../../support/symbols.js';
import { APPENDABLE, IsAppendable, IsDestroyable } from '../../support/Contracts.js';

import LiveStorage from '../LiveStorage.js';
import Ownership from '../../support/Ownership.js';
import EventTracker from './EventTracker.js';
import NodeGroup from '../reactive/NodeGroup.js';
import Store from '../../state/Store.js';

export class Node<T extends globalThis.Node = globalThis.Node> extends Ownership implements IsDestroyable, IsAppendable {
    public readonly [DESTROYABLE] = true;
    public readonly [APPENDABLE] = true;
    public readonly [NODE] = true;

    /** The wrapped DOM node. **/
    public readonly root: T;

    /** The live bindings of this node: event tracker and reactive pool. **/
    protected readonly live: LiveStorage;

    /**
     * Wraps an existing DOM node.
     * @param node - The node to wrap.
     */
    public constructor(node: T) { super();
        if (!Node.isNative(node)) throw new Error('the node is not a Node');
        this.root = node;
        this.live = LiveStorage.of(this.root);
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
    public append(...childList: Node.ValueType[]): this {
        for (const child of childList) {
            if (IsAppendable(child)) { this.root.appendChild(Node.getNativeNode(child)); continue; }
            if (child instanceof Store) {
                const group = new NodeGroup(child);
                group.appendTo(this.root);
                this.trackReactive(group);
                continue;
            }
            this.root.appendChild(new Text(String(child)));
        }
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
    public replaceWith(newNode: Node.ValueType): this {
        if (!this.root.parentNode) throw new Error('the node has no parent');

        if (newNode instanceof Store) {
            const group = new NodeGroup(newNode);
            const parent = this.root.parentNode;
            const reference = this.root.nextSibling;
            parent.removeChild(this.root);
            group.appendTo(parent, reference);
            this.trackReactive(group);
            return this;
        }

        let raw: globalThis.Node;
        if (IsAppendable(newNode)) raw = Node.getNativeNode(newNode);
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
        this.live.tracker.add({ name: name, listener, wrapped, options });
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
        this.live.tracker.add({ name: name, listener, wrapped, options: listenerOptions });
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
        const entry = this.live.tracker.find({ name, listener, options });
        if (!entry) return this;
        this.root.removeEventListener(name, entry.wrapped || entry.listener, options);
        this.live.tracker.delete(entry);
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
        for (const entry of this.live.tracker.entries) this.root.removeEventListener(entry.name, entry.wrapped || entry.listener, entry.options);
        this.live.tracker.delete();
        return this;
    }

    /**
     * Unbinds the reactive bindings of a store, removing matching subscriptions.
     * @param store - The store to unbind.
     * @param filter - Optional type or predicate to select which bindings to detach.
     * @returns This node, for chaining.
     */
    public offReactive(store: Store<any>, filter?: Reactive.Type | Reactive.Filter): this {
        this.live.unregister(store, filter);
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
     * Registers a reactive group under its store for teardown.
     * @param group - The reactive group to track.
     * @returns This node, for chaining.
     */
    private trackReactive(group: NodeGroup): this {
        this.live.register(group);
        return this;
    }

    /**
     * Destroys the current resources and lifecycle of this node: detaches its event
     * listeners, destroys its live bindings (reactives) and releases its owned objects.
     *
     * @remarks `destroy()` terminates the current lifecycle resources of the node. It does not modify
     * the DOM; use {@link remove} for that. After `destroy()`, the node may receive new listeners,
     * reactives and owned objects. Note that DOM containment (`append`/`appendTo`) does not imply
     * ownership: appended children are neither owned nor destroyed automatically.
     * @returns A promise resolving once the live state and the owned resources are destroyed.
     */
    public override async destroy(): Promise<void> {
        await this.live.destroy();
        await super.destroy();
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
     * Gets the native DOM node from a Node wrapper or appendable object.
     * @param node - The node to unwrap.
     * @returns The raw DOM node.
     */
    public static getNativeNode(node: Node.NodeType): globalThis.Node {
        if (Node.isNative(node)) return node;
        if (Node.isNode(node)) return node.root;
        if (IsAppendable(node)) return Node.getNativeNode(node.root);
        throw new Error('The node is not a valid DOM node.');
    }
}

export namespace Node {
    export import Tracker = EventTracker;
    export namespace Listener {
        export interface Listener<T extends globalThis.Node = globalThis.Node> {
            (this: Node<globalThis.Node>, event: Event): void;
        }
        export interface ListenerObject<T extends globalThis.Node = globalThis.Node> {
            handleEvent: (this: Node<globalThis.Node>, event: Event) => void;
        }
    }
    export type Listener<T extends globalThis.Node> = Listener.Listener<T> | Listener.ListenerObject<T>;

    /** The values accepted as children by a Node. **/
    export type NodeType =
        | Node<any>
        | IsAppendable
        | globalThis.Node;

    export type ValueType = NodeType | Store<any> | string | number;
}

export default Node;