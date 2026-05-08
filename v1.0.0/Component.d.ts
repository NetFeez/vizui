/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description adds a class to create components with js/ts.
 * @module vizui
 * @license Apache-2.0
 */
import Element from "./Element.js";
import Events from "./Events.js";
import DynamicCSS from "./DynamicCSS.js";
export declare abstract class Component<T extends keyof Element.Type, eventMap extends Events.EventMap = Events.EventMap> extends Events<eventMap> implements Component.Component<T> {
    /** The dynamic css loader. */
    protected static readonly css: typeof DynamicCSS;
    /** The root element. */
    protected readonly abstract root: Element<T>;
    /** The component element. */
    get element(): Element<T>;
    /** Gets if the element is connected with the DOM. */
    get isConnected(): boolean;
    /**
     * Renders the component.
     * @param parent The parent element.
     * @param clean If true, the parent element will be cleaned.
     * @returns The component.
     */
    render(parent: Component.parentType, clean?: boolean): this;
    /**
     * Appends one/multiple children to the component.
     * @param childs The elements to be appended.
     */
    append(...childs: Element.ChildType[]): this;
    /**
     * Appends this element to a parent.
     * @param parent The parent to append this element.
     */
    appendTo(parent: Element.AcceptedTypes): this;
    /**
     * Replace this component for other component/element.
     * @param element - The new element.
     * @returns This component.
     */
    replaceWith(element: Element.ChildType): this;
    /**
     * Remove this component.
     * @returns This component.
     */
    remove(): this;
}
export declare namespace Component {
    type parentType = Element<any> | HTMLElement;
    interface Component<T extends keyof Element.Type> {
        readonly element: Element<T>;
        readonly isConnected: boolean;
    }
}
export default Component;
