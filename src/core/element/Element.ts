/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Wraps an HTMLElement with a fluent, typed API.
 * @license Apache-2.0
 */

import { APPENDABLE, ELEMENT } from '../symbols.js';

import Events from '../../events/Events.js';
import DomObserver from './DomObserver.js';
import Node from './Node.js';
import Store from '../../state/Store.js';

const OBSERVER_MAP = Symbol('vizui.element/observer');
// const REACTIVE_MAP = Symbol('vizui.element/reactive');

export class Element<T extends Element.ExtendedHtmlElement = HTMLElement> extends Node<T> {
    public static [OBSERVER_MAP]: Element.Storage.Observer = new WeakMap();
    // public static [REACTIVE_MAP]: Element.Storage.AttributeSubscriptions = new WeakMap();

    public static body = document.body;
    public static head = document.head;

    public readonly [ELEMENT] = true;

    /** The mutation/intersection observer bound to this element. **/
    public readonly observer: DomObserver<T>;

    /**
     * Wraps an existing HTMLElement.
     * @param element - The element to wrap.
     * @throws When the value is not an HTMLElement.
     */
    public constructor(element: T) {
        if (!(element instanceof HTMLElement)) throw new Error('the element is not a HTMLElement');
        super(element);

        let observer = Element[OBSERVER_MAP].get(this.root);
        if (!observer) Element[OBSERVER_MAP].set(this.root, observer = new DomObserver(this.root));
        this.observer = observer;

        // let reactive = Element[REACTIVE_MAP].get(this.root);
        // if (!reactive) Element[REACTIVE_MAP].set(this.root, reactive = new Map());
        // this.reactiveAttributeSubscriptions = reactive;
    }

    /** The scroll height of the element in pixels. **/
    public get scrollHeight(): number { return this.root.scrollHeight; }

    /** The scroll width of the element in pixels. **/
    public get scrollWidth(): number { return this.root.scrollWidth; }

    /** The vertical scroll position in pixels. **/
    public get scrollTop(): number { return this.root.scrollTop; }

    /** The vertical scroll position in pixels. **/
    public set scrollTop(value: number) { this.root.scrollTop = value; }

    /** The visible height of the element in pixels. **/
    public get clientHeight(): number { return this.root.clientHeight; }

    /** The visible width of the element in pixels. **/
    public get clientWidth(): number { return this.root.clientWidth; }

    /** The layout height of the element in pixels. **/
    public get offsetHeight(): number { return this.root.offsetHeight; }

    /** The layout width of the element in pixels. **/
    public get offsetWidth(): number { return this.root.offsetWidth; }

    /** The class list of the element. **/
    public get classList(): DOMTokenList { return this.root.classList; }

    /** The class attribute of the element. **/
    public get class(): string { return this.root.className; }

    /** The class attribute of the element. **/
    public set class(value: string) { this.root.className = value; }

    /** The inline style declaration of the element. **/
    public get style(): CSSStyleDeclaration { return this.root.style; }

    /** The id attribute of the element. **/
    public get id(): string { return this.root.id; }

    /** The id attribute of the element. **/
    public set id(value: string) { this.root.id = value; }

    /** The text content of the element. **/
    public get text(): string { return this.root.textContent ?? ''; }

    /** The text content of the element. **/
    public set text(value: string) { this.root.textContent = value; }

    /** The HTML content of the element. **/
    public get html(): string { return this.root.innerHTML; }

    /** The HTML content of the element. **/
    public set html(value: string) { this.root.innerHTML = value; }

    /**
     * Sets the text content of the element.
     * @param text - The text to set.
     * @returns This element, for chaining.
     */
    public setText(text: string): this { this.root.textContent = text; return this; }

    /**
     * Sets the HTML content of the element.
     * @param html - The HTML to set.
     * @returns This element, for chaining.
     */
    public setHtml(html: string): this { this.root.innerHTML = html; return this; }

    /**
     * Sets the class attribute of the element.
     * @param className - The class to set.
     * @returns This element, for chaining.
     */
    public setClass(className: string): this { this.root.className = className; return this; }

    /**
     * Adds one or more classes to the element.
     * @param classList - The classes to add.
     * @returns This element, for chaining.
     */
    public addClass(...classList: string[]): this {
        classList = Element.sanitizeClassList(classList);
        this.root.classList.add(...classList);
        return this;
    }

    /**
     * Removes one or more classes from the element.
     * @param classList - The classes to remove.
     * @returns This element, for chaining.
     */
    public removeClass(...classList: string[]): this {
        classList = Element.sanitizeClassList(classList);
        this.root.classList.remove(...classList);
        return this;
    }

    /**
     * Toggles a class on the element.
     * @param className - The class to toggle.
     * @param force - Whether to force the class on or off.
     * @returns This element, for chaining.
     */
    public toggleClass(className: string, force?: boolean): this { this.root.classList.toggle(className, force); return this; }

    /**
     * Animates the element with the Web Animations API.
     * @param keyframes - The keyframes of the animation.
     * @param options - The options of the animation.
     * @returns The animation created for the element.
     */
    public animate(keyframes: Keyframe[] | PropertyIndexedKeyframes, options?: KeyframeAnimationOptions): Animation {
        return this.root.animate(keyframes, options);
    }

    /**
     * Sets a single attribute.
     * @param name - The name of the attribute.
     * @param value - The value of the attribute.
     * @returns This element, for chaining.
     */
    public setAttribute(name: string, value: string | Store<string | null>): this {
        if (value instanceof Store) return this.bindAttribute(name, value);
        this.root.setAttribute(name, value);
        return this;
    }

    /**
     * Binds a reactive attribute to the element.
     * @param name - The name of the attribute.
     * @param store - The store to bind to the attribute.
     * @param readonly - Whether the attribute is readonly.
     * @returns This element, for chaining.
     */
    public bindAttribute(name: string, store: Store<string | null>): this {
        let subscriptions = this.reactiveSubscriptions.get(store);
        if (!subscriptions) this.reactiveSubscriptions.set(store, subscriptions = new Set());
        const apply = (value: string | null): void => {
            if (value === null || value === undefined) this.root.removeAttribute(name);
            else this.root.setAttribute(name, value);
        };
        const unsubscribe = store.subscribe(apply);
        subscriptions.add({ type: 'attribute', unsubscribe });
        apply(store.state);
        return this;
    }

    /**
     * Unbinds a reactive attribute from the element.
     * @param name - The name of the attribute.
     * @returns This element, for chaining.
     */
    public unbindAttribute(store: Store<string | null>): this {
        const subscriptions = this.reactiveSubscriptions.get(store);
        if (!subscriptions) return this;
        return this.offReactive(store, 'attribute');
    }

    /**
     * Gets the value of an attribute.
     * @param name - The name of the attribute.
     * @returns The value of the attribute, or null if it does not exist.
     */
    public getAttribute(name: string): string | null {
        return this.root.getAttribute(name);
    }

    /**
     * Sets multiple attributes at once.
     * @param attributes - The attributes to set.
     * @returns This element, for chaining.
     */
    public setAttributes(attributes: Element.Attributes): this {
        for (const [name, value] of Object.entries(attributes)) {
            this.setAttribute(name, String(value));
        }
        return this;
    }

    /**
     * Removes one or more attributes from this element.
     * @param names - The names of the attributes to remove.
     * @returns This element, for chaining.
     */
    public removeAttribute(...names: string[]): this {
        for (const name of names) this.root.removeAttribute(name);
        return this;
    }

    /**
     * Removes all child nodes of this element.
     * @returns This element, for chaining.
     */
    public clean(): this {
        this.root.replaceChildren();
        return this;
    }

    /**
     * Gets a child element by its CSS selector.
     * @param selector - The CSS selector to use.
     * @returns The matching element, or null if none is found.
     */
    public get<T extends Element.Query.Extended>(selector: T): Element<Element.Query.Result<T>> | null {
        const element = this.root.querySelector<Element.Query.Result<T>>(selector);
        return element ? new Element(element) : null;
    }

    /**
     * Gets all child elements matching a CSS selector.
     * @param selector - The CSS selector to use.
     * @returns An array of matching elements, or an empty array if none are found.
     */
    public getAll<T extends Element.Query.Extended>(selector: T): Element<Element.Query.Result<T>>[] {
        const elements = this.root.querySelectorAll<Element.Query.Result<T>>(selector);
        return Array.from(elements).map((element) => new Element(element));
    }

    /**
     * Adds an event listener to this element and tracks it for teardown.
     * @param name - The name of the event.
     * @param listener - The callback to execute.
     * @param options - The listener options.
     * @returns This element, for chaining.
     */
    public override on<E extends keyof Element.EventMap<T>>(name: E, listener: Element.EventMap<T>[E], options?: Node.Tracker.Options): this;
    public override on(name: string, listener: Node.Listener<T>, options?: Node.Tracker.Options): this;
    public override on(name: string, listener: Node.Listener<T>, options?: Node.Tracker.Options): this {
        return super.on(name, listener, options);
    }

    /**
     * Adds a one-time event listener to this element and tracks it for teardown.
     * @param name - The name of the event.
     * @param listener - The callback to execute.
     * @param options - The listener options.
     * @returns This element, for chaining.
     */
    public override once<E extends keyof Element.EventMap<T>>(name: E, listener: Element.EventMap<T>[E], options?: Node.Tracker.Options): this;
    public override once(name: string, listener: Node.Listener<T>, options?: Node.Tracker.Options): this;
    public override once(name: string, listener: Node.Listener<T>, options?: Node.Tracker.Options): this {
        return super.once(name, listener, options);
    }

    /**
     * Removes a previously added event listener.
     * @param name - The name of the event.
     * @param listener - The listener to remove.
     * @param options - The listener options.
     * @returns This element, for chaining.
     */
    public override off<E extends keyof Element.EventMap<T>>(name: E, listener: Element.EventMap<T>[E], options?: Node.Tracker.Options): this;
    public override off(name: string, listener: Node.Listener<T>, options?: Node.Tracker.Options): this;
    public override off(name: string, listener: Node.Listener<T>, options?: Node.Tracker.Options): this {
        return super.off(name, listener, options);
    }

    /**
     * Checks whether a given object is an Element wrapper.
     * @param object - The object to check.
     * @returns True if the object is an Element wrapper, false otherwise.
     */
    public static isElement(object: unknown): object is Element<any> {
        return object instanceof Element;
    }

    /**
     * Checks whether a given object is an HTML element.
     * @param object - The object to check.
     * @returns True if the object is an HTML element, false otherwise.
     */
    public static isHtmlElement(object: unknown): object is HTMLElement {
        return object instanceof HTMLElement;
    }

    /**
     * Assigns creation options to an element.
     * @param element - The element to assign options to.
     * @param options - The options to assign.
     *
     * @remarks
     * Used internally by {@link Element.new}.
     */
    private static assignCreationOptions<T extends HTMLElement>(
        element: Element<T>,
        options: Element.CreationOptions<T>
    ): void {
        if (Object.keys(options).length === 0) return;
        if (options.text !== undefined) element.text = options.text;
        if (options.html !== undefined) element.html = options.html;
        if (options.attributes) element.setAttributes(options.attributes);
        if (options.events) this.addEvents(element, options.events);
        if (options.childList) element.append(...options.childList);
    }

    /**
     * Adds multiple event listeners to an element.
     * @param element - The element to add events to.
     * @param events - The events to add.
     *
     * @remarks
     * Used internally by {@link Element.new}; not intended for direct use.
     */
    private static addEvents<T extends Element.ExtendedHtmlElement>(element: Element<T>, events: Partial<Element.EventMap<T>>): void;
    private static addEvents<T extends Element.ExtendedHtmlElement>(element: Element<T>, events: Partial<Element.EventMap.Generics<T>>): void;
    private static addEvents<T extends Element.ExtendedHtmlElement>(element: Element<T>, events: Partial<Element.EventMap.Generics<T>>): void {
        for (const [name, listener] of Object.entries(events)) {
            if (!listener) throw new Error('the event has no listener.');
            element.on(name, listener);
        }
    }

    private static sanitizeClassList(classList: string[]): string[] {
        return classList.map((entry) => entry.trim().split(/\s+/)).flat();
    }

    /**
     * Gets an element from the DOM by selector.
     * @param selector - The selector to use.
     * @returns The element, or null if not found.
     *
     * @example
     * ```ts
     * const div = Element.get<HTMLDivElement>('div#my-div');
     * const input = Element.get<HTMLInputElement>('input[name="my-input"]');
     * ```
     */
    public static get<T extends Element.Query.Extended>(selector: T): Element<Element.Query.Result<T>> | null {
        const selection = document.querySelector<Element.Query.Result<T>>(selector);
        return selection ? new Element(selection) : null;
    }

    /**
     * Gets all elements from the DOM by selector.
     * @param selector - The selector to use.
     * @returns An array of elements, or an empty array if none are found.
     *
     * @example
     * ```ts
     * const divs = Element.getAll<HTMLDivElement>('div.my-class');
     * const inputs = Element.getAll<HTMLInputElement>('input[type="text"]');
     * ```
     */
    public static getAll<T extends Element.Query.Extended>(selector: T): Element<Element.Query.Result<T>>[] {
        const selection = document.querySelectorAll<Element.Query.Result<T>>(selector);
        return Array.from(selection).map((element) => new Element(element));
    }

    /**
     * Creates a new element.
     * @param tag - The type of element to create.
     * @param options - The options to apply to the element.
     * @returns The new element.
     *
     * @example
     * ```ts
     * const div = Element.new('div', {
     *     text: 'Hello, world!',
     *     attributes: {
     *         id: 'my-div',
     *         class: 'my-class',
     *         other: 'value'
     *     }
     * });
     * ```
     */
    public static new<T extends keyof Element.Type>(tag: T, options: Element.CreationOptions<Element.Type[T]> = {}): Element<Element.Type[T]> {
        const root = document.createElement(tag);
        const element = new Element(root);
        this.assignCreationOptions(element, options);
        return element;
    }
    /**
     * Creates a new element.
     * @param tag - The type of element to create.
     * @param options - The options to apply to the element.
     * @returns The new element.
     *
     * @example
     * ```ts
     * const div = Element.create('div', {
     *     text: 'Hello, world!',
     *     attributes: {
     *         id: 'my-div',
     *         class: 'my-class',
     *         other: 'value'
     *     }
     * });
     * ```
     */
    public static create<T extends keyof Element.Type>(tag: T, options: Element.CreationOptions<Element.Type[T]> = {}): Element<Element.Type[T]> {
        return this.new(tag, options);
    }

    /**
     * Creates a new element from a structure.
     * @param structure - The structure of the element.
     * @returns The new element.
     * @deprecated Use {@link Element.new} instead.
     */
    public static structure<T extends keyof Element.Type>(structure: Element.Structure<T>): Element<Element.Type[T]> {
        return this.new(structure.tag, { ...structure });
    }
}

export namespace Element {
    export namespace Storage {
        export namespace AttributeSubscriptions {
            export type Entry<T extends HTMLElement> = Map<string, Set<{
                unsubscribe: () => void;
                listener?: (_: T, name: string, value: string | null, last: string | null) => void;
            }>>;
        }
        export type Observer = WeakMap<HTMLElement, DomObserver<any>>;
        export type AttributeSubscriptions = WeakMap<HTMLElement, AttributeSubscriptions.Entry<any>>;
    }
    export interface ExtendedHtmlElement extends HTMLElement {
        // Future metadata saving based on symbols
    }

    /** The typed event listener map of an HTMLElement. **/
    export type EventMap<T extends HTMLElement> = {
        [Key in keyof HTMLElementEventMap]: (this: Element<T>, event: HTMLElementEventMap[Key]) => void;
    };
    export namespace EventMap {
        /** Untyped listeners keyed by arbitrary event names. **/
        export interface Generics<T extends HTMLElement> { [key: string]: Node.Listener<T>; }
    }

    /** Attribute values keyed by name. **/
    export interface Attributes { [key: string]: string | number | boolean; }

    /** Maps a tag name to its concrete HTMLElement type. **/
    export type Type = HTMLElementTagNameMap;

    export namespace Query {
        export type Selector = keyof Type
        export type Extended =Selector | (string & {});
        export type Result<T extends Extended> = T extends Selector ? Type[T] : HTMLElement;
    }

    export interface IsAppendable extends Node.IsAppendable {
        readonly [APPENDABLE]: true;
        root: Element<any> | HTMLElement;
    }

    /** The children accepted by an Element. **/
    export type ChildType = Element<any> | Node.NodeType;

    /** The options applied to an element at creation time. **/
    export interface CreationOptions<T extends HTMLElement> {
        /**
         * The text content of the element.
         * @default undefined
         * @remarks If html is set, text will be ignored.
         */
        text?: string;

        /**
         * The HTML content of the element.
         * @default undefined
         * @remarks If html is set, text will be ignored.
         */
        html?: string;

        /**
         * The attributes to set on the element.
         * @default undefined
         */
        attributes?: Element.Attributes;

        /**
         * The events to add to the element.
         * @default undefined
         */
        events?: Partial<Element.EventMap<T>>;

        /**
         * The children to append to the element.
         * @default undefined
         */
        childList?: Array<Element.ChildType>;
    }

    /** The deprecated structural declaration of an element. **/
    export interface Structure<T extends keyof Element.Type> extends CreationOptions<Element.Type[T]> {
        tag: T;
    }
}

export default Element;
