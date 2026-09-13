/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Dynamic CSS loader with caching.
 * @license Apache-2.0
 */

import Element from '../core/element/Element.js';

export class CSS {
    /** The cache of in-flight or completed stylesheet loads, by absolute url. **/
    private static readonly vCache = new Map<string, Promise<boolean>>();

    /**
     * Loads an external css file, deduplicating concurrent and repeated loads.
     * @param path - The path of the css file, resolved against `meta.url` when provided.
     * @param meta - The `import.meta` of the calling module, used to resolve relative paths.
     * @returns A promise resolving to whether the stylesheet loaded successfully.
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
                CSS.vCache.delete(url);
                resolve(false);
            });
            link.appendTo(Element.head);
        });
        this.vCache.set(url, promise);
        return promise;
    }

    /**
     * Checks whether a css file is already cached or present in the DOM.
     * @param url - The url of the css file.
     * @returns A cached promise, or null when the file was not loaded.
     */
    private static checkCacheOrDOM(url: string): Promise<boolean> | null {
        const cached = this.vCache.get(url);
        if (cached) return cached;
        const current = Element.head.querySelector(`link[href="${url}"]`);
        if (current) return Promise.resolve(true);
        return null;
    }
}
export default CSS;
