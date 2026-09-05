/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Dynamic CSS loader with caching.
 * @license Apache-2.0
 */

import Element from '../element/Element.js';

export class Css {
    private static readonly vCache = new Map<string, Promise<boolean>>();
    /**
     * Loads an external css file.
     * @param url The url of the css file.
     * @returns A promise that resolves when the css file is loaded.
     */
    public static load(path: string, meta: ImportMeta | null = null): Promise<boolean> {
        path = path.trim().replace(/\/$/g, '');
        const url = new URL(path, meta?.url || window.location.href).href;
        const early = this.checkCacheOrDOM(url);
        if (early) return early;
        const link = Element.new('link')
            .setAttribute('rel', 'stylesheet')
            .setAttribute('href', url);
        const promise = new Promise<boolean>(resolve => {
            link.once('load', () => resolve(true));
            link.once('error', () => {
                Css.vCache.delete(url);
                resolve(false);
            });
            link.appendTo(Element.head);
        });
        this.vCache.set(url, promise);
        return promise;
    }
    /**
     * Checks whether a css file is already cached or present in the DOM.
     * @param url The url of the css file.
     * @returns A cached promise, or null if not loaded.
     */
    private static checkCacheOrDOM(url: string): Promise<boolean> | null {
        const cached = this.vCache.get(url);
        if (cached) return cached;
        const current = Element.head.querySelector(`link[href="${url}"]`);
        if (current) return Promise.resolve(true);
        return null;
    }
}
export default Css;
