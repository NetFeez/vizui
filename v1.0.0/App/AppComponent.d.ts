/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Add the AppComponent class.
 * @module vizui
 * @license Apache-2.0
 */
import Element from '../Element.js';
declare class AppComponent {
    private root;
    /**
     * Creates an instance of AppComponent.
     * @param root The root element of the component.
     */
    constructor(root: Element);
    /**
     * Gets the root element of the component.
     * @returns The root element of the component.
     */
    getElement(): Element;
    /**
     * Appends content to the root element of the component.
     * @param content The content to append.
     * @returns The component instance.
     */
    render(...content: Element[]): AppComponent;
    /**
     * Cleans the root element of the component.
     * @returns The component instance.
     */
    clean(): AppComponent;
    /**
     * Removes the root element of the component.
     * @returns The component instance.
     */
    remove(): AppComponent;
    /**
     * Clones the root element of the component.
     * @returns The cloned component instance.
     */
    clone(): AppComponent;
}
export default AppComponent;
