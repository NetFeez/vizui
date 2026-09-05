/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Base class for page-level components (views) mountable by the router.
 * @license Apache-2.0
 */

import Component from './Component.js';
import Events from '../../events/Events.js';

export abstract class View<T extends HTMLElement = HTMLDivElement, eventMap extends Events.EventMap = Events.EventMap> extends Component<T, eventMap> {
    /**
     * Loads data for the view given a route entry. Optional when the route declares its own loader.
     * @param entry The route entry.
     */
    public load?(entry: View.Entry): void | Promise<void>;
    /**
     * Paints the view, optionally with data produced by a loader.
     * @param data The resolved data.
     */
    public render?(data?: unknown): void | Promise<void>;
}

export namespace View {
    export interface Entry {
        path: string;
        params: Record<string, string | undefined>;
        query: URLSearchParams;
    }
}
export default View;
