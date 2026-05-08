/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Adds a simple way to create HTML elements through JS.
 * @module vizui
 * @license Apache-2.0
 */
import Component from "./Component.js";
import DomObserver from "./DomObserver.js";
export class Element {
    /** The document body */
    static body = document.body;
    /** The document head */
    static head = document.head;
    /** The DomObserver for this element */
    observer;
    /** The main element */
    root;
    /**
     * Creates a series of extended functions.
     * @param element The element with which the exemption will be made.
     */
    constructor(element) {
        if (!(element instanceof HTMLElement))
            throw new Error('the element is not a HTMLElement');
        this.root = element;
        this.observer = new DomObserver(this);
    }
    /**
     * get the scroll height of the element.
     * @returns The scroll height of the element.
     */
    get scrollHeight() {
        return this.root.scrollHeight;
    }
    /**
     * get the scroll width of the element.
     * @returns The scroll width of the element.
     */
    get scrollWidth() {
        return this.root.scrollWidth;
    }
    /**
     * get the scroll top of the element.
     * @returns The scroll top of the element.
    */
    get scrollTop() {
        return this.root.scrollTop;
    }
    /**
     * set the scroll top of the element.
     * @returns The scroll top of the element.
    */
    set scrollTop(value) {
        this.root.scrollTop = value;
    }
    /**
     * get the client height of the element.
     * @returns The client height of the element.
     */
    get clientHeight() {
        return this.root.clientHeight;
    }
    /**
     * get the client width of the element.
     * @returns The client width of the element.
     */
    get clientWidth() {
        return this.root.clientWidth;
    }
    /**
     * get the offset height of the element.
     * @returns The offset height of the element.
     */
    get offsetHeight() {
        return this.root.offsetHeight;
    }
    /**
     * get the offset width of the element.
     * @returns The offset width of the element.
     */
    get offsetWidth() {
        return this.root.offsetWidth;
    }
    /**
     * get the classList of the element.
     * @returns The classList of the element.
     */
    get classList() {
        return this.root.classList;
    }
    /**
     * get the class of the element.
     * @returns The class of the element.
     */
    get class() {
        return this.root.className;
    }
    /**
     * set the class of the element.
     * @returns The class of the element.
     */
    set class(value) {
        this.root.className = value;
    }
    /**
     * get the style of the element.
     * @returns The style of the element.
     */
    get style() {
        return this.root.style;
    }
    /**
     * get the id of the element.
     * @returns The id of the element.
     */
    get id() {
        return this.root.id;
    }
    /**
     * set the id of the element.
     * @returns The id of the element.
     */
    set id(value) {
        this.root.id = value;
    }
    /**
     * gets the text content of the element.
     * @returns The text content of the element.
     */
    get text() {
        return this.root.innerText;
    }
    /**
     * sets the text content of the element.
     */
    set text(text) {
        this.root.innerText = text;
    }
    /**
     * gets the html content of the element.
     * @returns The html content of the element.
     */
    get html() {
        return this.root.innerHTML;
    }
    /**
     * Sets the html content of the element.
     * @param html The html to set.
     */
    set html(html) {
        this.root.innerHTML = html;
    }
    /**
     * gets the value of the element.
     * @returns The value of the element.
     */
    get isConnected() {
        return this.root.isConnected;
    }
    /**
     * Check if the element contains the child.
     * @param element The element to check.
     */
    contains(element) {
        if (element instanceof HTMLElement)
            return this.root.contains(element);
        else if (element instanceof Element)
            return this.root.contains(element.root);
        else if (element instanceof Component)
            return this.root.contains(element.element.root);
        else
            throw new Error('the element is not a HTMLElement or Element or Component.');
    }
    /**
     * Appends one/multiple children to an element.
     * @param childs The elements to be appended.
     */
    append(...childs) {
        for (let child of childs) {
            if (child instanceof HTMLElement)
                this.root.appendChild(child);
            else if (child instanceof Element)
                this.append(child.root);
            else if (child instanceof Component)
                this.append(child.element);
            else if (child instanceof Object)
                this.append(Element.structure(child));
            else
                throw new Error('the element is not a HTMLElement or Element or Component');
        }
        return this;
    }
    /**
     * Replaces this element with another.
     * @param element The element that will replace this one.
     */
    replaceWith(element) {
        if (element instanceof HTMLElement)
            this.root.replaceWith(element);
        else if (element instanceof Element)
            this.replaceWith(element.root);
        else if (element instanceof Component)
            this.replaceWith(element.element);
        else if (element instanceof Object)
            this.replaceWith(Element.structure(element));
        else
            throw new Error('the element is not a HTMLElement or Element or Component');
        return this;
    }
    /**
     * Removes one/multiple children from an element.
     * @param childs The elements to be removed.
     */
    removeChild(...childs) {
        for (let child of childs) {
            if (child instanceof HTMLElement)
                this.root.removeChild(child);
            else if (child instanceof Element)
                this.removeChild(child.root);
            else if (child instanceof Component)
                this.removeChild(child.element);
            else
                throw new Error('the element is not a HTMLElement or Element or Component');
        }
        return this;
    }
    /**
     * Clones this element.
     * @returns The cloned element.
     */
    clone() {
        const newHtmlElement = this.root.cloneNode(true);
        return new Element(newHtmlElement);
    }
    /**
     * Removes this element from the DOM.
     * @returns The element that was removed.
     */
    remove() {
        this.root.remove();
        return this;
    }
    /**
     * Animates the element.
     * @param keyframes The keyframes of the animation.
     * @param options The options of the animation.
     * @returns The animation.
     */
    animate(keyframes, options) {
        return this.root.animate(keyframes, options);
    }
    /**
     * Appends this element to a parent.
     * @param parent The parent to append this element.
     */
    appendTo(parent) {
        if (parent instanceof HTMLElement)
            parent.appendChild(this.root);
        else if (parent instanceof Element)
            parent.root.appendChild(this.root);
        else if (parent instanceof Component)
            parent.append(this.root);
        else
            throw new Error('the parent is not a HTMLElement or Element');
        return this;
    }
    /**
     * Adds multiple events to the element.
     * @param events The events to add.
     */
    addEvents(events) {
        for (const key in events) {
            const event = key;
            const listener = events[event];
            if (!listener)
                throw new Error('the event no have a listener.');
            this.on(event, listener);
        }
        return this;
    }
    /**
     * Adds an event listener to the element.
     * @param eventName The name of the event to listen for.
     * @param listener The function to call when the event occurs.
     * @param options The options for the event listener.
     */
    on(eventName, listener, options) {
        this.root.addEventListener(eventName, listener, options);
        return this;
    }
    /**
     * Adds an once event listener to the element.
     * @param eventName The name of the event to listen for.
     * @param listener The function to call when the event occurs.
     * @param options The options for the event listener.
     */
    once(eventName, listener, options) {
        options = !options || typeof options === 'boolean' ? { once: true } : { ...options, once: true };
        this.root.addEventListener(eventName, listener, options);
        return this;
    }
    /**
     * Removes a previously added event listener from the element.
     * @param eventName - The name of the event whose listener should be removed.
     * @param listener - The function to remove, which was previously added as a listener for the event.
     * @param option - Optional configuration to match the options used when adding the event listener.
     * @returns The current element instance to allow method chaining.
     */
    off(eventName, listener, option) {
        this.root.removeEventListener(eventName, listener, option);
        return this;
    }
    removeEventListener = this.off;
    addEventListener = this.on;
    /**
     * Sets an attribute on the element.
     * @param name The name of the attribute.
     * @param value The value of the attribute.
     */
    setAttribute(name, value) {
        this.root.setAttribute(name, value);
        return this;
    }
    /**
     * Gets the value of an attribute on the element.
     * @param name The name of the attribute.
     */
    getAttribute(name) {
        return this.root.getAttribute(name);
    }
    /**
     * set multiple attributes on the element.
     * @param attributes The attributes to set.
     */
    setAttributes(attributes) {
        for (let Attrib in attributes) {
            this.setAttribute(Attrib, attributes[Attrib]);
        }
        return this;
    }
    /**
     * Removes an attribute from the element.
     * @param name The name of the attribute to remove.
     */
    removeAttribute(name) {
        this.root.removeAttribute(name);
        return this;
    }
    /**
     * Clears the element.
     * - that will be remove the children and the text.
     * @returns The element.
     */
    clean() {
        this.root.innerText = '';
        return this;
    }
    /**
     * Gets an element from the DOM.
     * @param selector The selector to use.
     * @returns The element, or null if not found.
     */
    static get(selector) {
        let Selection = document.querySelector(selector);
        return Selection ? new Element(Selection) : null;
    }
    /**
     * Creates a new element.
     * @param type The type of element to create.
     * @param text The text to set.
     * @param attribs The attributes to set.
     * @param events The events to add.
     * @param childs The children to append.
     * @returns The new element.
     */
    static new(type, text, attribs, events, childs) {
        let NewElement = new Element(document.createElement(type));
        if (text)
            NewElement.html = text;
        if (attribs)
            NewElement.setAttributes(attribs);
        if (events)
            NewElement.addEvents(events);
        if (childs)
            NewElement.append(...childs);
        return NewElement;
    } /**
     * Creates a new element from a structure.
     * @param structure The structure of the element.
     * @returns The new element.
     */
    static structure(structure) {
        return this.new(structure.type, structure.text ?? null, structure.attribs ?? null, structure.events ?? null, structure.childs ?? null);
    }
}
export default Element;
