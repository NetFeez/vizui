/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Dynamic CSS loader with caching.
 * @license Apache-2.0
 */

import Element from '../core/element/Element.js';
import Store from '../state/Store.js';

export class CSS {
    private static FINALIZER = new FinalizationRegistry<CSS.Entry>((entry) => {
        const current = CSS.cache.get(entry.url);
        if (current !== entry) return;
        const element = entry.element.deref();
        if (element) CSS.live.smartSet(links => links.filter(link => link !== element) );
        CSS.cache.delete(entry.url);
    });

    private static live: Store<CSS.Link[]> = new Store<CSS.Link[]>([]);
    private static cache: Map<string, CSS.Entry> = new Map();

    static { Element.head.append(CSS.live); }

    /**
     * Loads a stylesheet from a URL and caches it, replacing any previous entry for the same URL.
     * @param url - The URL of the stylesheet to load.
     * @param reference - The base URL or import meta to resolve against.
     */
    public static load(url: string | URL, reference: string | URL | ImportMeta): void {
        url = CSS.normalize(url, reference);
        const hash = CSS.hash(url);
        let entry = CSS.cache.get(hash);
        if (entry) {
            if (entry.loaded) return;
            CSS.unload(entry);
        }
        const link = CSS.create(url);
        entry = {
            url: url.toString(),
            loaded: false,
            element: new WeakRef(link),
        };
        CSS.cache.set(hash, entry);
        CSS.live.smartSet((links) => links.concat(link));
    }

    /**
     * Unloads a stylesheet entry from the cache and removes its link element from the document.
     * @param entry - The stylesheet entry to unload.
     */
    private static unload(entry: CSS.Entry): void {
        entry.loaded = false;
        const element = entry.element.deref();
        if (element) CSS.live.smartSet((links) => links.filter(link => link !== element));
        CSS.FINALIZER.unregister(entry.element);
        CSS.cache.delete(entry.url);
    }

    /**
     * Creates a new link element for a stylesheet URL, with load and error handlers.
     * @param url - The stylesheet URL to load.
     * @returns A link element for the stylesheet.
     */
    private static create(url: URL): CSS.Link {
        function load(this: CSS.Link, event: Event): void {
            this.offOnce('error', error);
            const hash = CSS.hash(new URL(url.toString()));
            const entry = CSS.cache.get(hash);
            if (entry) {
                entry.loaded = true;
                CSS.FINALIZER.register(this, entry);
            } else {
                console.warn(`CSS: Loaded stylesheet ${url.toString()} was not registered in cache.`);
                if (!CSS.live.state.includes(this)) return void this.remove().unbindAll();
                CSS.live.smartSet((links) => links.filter(link => link !== this));
                CSS.FINALIZER.unregister(this);
            }
        }
        function error(this: CSS.Link, event: Event): void {
            this.offOnce('load', load)
            console.error(`CSS: Failed to load stylesheet ${url.toString()}.`);
            const hash = CSS.hash(url);
            const entry = CSS.cache.get(hash);
            if (entry) {
                entry.loaded = false;
                CSS.cache.delete(hash);
            }
            if (!CSS.live.state.includes(this)) return void this.remove().unbindAll();
            CSS.live.smartSet((links) => links.filter(link => link !== this));
        }
        const href = url.toString();
        const link = Element.create('link').setAttributes({
            rel: 'stylesheet',
            href,
            'data-vizui': Math.random().toString(36).substring(2, 15),
        }).once('load', load).once('error', error);
        return link;
    }

    /**
     * Normalizes a stylesheet URL relative to a reference.
     * @param url - The stylesheet URL to normalize.
     * @param reference - The base URL or import meta to resolve against.
     * @returns A normalized URL object.
     */
    private static normalize(url: string | URL, reference: string | URL | ImportMeta): URL {
        if (typeof reference === 'string') return new URL(url, reference);
        if (reference instanceof URL) return new URL(url, reference);
        return new URL(url, reference.url);
    }

    /**
     * Generates a unique hash for a stylesheet URL.
     * @param url - The stylesheet URL to hash.
     * @returns A unique string representing the URL.
     */
    private static hash(url: URL): string {
        return url.toString();
    }
}

export namespace CSS {
    export type Link = Element<HTMLLinkElement>;
    export interface Entry {
        url: string;
        loaded: boolean;
        element: WeakRef<CSS.Link>;
    }
}

export default CSS;
