/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Vizui is a module to create web applications SPA with js/ts.
 * @module vizui
 * @license Apache-2.0
 */
import Element from "../Element.js";
import Events from "../Events.js";
import _Router from "./Router.js";
import AppComponent from "./AppComponent.js";
export { default as Router } from "./Router.js";
export declare class App extends Events<App.eventMap> {
    private static instance;
    readonly root: Element<'div'>;
    readonly router: App.Router;
    private isInit;
    private components;
    /**
     * Private constructor for the App class.
     * @param rootElement The root element of the application.
     * @param components The components of the application.
     */
    private constructor();
    /**
     * Get the instance of the App class.
     * @param rootElement The root element of the application.
     * @param components The components of the application.
     * @returns The instance of the App class.
     */
    static getInstance(rootElement?: string | Element | HTMLDivElement, components?: App.ComponentObject): App;
    /**
     * Set the components of the application.
     * @param component The components to set.
     */
    setComponents(component: App.ElementObject): void;
    /**
     * Add a component to the application.
     * @param name The name of the component.
     * @param component The component to add.
     */
    addComponent(name: string, component: Element): void;
    /**
     * Delete a component from the application.
     * @param name The name of the component to delete.
     */
    delComponent(name: string): void;
    /**
     * Get a component from the application.
     * @param name The name of the component to get.
     * @returns The component.
     */
    getComponent(name: string): AppComponent;
    /**
     * Render the root element of the application.
     * @param content The content to render.
     */
    renderRoot(...content: Element.ChildType[]): void;
    /**
     * Register a worker in the application.
     * @param url The url of the worker.
     * @param options The options of the worker.
     * @returns The worker registration.
     */
    registerWorker(url: string, options: App.WorkerOptions): Promise<ServiceWorkerRegistration | null>;
    /**
     * Initialize the application.
     */
    init(): void;
}
export declare namespace App {
    export import Router = _Router;
    type eventMap = {
        render: Events.Listener;
        routing: Events.Listener;
        routed: App.routedCallBack;
    };
    type appRenderer = App.Router.Rule.renderer;
    type appAuthenticator = App.Router.Rule.authenticator;
    type routedCallBack = (page: string) => void;
    type ElementObject = {
        [key: string]: Element;
    };
    interface ComponentObject {
        [key: string]: AppComponent;
    }
    interface WorkerOptions {
        type?: 'module' | 'classic';
        scope?: string;
        updateViaCache?: 'all' | 'imports' | 'none';
    }
}
export default App;
