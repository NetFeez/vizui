/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Renders a store as a contiguous group of DOM nodes kept between stable anchors.
 * @license Apache-2.0
 */

import type Store from '../../state/Store.js';

import Node from '../element/Node.js';
import Reactive from './Reactive.js';

export class NodeGroup<T = unknown> extends Reactive<T> {
    /** The subscription type, used by reactive filters. **/
    public readonly type = 'child' as const;

    /** The instance id of this group, embedded in its anchor markers. **/
    public readonly id = Math.random().toString(36).slice(2, 9);

    /** The opening anchor marking the group boundary. **/
    private vStart: Comment;

    /** The closing anchor marking the group boundary. **/
    private vEnd: Comment;

    /** The current content nodes of the group. **/
    private vNodes: globalThis.Node[];

    /**
     * Creates a reactive node group bound to a store.
     * @param store - The store providing the group state.
     *
     * @remarks
     * The group owns a pair of stable `Comment` anchors with a set of contiguous
     * siblings between them; the content is fully re-rendered whenever the store
     * changes (no keyed diffing: update the whole state with `set()`). The anchors
     * preserve the group's slot even when the content is empty, so an emptied
     * group refills in place. The group is mounted with {@link NodeGroup.appendTo}.
     */
    public constructor(store: Store<T>) { super(store);
        this.vStart = new Comment(`[vizui:group:${this.id}:start]`);
        this.vEnd = new Comment(`[vizui:group:${this.id}:end]`);
        this.vNodes = NodeGroup.toNodes(store.state);
        this.subscribe();
    }

    /** The current content nodes of the group, anchors excluded. **/
    public get nodes(): readonly globalThis.Node[] {
        return this.vNodes;
    }

    /**
     * Mounts the group into a parent, before an optional reference sibling.
     * @param parent - The parent node to mount into.
     * @param reference - The node to insert before; defaults to appending at the end.
     * @returns This group, for chaining.
     */
    public appendTo(parent: globalThis.Node, reference?: globalThis.Node | null): this {
        parent.insertBefore(this.vStart, reference ?? null);
        for (const node of this.vNodes) parent.insertBefore(node, reference ?? null);
        parent.insertBefore(this.vEnd, reference ?? null);
        return this;
    }

    /**
     * Re-renders the group content from a new state.
     * @param value - The new state to render.
     */
    public override render(value: T): void {
        for (const node of this.vNodes) node.parentNode?.removeChild(node);
        this.vNodes = NodeGroup.toNodes(value);
        const parent = this.vEnd.parentNode;
        if (parent) for (const node of this.vNodes) parent.insertBefore(node, this.vEnd);
    }

    /**
     * Removes the group content and anchors from the DOM.
     * @returns This group, for chaining.
     */
    public remove(): this {
        for (const node of this.vNodes) node.parentNode?.removeChild(node);
        this.vStart.parentNode?.removeChild(this.vStart);
        this.vEnd.parentNode?.removeChild(this.vEnd);
        return this;
    }

    /**
     * Removes the group from the DOM and detaches it from its store.
     * @returns This group, for chaining.
     */
    public destroy(): this {
        this.remove();
        this.unsubscribe();
        return this;
    }

    private static toNodes(value: unknown): globalThis.Node[] {
        const list = Array.isArray(value) ? value : [value];
        return list.flatMap((item) => {
            if (Array.isArray(item)) return NodeGroup.toNodes(item);
            if (Node.isAppendable(item)) return [Node.getNativeNode(item)];
            return [new Text(String(item))];
        });
    }
}

export namespace NodeGroup {
}

export default NodeGroup;