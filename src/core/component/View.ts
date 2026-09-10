/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Base class for page-level components (views) mountable by the router.
 * @license Apache-2.0
 */

import { VIEW } from '../symbols.js';

import Component from './Component.js';
import Events from '../../events/Events.js';

/**
 * Base class for page-level components (views) mountable by the router.
 * @template T - The root element type of the view.
 * @template EventMap - The event map of the view.
 */
export abstract class View<T extends Component.Type = HTMLDivElement, eventMap extends Events.EventMap = Events.EventMap> extends Component<T, eventMap> {
    public readonly [VIEW] = true;

    /**
     * Loads data for the view given a route entry. Optional when the route
     * declares its own loader through `ShowRule.load`.
     * @param entry - The route entry.
     */
    public load?(entry: View.Entry): void | Promise<void>;

    /**
     * Paints the view, optionally with data produced by a loader.
     * @param data - The resolved data, when a loader produced it.
     */
    public render?(data?: unknown): void | Promise<void>;
}

export namespace View {
    /** A parsed navigation entry delivered to the view lifecycle. **/
    export interface Entry {
        /** The normalized path of the navigation. **/
        path: string;

        /** The route parameters extracted by the matched rule. **/
        params: Record<string, string | undefined>;

        /** The query string of the navigation. **/
        query: URLSearchParams;
    }
}
export default View;
