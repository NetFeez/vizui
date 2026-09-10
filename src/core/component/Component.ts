/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Base class to create typed components with lifecycle and teardown.
 * @license Apache-2.0
 */

import { APPENDABLE, COMPONENT } from '../symbols.js';

import Element from '../element/Element.js';
import Node from '../element/Node.js';
import Events from '../../events/Events.js';
import Css from '../resource/Css.js';

/**
 * Base class to create typed components with lifecycle and teardown.
 * @template T - The type of the root element of the component. Can be either
 * an HTMLElement type or an `Element.Type` key.
 * @template EventMap - The type of the event map for the component.
 *
 * @example
 * ```ts
 * // Create a new component
 * //
 * // Method 1. Auto inferred
 * class MyComponent extends Component<'div'> {
 *     static { this.css.load('my-component.css', import.meta); }
 *     public root = Element.new('div');
 * }
 *
 * // Method 2. Explicit type
 * class MyComponent extends Component<'div'> {
 *     static { this.css.load('my-component.css', import.meta); }
 *
 *     public root: Element<Element.Type['div']>;                 // 1. Element.Type
 *     public root: Element<HTMLDivElement>;                      // 2. HTMLElement
 *     public root: Element<Component.ComponentElement<'div'>>;   // 3. ComponentElement
 *
 *     public constructor() {
 *         super();
 *         this.root = Element.new('div');
 *     }
 * }
 *
 * // `ComponentElement<E>` normalizes both supported forms of `E`
 * // to the corresponding HTMLElement type:
 * //
 * // Component<'div'>
 * //   -> ComponentElement<'div'>
 * //   -> Element.Type['div']
 * //   -> HTMLDivElement
 * //
 * // Component<HTMLDivElement>
 * //   -> ComponentElement<HTMLDivElement>
 * //   -> HTMLDivElement
 * //
 * // Therefore, both forms produce the same root type:
 * //
 * // Component<'div'>          -> root: Element<HTMLDivElement>
 * // Component<HTMLDivElement> -> root: Element<HTMLDivElement>
 * ```
 */

export abstract class Component<
    T extends HTMLElement | keyof Element.Type = HTMLElement,
    EventMap extends Events.EventMap = Events.EventMap,
> extends Events<EventMap> implements Node.IsAppendable, Component.Lifecycle {
    /** The shared stylesheet loader available to subclasses. **/
    protected static readonly css = Css;

    public readonly [COMPONENT] = true;
    public readonly [APPENDABLE] = true;

    /** The root element of the component. **/
    public readonly abstract root: Element<Component.ComponentElement<T>>;

    /** Whether the root element is attached to the document. **/
    public get isConnected(): boolean { return this.root.isConnected; }

    /** Called before the component is mounted into the DOM. **/
    public willMount?(): void | Promise<void>;

    /** Called after the component is mounted into the DOM. **/
    public onMount?(): void | Promise<void>;

    /** Called before the component is removed and its listeners torn down. **/
    public onUnmount?(): void | Promise<void>;

    /**
     * Appends one or more children to the component.
     * @param childList - The children to append.
     * @returns This component, for chaining.
     */
    public append(...childList: Component.ChildType[]): this {
        if (childList.length === 0) return this;
        for (const child of childList) {
            if (COMPONENT in child) child.appendTo(this.root);
            else this.root.append(child);
        }
        return this;
    }

    /**
     * Appends and mounts the component into a parent, running the mount lifecycle.
     * @param parent - The parent to append to.
     * @returns This component, for chaining.
     */
    public appendTo(parent: Element.ChildType): this {
        if (this.willMount) this.willMount();
        this.root.appendTo(parent);
        if (this.onMount) this.onMount();
        return this;
    }

    /**
     * Replaces this component with another element or component, running the
     * unmount lifecycle of this one and the mount lifecycle of the replacement.
     * @param element - The element or component to mount in place of this one.
     * @returns This component, for chaining.
     */
    public replaceWith(element: Component.ChildType): this {
        if (this.onUnmount) this.onUnmount();
        if (COMPONENT in element) {
            if (element.willMount) element.willMount();
            this.root.replaceWith(element.root);
            if (element.onMount) element.onMount();
        } else this.root.replaceWith(element);
        return this;
    }

    /**
     * Removes the component from the DOM and runs its unmount lifecycle.
     * @returns This component, for chaining.
     */
    public remove(): this {
        if (this.onUnmount) this.onUnmount();
        this.root.remove();
        return this;
    }

    /**
     * Unmounts a component, running its unmount lifecycle and removing it from the DOM.
     * @param component - The component to unmount.
     * @returns void
     */
    public static unmount(component: Component<any>): void {
        if (component.onUnmount) component.onUnmount();
        component.root.remove();
    }
}

export namespace Component {
    export type Type = keyof Element.Type | HTMLElement;
    /** Normalizes the supported root element declarations to their HTMLElement type. **/
    export type ComponentElement<
        E extends Component.Type
    > = E extends HTMLElement
        ? E : E extends keyof Element.Type
        ? Element.Type[E] : never;

    /** The child kinds a component accepts: other components, elements or HTMLElements. **/
    export type ChildType = Component | Element.ChildType;

    /** The optional lifecycle hooks a component can implement. **/
    export interface Lifecycle {
        /** Called before the component is mounted into the DOM. **/
        willMount?(): void | Promise<void>;

        /** Called after the component is mounted into the DOM. **/
        onMount?(): void | Promise<void>;

        /** Called before the component is removed and its listeners torn down. **/
        onUnmount?(): void | Promise<void>;
    }
}
export default Component;