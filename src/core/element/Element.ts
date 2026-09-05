/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Wraps an HTMLElement with a fluent, typed API.
 * @license Apache-2.0
 */

import DomObserver from './DomObserver.js';
import { APPENDABLE, ELEMENT } from '../symbols.js';

export class Element<T extends HTMLElement = HTMLElement> implements Element.IsAppendable {
    public static readonly body = document.body;
    public static readonly head = document.head;

    public readonly [ELEMENT] = true;
    public readonly [APPENDABLE] = true;

    public readonly observer: DomObserver<T>;
    public readonly root: T;

    private vListeners: Array<Element.Events.Entry> = [];

    public constructor(element: T) {
        if (!(element instanceof HTMLElement)) throw new Error('the element is not a HTMLElement');
        this.root = element;
        this.observer = new DomObserver(this.root);
    }

    public get scrollHeight(): number { return this.root.scrollHeight; }
    public get scrollWidth(): number { return this.root.scrollWidth; }
    public get scrollTop(): number { return this.root.scrollTop; }
    public set scrollTop(value: number) { this.root.scrollTop = value; }
    public get clientHeight(): number { return this.root.clientHeight; }
    public get clientWidth(): number { return this.root.clientWidth; }
    public get offsetHeight(): number { return this.root.offsetHeight; }
    public get offsetWidth(): number { return this.root.offsetWidth; }
    public get classList(): DOMTokenList { return this.root.classList; }
    public get class(): string { return this.root.className; }
    public set class(value: string) { this.root.className = value; }
    public get style(): CSSStyleDeclaration { return this.root.style; }
    public get id(): string { return this.root.id; }
    public set id(value: string) { this.root.id = value; }

    public get text(): string { return this.root.innerText; }
    public set text(text: string) { this.root.innerText = text; }
    public get html(): string { return this.root.innerHTML; }
    public set html(html: string) { this.root.innerHTML = html; }
    public get isConnected(): boolean { return this.root.isConnected; }

    /**
     * Sets the text content of the element.
     * @param text - The text to set.
     * @returns The element itself.
     */
    public setText(text: string): this { this.root.innerText = text; return this; }

    /**
     * Sets the HTML content of the element.
     * @param html - The HTML to set.
     * @returns The element itself.
     */
    public setHtml(html: string): this { this.root.innerHTML = html; return this; }
    
    /**
     * Removes this element from the DOM.
     * @returns This element.
     */
    public remove(): this { this.root.remove(); return this; }

    /**
     * Animates this element.
     * @param keyframes The keyframes of the animation.
     * @param options The options of the animation.
     */
    public animate(keyframes: Keyframe[] | PropertyIndexedKeyframes, options?: KeyframeAnimationOptions | undefined): Animation {
        return this.root.animate(keyframes, options);
    }

    /**
     * Appends one or more children to this element.
     * @param childList - The children to append.
     * 
     * @remarks
     * This method will append the specified children to this element.
     * The children can be HTMLElements, Elements, or Components.
     * 
     * @example
     * ```ts
     * const div = Element.new('div');
     * const span = Element.new('span');
     * const p = Element.new('p');
     * div.append(span, p);
     * ```
     */
    public append(...childList: Element.ChildType[]): this {
        Element.append(this, ...childList);
        return this;
    }

    /**
     * Appends this element to a parent.
     * @param parent - The parent to append to.
     * 
     * @remarks
     * This method will append this element to the specified parent.
     * The parent can be an HTMLElement, an Element, or a Component.
     */
    public appendTo(parent: Element.ChildType): this {
        Element.append(parent, this.root);
        return this;
    }

    /**
     * Replaces this element with another.
     * @param newElement - The element that will replace this one.
     * @returns This element.
     * 
     * @remarks
     * This method will replace this element with the specified new element.
     * The new element can be an HTMLElement, an Element, or a Component.
     * 
     * @example
     * ```ts
     * const div = Element.new('div');
     * const span = Element.new('span');
     * div.replaceWith(span);
     * ```
     */
    public replaceWith(newElement: Element.ChildType): this {
        const rawNewElement = Element.getRawElement(newElement);
        this.root.replaceWith(rawNewElement);
        return this;
    }
    /**
     * Removes one or more children from this element.
     * @param childList - The children to remove.
     * 
     * @remarks
     * This method will remove the specified children from this element.
     * The children can be HTMLElements, Elements, or Components.
     * 
     * @example
     * ```ts
     * const div = Element.new('div');
     * const span = Element.new('span');
     * const p = Element.new('p');
     * div.append(span, p);
     * div.removeChild(span, p);
     * ```
     */
    public removeChild(...childList: Element.ChildType[]): this {
        for (const child of childList.map(Element.getRawElement)) this.root.removeChild(child);
        return this;
    }

    /**
     * Checks whether this element contains a given child.
     * @param child - The child to check.
     * @returns True if this element contains the child, false otherwise.
     * 
     * @remarks
     * This method will check whether this element contains the specified child.
     * The child can be an HTMLElement, an Element, or a Component.
     * 
     * @example
     * ```ts
     * const div = Element.new('div');
     * const span = Element.new('span');
     * div.append(span);
     * console.log(div.contains(span)); // true
     * console.log(div.contains(document.createElement('span'))); // false
     * ```
     */
    public contains(child: Element.ChildType): boolean {
        const raw = Element.getRawElement(child);
        return this.root.contains(raw);
    }

    /**
     * Adds an event listener to this element and tracks it for teardown.
     * @param eventName - The name of the event.
     * @param listener - The callback to execute.
     * @param options - The listener options.
     */
    public on<E extends keyof Element.Events>(eventName: E, listener: Element.Events[E], options?: Element.Events.Options): this;
    public on(eventName: string, listener: EventListenerOrEventListenerObject, options?: Element.Events.Options): this;
    public on(eventName: string, listener: EventListenerOrEventListenerObject, options?: Element.Events.Options): this {
        this.root.addEventListener(eventName, listener, options);
        this.vListeners.push({ eventName: eventName, listener: listener, options });
        return this;
    }
    
    /**
     * Adds a one-time event listener to this element and tracks it for teardown.
     * @param eventName - The name of the event.
     * @param listener - The callback to execute.
     * @param options - The listener options.
     */
    public once<E extends keyof Element.Events>(eventName: E, listener: Element.Events[E], options?: Element.Events.Options): this;
    public once(eventName: string, listener: EventListenerOrEventListenerObject, options?: Element.Events.Options): this;
    public once(eventName: string, listener: EventListenerOrEventListenerObject, options?: Element.Events.Options): this {
        options = !options || typeof options === 'boolean' ? { once: true } : { ...options, once: true };
        this.root.addEventListener(eventName, listener, options);
        this.vListeners.push({ eventName: eventName, listener: listener, options });
        return this;
    }

    /**
     * Removes a previously added event listener.
     * @param eventName - The name of the event.
     * @param listener - The listener to remove.
     * @param option - The options to match.
     */
    public off<E extends keyof Element.Events>(eventName: E, listener: Element.Events[E], options?: Element.Events.Options): this;
    public off(eventName: string, listener: EventListenerOrEventListenerObject, options?: Element.Events.Options): this;
    public off(eventName: string, listener: EventListenerOrEventListenerObject, option?: Element.Events.Options): this {
        this.root.removeEventListener(eventName, listener, option);
        this.vListeners = this.vListeners.filter(entry => entry.listener !== listener || entry.eventName !== eventName);
        return this;
    }

    public removeEventListener = this.off;
    public addEventListener = this.on;

    /**
     * Removes all tracked event listeners registered on this element.
     * @returns This element.
     * 
     * @remarks
     * This will remove all the event listeners that have been added to this element.
     */
    public unbindAll(): this {
        for (const { eventName, listener, options } of this.vListeners) this.root.removeEventListener(eventName, listener, options);
        this.observer
        this.vListeners = [];
        return this;
    }

    /**
     * Sets a single attribute.
     * @param name - The name of the attribute.
     * @param value - The value of the attribute.
     * 
     * @remarks
     * This method will set the specified attribute on the element.
     * If the attribute already exists, its value will be overwritten.
     * If the attribute does not exist, it will be created.
     */
    public setAttribute(name: string, value: string): this {
        this.root.setAttribute(name, value);
        return this;
    }

    /**
     * Gets the value of an attribute.
     * @param name - The name of the attribute.
     * @returns The value of the attribute, or null if it doesn't exist.
     * 
     * @remarks
     * This method will return the value of the specified attribute on the element.
     * If the attribute does not exist, it will return null.
     */
    public getAttribute(name: string): string | null { return this.root.getAttribute(name); }

    /**
     * Sets multiple attributes at once.
     * @param attributes - The attributes to set.
     * 
     * @remarks
     * This method will set the specified attributes on the element.
     * If an attribute already exists, its value will be overwritten.
     * If an attribute does not exist, it will be created.
     */
    public setAttributes(attributes: Element.Attributes): this {
        for (const [Attrib, value] of Object.entries(attributes)) this.setAttribute(Attrib, String(value));
        return this;
    }

    /**
     * Removes one or more attributes from this element.
     * @param names The names of the attributes to remove.
     * 
     * @remarks
     * This method will remove the specified attributes from the element.
     * If an attribute does not exist, it will be ignored.
     */
    public removeAttribute(...names: string[]): this {
        for (const name of names) this.root.removeAttribute(name);
        return this;
    }
    /**
     * Remove all the content of this element.
     * @returns This element.
     * 
     * @remarks
     * This will remove all the child nodes of this element, including text nodes and comment nodes.
     * It will not remove the element itself.
     */
    public clean(): this { this.root.innerText = ''; return this; }

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
    public static get<T extends HTMLElement = HTMLElement>(selector: string): Element<T> | null {
        const selection = document.querySelector<T>(selector);
        return selection ? new Element(selection) : null;
    }

    /**
     * Creates a new element.
     * @param tag - The type of element to create.
     * @param options - The options to apply to the element.
     * @returns The new element.
     * 
     * @example
     * ```ts
     * const div = Element.new('div', { text: 'Hello, world!', attributes: { id: 'my-div', class: 'my-class', other: 'value' } });
     * // or you can do it like a semi-builder:
     * const div = Element.new('div')
     *     .setAttribute('id', 'my-div')
     *     .setArrtributes({ class: 'my-class', other: 'value' })
     *     .setText('Hello, world!');
     * ```
     */
    public static new<T extends keyof Element.Type>(tag: T, options: Element.CreationOptions = {}): Element<Element.Type[T]> {
        const root = document.createElement(tag);
        const element = new Element(root);
        this.assignCreationOptions(element, options);
        return element;
    }

    /**
     * Creates a new element from a structure.
     * @param structure - The structure of the element.
     * 
     * @deprecated Use Element.new instead.
     */
    public static structure<T extends keyof Element.Type>(structure: Element.Structure<T>): Element<Element.Type[T]> {
        return this.new(structure.tag, { ...structure });
    }

    /**
     * Checks whether a given object is an Element.
     * @param object - The object to check.
     * @returns True if the object is an Element, false otherwise.
     */
    public static isElement(object: unknown): object is Element<any> {
        if (typeof object !== 'object' || object === null) return false;
        return ELEMENT in object;
    }

    /**
     * Checks whether a given object is appendable (an Element or HTMLElement).
     * @param object - The object to check.
     * @returns True if the object is appendable, false otherwise.
     */
    public static isAppendable(object: unknown): object is Element.IsAppendable {
        if (typeof object !== 'object' || object === null) return false;
        return APPENDABLE in object;
    }

    /**
     * Checks whether a given object is an HTML element.
     * @param object - The object to check.
     * @returns True if the object is an HTML element, false otherwise.
     */
    public static isHtmlElement(object: unknown): object is HTMLElement { return object instanceof HTMLElement; }
    
    /**
     * Assigns creation options to an element.
     * @param element - The element to assign options to.
     * @param options - The options to assign.
     * 
     * @remarks This method is used internally by Element.new and Element.from.
     */
    private static assignCreationOptions<T extends HTMLElement>(element: Element<T>, options: Element.CreationOptions): void {
        if (Object.keys(options).length === 0) return;
        if (options.text) element.text = options.text;
        if (options.html) element.html = options.html;
        if (options.attributes) element.setAttributes(options.attributes);
        if (options.events) this.addEvents(element, options.events);
        if (options.childList) element.append(...options.childList);
    }

    /**
     * Adds multiple event listeners to an element.
     * @param element - The element to add events to.
     * @param events - The events to add.
     * 
     * @remarks This method is used internally by Element.new and Element.from.
     * It is not intended to be used directly.
     */
    private static addEvents<T extends HTMLElement>(element: Element<T>, events: Partial<Element.Events>): void;
    private static addEvents<T extends HTMLElement>(element: Element<T>, events: Partial<Element.Events.Generics>): void;
    private static addEvents<T extends HTMLElement>(element: Element<T>, events: Partial<Element.Events.Generics>): void {
        for (const [key, listener] of Object.entries(events)) {
            if (!listener) throw new Error('the event no have a listener.');
            element.root.addEventListener(key, listener);
        }
    }

    /**
     * Appends one or more children to a parent element.
     * @param parent - The parent element to append to.
     * @param childList - The children to append.
     * 
     * @remarks This method is used internally by Element.new and Element.from.
     * It is not intended to be used directly.
     */
    private static append(parent: Element.ChildType, ...childList: Element.ChildType[]): void {
        const rawParent = this.getRawElement(parent);
        for (const child of childList.map(Element.getRawElement)) rawParent.appendChild(child);
    }

    /**
     * Gets the raw HTMLElement from an Element or Component.
     * @param element - The element or component to get the raw HTMLElement from.
     * @returns The raw HTMLElement.
     * 
     * @remarks This method is used internally by Element.appendTo and Element.replaceWith.
     * It is not intended to be used directly.
     */
    private static getRawElement(element: Element.ChildType): HTMLElement {
        if (element instanceof HTMLElement) return element;
        if (ELEMENT in element) return element.root;
        if (APPENDABLE in element) return this.getRawElement(element.root);
        throw new Error('the element is not a HTMLElement or Element or Component');
    }
}

export namespace Element {
    export interface IsAppendable {
        readonly root: HTMLElement | Element<any>;
        readonly [APPENDABLE]: true;
    }

    export type Events = { [Key in keyof HTMLElementEventMap]: (this: HTMLElement, event: HTMLElementEventMap[Key]) => void; };
    export namespace Events {
        export interface Generics { [key: string]: EventListenerOrEventListenerObject; }
        export interface Entry {
            eventName: string;
            listener: EventListenerOrEventListenerObject;
            options?: Element.Events.Options;
        }
        export type Options = boolean | AddEventListenerOptions;
    }

    export interface Attributes { [key: string]: string | number | boolean; };

    /** Maps a tag name to its concrete HTMLElement type. */
    export type Type = HTMLElementTagNameMap;

    export type ChildType =
        | Element<any>
        | IsAppendable
        | HTMLElement;

    export interface CreationOptions {
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
        events?: Partial<Element.Events>;
        /**
         * The children to append to the element.
         * @default undefined
         */
        childList?: Array<Element.ChildType>;
    }

    export interface Structure<T extends keyof Element.Type> extends CreationOptions {
        tag: T;
    };
}

export default Element;