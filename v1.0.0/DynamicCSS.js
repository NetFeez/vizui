import Element from './Element.js';
export class DynamicCSS {
    static cache = new Map();
    /**
     * Loads an external css file.
     * @param url - The url of the css file.
     * @returns A promise that resolves when the css file is loaded.
     */
    static load(url) {
        url = url.trim().replace(/\/$/g, '');
        const early = this.checkCacheOrDOM(url);
        if (early)
            return early;
        const link = Element.new('link', null, { rel: 'stylesheet', href: url });
        const promise = new Promise(resolve => {
            link.once('load', this.loadHandler.bind(this, url, resolve));
            link.once('error', this.errorHandler.bind(this, url, resolve));
            link.appendTo(Element.head);
        });
        this.cache.set(url, promise);
        return promise;
    }
    /**
     * Checks if an external css file is already loaded.
     * @param url - The url of the css file.
     * @returns A promise that resolves when the css file is loaded.
     */
    static checkCacheOrDOM(url) {
        const cached = this.cache.get(url);
        if (cached)
            return cached;
        const current = Element.head.querySelector(`link[href="${url}"]`);
        if (current)
            return Promise.resolve(true);
        return null;
    }
    /**
     * Handler load success.
     * @param url - The url of the css file.
     * @param resolve - The resolve function.
     */
    static loadHandler(url, resolve) {
        console.log(`[dynCSS] loaded css from: ${url}`);
        resolve(true);
    }
    /**
     * Handle load failure.
     * @param url - The url of the css file.
     * @param resolve - The resolve function.
     */
    static errorHandler(url, resolve) {
        console.log(`[dynCSS] failed to load css from: ${url}`);
        resolve(false);
        this.cache.delete(url);
    }
}
export default DynamicCSS;
