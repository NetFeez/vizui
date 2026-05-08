/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Adds a simple way to create HTML elements through JS.
 * @module vizui
 * @license Apache-2.0
 */
import Component from "./Component.js";
import DomObserver from "./DomObserver.js";
export declare class Element<T extends keyof Element.Type = any> {
    /** The document body */
    static body: HTMLElement;
    /** The document head */
    static head: HTMLElement;
    /** The DomObserver for this element */
    readonly observer: DomObserver<this>;
    /** The main element */
    root: Element.Type[T];
    /**
     * Creates a series of extended functions.
     * @param element The element with which the exemption will be made.
     */
    constructor(element: Element.Type[T]);
    /**
     * get the scroll height of the element.
     * @returns The scroll height of the element.
     */
    get scrollHeight(): number;
    /**
     * get the scroll width of the element.
     * @returns The scroll width of the element.
     */
    get scrollWidth(): number;
    /**
     * get the scroll top of the element.
     * @returns The scroll top of the element.
    */
    get scrollTop(): number;
    /**
     * set the scroll top of the element.
     * @returns The scroll top of the element.
    */
    set scrollTop(value: number);
    /**
     * get the client height of the element.
     * @returns The client height of the element.
     */
    get clientHeight(): number;
    /**
     * get the client width of the element.
     * @returns The client width of the element.
     */
    get clientWidth(): number;
    /**
     * get the offset height of the element.
     * @returns The offset height of the element.
     */
    get offsetHeight(): number;
    /**
     * get the offset width of the element.
     * @returns The offset width of the element.
     */
    get offsetWidth(): number;
    /**
     * get the classList of the element.
     * @returns The classList of the element.
     */
    get classList(): DOMTokenList;
    /**
     * get the class of the element.
     * @returns The class of the element.
     */
    get class(): string;
    /**
     * set the class of the element.
     * @returns The class of the element.
     */
    set class(value: string);
    /**
     * get the style of the element.
     * @returns The style of the element.
     */
    get style(): CSSStyleDeclaration;
    /**
     * get the id of the element.
     * @returns The id of the element.
     */
    get id(): string;
    /**
     * set the id of the element.
     * @returns The id of the element.
     */
    set id(value: string);
    /**
     * gets the text content of the element.
     * @returns The text content of the element.
     */
    get text(): string;
    /**
     * sets the text content of the element.
     */
    set text(text: string);
    /**
     * gets the html content of the element.
     * @returns The html content of the element.
     */
    get html(): string;
    /**
     * Sets the html content of the element.
     * @param html The html to set.
     */
    set html(html: string);
    /**
     * gets the value of the element.
     * @returns The value of the element.
     */
    get isConnected(): boolean;
    /**
     * Check if the element contains the child.
     * @param element The element to check.
     */
    contains(element: Element.AcceptedTypes): boolean;
    /**
     * Appends one/multiple children to an element.
     * @param childs The elements to be appended.
     */
    append(...childs: Element.ChildType[]): Element<T>;
    /**
     * Replaces this element with another.
     * @param element The element that will replace this one.
     */
    replaceWith(element: Element.ChildType): Element<T>;
    /**
     * Removes one/multiple children from an element.
     * @param childs The elements to be removed.
     */
    removeChild(...childs: Element.AcceptedTypes[]): Element<T>;
    /**
     * Clones this element.
     * @returns The cloned element.
     */
    clone(): Element<T>;
    /**
     * Removes this element from the DOM.
     * @returns The element that was removed.
     */
    remove(): Element<T>;
    /**
     * Animates the element.
     * @param keyframes The keyframes of the animation.
     * @param options The options of the animation.
     * @returns The animation.
     */
    animate(keyframes: Keyframe[] | PropertyIndexedKeyframes, options?: KeyframeAnimationOptions | undefined): Animation;
    /**
     * Appends this element to a parent.
     * @param parent The parent to append this element.
     */
    appendTo(parent: Element.AcceptedTypes): Element<T>;
    /**
     * Adds multiple events to the element.
     * @param events The events to add.
     */
    addEvents(events: Partial<Element.Events>): Element<T>;
    /**
     * Adds an event listener to the element.
     * @param eventName The name of the event to listen for.
     * @param listener The function to call when the event occurs.
     * @param options The options for the event listener.
     */
    on<E extends keyof Element.Events>(eventName: E, listener: Element.Events[E], options?: Element.Events.Options): Element<T>;
    /**
     * Adds an once event listener to the element.
     * @param eventName The name of the event to listen for.
     * @param listener The function to call when the event occurs.
     * @param options The options for the event listener.
     */
    once<E extends keyof Element.Events>(eventName: E, listener: Element.Events[E], options?: Element.Events.Options): Element<T>;
    /**
     * Removes a previously added event listener from the element.
     * @param eventName - The name of the event whose listener should be removed.
     * @param listener - The function to remove, which was previously added as a listener for the event.
     * @param option - Optional configuration to match the options used when adding the event listener.
     * @returns The current element instance to allow method chaining.
     */
    off<E extends keyof Element.Events>(eventName: E, listener: Element.Events[E], option?: Element.Events.Options): Element<T>;
    removeEventListener: <E extends keyof Element.Events>(eventName: E, listener: Element.Events[E], option?: Element.Events.Options) => Element<T>;
    addEventListener: <E extends keyof Element.Events>(eventName: E, listener: Element.Events[E], options?: Element.Events.Options) => Element<T>;
    /**
     * Sets an attribute on the element.
     * @param name The name of the attribute.
     * @param value The value of the attribute.
     */
    setAttribute(name: string, value: string): Element<T>;
    /**
     * Gets the value of an attribute on the element.
     * @param name The name of the attribute.
     */
    getAttribute(name: string): string | null;
    /**
     * set multiple attributes on the element.
     * @param attributes The attributes to set.
     */
    setAttributes(attributes: Element.Attributes): Element<T>;
    /**
     * Removes an attribute from the element.
     * @param name The name of the attribute to remove.
     */
    removeAttribute(name: string): Element<T>;
    /**
     * Clears the element.
     * - that will be remove the children and the text.
     * @returns The element.
     */
    clean(): Element<T>;
    /**
     * Gets an element from the DOM.
     * @param selector The selector to use.
     * @returns The element, or null if not found.
     */
    static get<T extends keyof Element.Type = any>(selector: string): Element<T> | null;
    /**
     * Creates a new element.
     * @param type The type of element to create.
     * @param text The text to set.
     * @param attribs The attributes to set.
     * @param events The events to add.
     * @param childs The children to append.
     * @returns The new element.
     */
    static new<T extends keyof Element.Type>(type: T, text?: string | null, attribs?: Element.Attributes | null, events?: Partial<Element.Events> | null, childs?: Array<Element.ChildType> | null): Element<T>; /**
     * Creates a new element from a structure.
     * @param structure The structure of the element.
     * @returns The new element.
     */
    static structure<T extends keyof Element.Type>(structure: Element.Structure<T>): Element<T>;
}
export declare namespace Element {
    namespace Events {
        type Options = boolean | AddEventListenerOptions;
    }
    type Events = {
        [Key in keyof HTMLElementEventMap]: (this: HTMLElement, event: HTMLElementEventMap[Key]) => void;
    };
    type Type = HTMLElementTagNameMap;
    type Attributes = {
        [key: string]: string;
    };
    type ChildType = Structure<keyof Element.Type> | Element<any> | Component<any> | HTMLElement;
    type AcceptedTypes = Element<any> | Component<any> | HTMLElement;
    type Structure<T extends keyof Element.Type> = {
        type: T;
        text?: string;
        attribs?: Attributes;
        events?: Partial<Element.Events>;
        childs?: Element.ChildType[];
    };
}
export default Element;
