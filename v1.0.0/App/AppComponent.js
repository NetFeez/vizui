class AppComponent {
    root;
    /**
     * Creates an instance of AppComponent.
     * @param root The root element of the component.
     */
    constructor(root) {
        this.root = root;
    }
    /**
     * Gets the root element of the component.
     * @returns The root element of the component.
     */
    getElement() { return this.root; }
    /**
     * Appends content to the root element of the component.
     * @param content The content to append.
     * @returns The component instance.
     */
    render(...content) {
        this.clean();
        this.root.append(...content);
        return this;
    }
    /**
     * Cleans the root element of the component.
     * @returns The component instance.
     */
    clean() {
        this.root.clean();
        return this;
    }
    /**
     * Removes the root element of the component.
     * @returns The component instance.
     */
    remove() {
        this.root.remove();
        return this;
    }
    /**
     * Clones the root element of the component.
     * @returns The cloned component instance.
     */
    clone() {
        const clonedElement = this.root.clone();
        return new AppComponent(clonedElement);
    }
}
export default AppComponent;
