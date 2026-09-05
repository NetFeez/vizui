/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description App composition root: wires router, components and root element.
 * @license Apache-2.0
 */
import Element from '../core/element/Element.js';
import Events from '../events/Events.js';

import _Router from './Router.js';

export { default as Router } from './Router.js';

export class App extends Events<App.eventMap> {
    private static vInstance: App;

    public readonly root: Element<HTMLElement>;
    public readonly router: App.Router;
    private vInit = false;
    private vComponents: Map<string, Element> = new Map();
    /**
     * Creates an instance of App.
     * @param rootElement The root element of the application.
     * @param components The components of the application.
     */
    private constructor(rootElement: string | HTMLElement | Element, components?: App.ComponentObject) { super();
        if (rootElement instanceof Element) this.root = rootElement;
        else if (rootElement instanceof HTMLElement) this.root = new Element(rootElement);
        else if (typeof rootElement === 'string') {
            const root = Element.get(rootElement);
            if (!root) throw new Error('root element not found');
            this.root = root;
        } else throw new Error('[App] root must be a Element an string or HTMLDivElement');
        this.router = new App.Router();
        if (components) this.vComponents = new Map(Object.entries(components));
    }
    /**
     * Get the singleton instance of the App class.
     * @param rootElement The root element of the application.
     * @param components The components of the application.
     * @returns The instance of the App class.
     */
    public static getInstance(rootElement?: string | Element | HTMLDivElement, components?: App.ComponentObject): App {
        if (App.vInstance) return App.vInstance;
        if (!rootElement) throw new Error('rootElement is required to init App singleton');
        App.vInstance = new App(rootElement, components);
        return App.vInstance;
    }
    /**
     * Set the components of the application.
     * @param component The components to set.
     */
    public setComponents(component: App.ElementObject): void {
        if (this.vInit) throw new Error('[setComponent]: App is already initialized');
        for (const key in component) {
            this.addComponent(key, component[key]);
        }
    }
    /**
     * Add a component to the application.
     * @param name The name of the component.
     * @param element The element of the component.
     */
    public addComponent(name: string, element: Element): void {
        if (this.vInit) throw new Error('[addComponent]: App is already initialized');
        this.vComponents.set(name, element);
    }
    /**
     * Delete a component from the application.
     * @param name The name of the component to delete.
     */
    public delComponent(name: string): void {
        if (this.vInit) throw new Error('[delComponent]: App is already initialized');
        this.vComponents.delete(name);
    }
    /**
     * Get a component from the application.
     * @param name The name of the component to get.
     * @returns The component.
     */
    public getComponent(name: string): Element {
        const component = this.vComponents.get(name);
        if (!component) throw new Error(`[getComponent]: Component "${name}" not found`);
        return component;
    }
    /**
     * Render the root element of the application.
     * @param content The content to render.
     */
    public renderRoot(...content: Element.ChildType[]): void {
        this.root.clean();
        this.root.append(...content);
    }
    /**
     * Register a worker in the application.
     * @param url The url of the worker.
     * @param options The options of the worker.
     * @returns The worker registration.
     */
    public async registerWorker(url: string, options: App.WorkerOptions): Promise<ServiceWorkerRegistration | null> {
        if (!navigator.serviceWorker) return null;
        try {
            const registration = await navigator.serviceWorker.register(url, options);
            if (registration.installing) console.log('[App]: worker installing: ', registration.installing);
            else if (registration.waiting) console.log('[App]: worker waiting: ', registration.waiting);
            else if (registration.active) console.log('[App]: worker active: ', registration.active);
            else console.log('[App]: worker not registered');
            return registration;
        } catch (err) {
            console.error('[App]: error registering worker: ', err);
            return null;
        }
    }
    /**
     * Initialize the application.
     */
    public init(): void {
        if (this.vInit) return;
        this.vInit = true;
        this.on('render', this.router.renderManager.bind(this.router, this));
        this.router.on('change', () => this.emit('render'));
        this.emit('render');
    }
}

export namespace App {
    export import Router = _Router;
    export type eventMap = {
        routed: [page: string];
        render: [];
        routing: [];
    }
    export type appRenderer = App.Router.Rule.renderer;
    export type appAuthenticator = App.Router.Rule.authenticator;
    export type ElementObject = {
        [key: string]: Element;
    }
    export interface ComponentObject {
        [key: string]: Element;
    }
    export interface WorkerOptions {
        type?: 'module' | 'classic';
        scope?: string;
        updateViaCache?: 'all' | 'imports' | 'none';
    }
}
export default App;
