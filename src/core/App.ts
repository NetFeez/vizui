/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description VizUI composition root. Owns the application outlet and wires
 * the router, shared state and application configuration.
 * @license Apache-2.0
 */

import Events from '../events/Events.js';

import Element from './element/Element.js';
import Component from './component/Component.js';
import Config from './Config.js';
import Router from './router/Router.js';
import Store from '../state/Store.js';

import { COMPONENT } from './symbols.js';

export class App<State = unknown> extends Events<App.EventMap> {
    /** The outlet element the application mounts into. **/
    public readonly root: Element;

    /** The application configuration. **/
    public readonly config: Config;

    /** The router driving the application. **/
    public readonly router: Router;

    /** The shared store, when one was provided. **/
    public readonly store: Store<State> | null;

    /** The pending initialization promise, once started. **/
    protected vInit: Promise<void> | null = null;

    /**
     * Creates the application composition root.
     * @param options - The application options: root outlet, config, router and store.
     */
    public constructor(options: App.Options<State>) {
        super();
        this.root = App.resolveRoot(options.root);
        this.config = options.config instanceof Config
            ? options.config
            : new Config(options.config);
        this.router = options.router ?? new Router({
            base: this.config.base,
            outlet: this.root,
        });
        this.router.outlet = this.root;
        this.store = options.store ?? null;
    }

    /** Whether the application has already been initialized. **/
    public get initialized(): boolean { return this.vInit !== null; }

    /** Initializes the router against the application's root outlet. **/
    public start(): Promise<void> {
        if (!this.vInit) {
            this.vInit = this.router.init().then(() => { this.emit('start'); });
        }
        return this.vInit;
    }

    /**
     * Appends auxiliary content into the application root without engaging the
     * router. The router owns the outlet and replaces the root content on the
     * next navigation; use this only for shell content mounted around routing.
     * @param content - The components, elements or HTMLElements to append.
     * @returns This app, for chaining.
     */
    public render(...content: Component.ChildType[]): this {
        for (const child of content) {
            if (COMPONENT in child) child.appendTo(this.root);
            else this.root.append(child);
        }
        return this;
    }

    /**
     * Resolves the root outlet from the supported source kinds.
     * @param source - The element, component, HTMLElement or selector to resolve.
     * @returns The resolved root element.
     * @throws When a selector source does not match any element in the document.
     */
    protected static resolveRoot(source: App.RootSource): Element {
        if (source instanceof Element) return source;
        if (source instanceof Component) return source.root;
        if (typeof HTMLElement !== 'undefined' && source instanceof HTMLElement) return new Element(source);
        if (typeof source === 'string') {
            const root = Element.get(source);
            if (root) return root;
        }
        throw new Error('[App] The root element was not found.');
    }
}

export namespace App {
    export interface Options<State = unknown> {
        /** The outlet the application mounts into. **/
        root: RootSource;

        /** The application configuration, or its raw options. **/
        config?: Config | Config.Options;

        /** A custom router, when the default one must be replaced. **/
        router?: Router;

        /** The shared store, when the application uses global state. **/
        store?: Store<State>;
    }

    /** The supported kinds of root outlet sources. **/
    export type RootSource = Element | Component | HTMLElement | string;

    /** The events emitted by the application lifecycle. **/
    export type EventMap = {
        /** The router finished initializing against the root outlet. **/
        start: [];
    };
}

export default App;