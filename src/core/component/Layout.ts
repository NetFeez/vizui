/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Base class for layout components mounted by the router layout chain,
 * exposing the outlet region where routed content mounts.
 * @license Apache-2.0
 */

import { LAYOUT, IsLayout } from '../../support/Contracts.js';

import Component from './Component.js';
import Events from '../../events/Events.js';

import type Element from '../element/Element.js';

/**
 * Base class for layout components that expose the outlet region inside their
 * root where the router mounts the routed content.
 * @template T - The root element type of the layout.
 * @template EventMap - The event map of the layout.
 */
export abstract class Layout<T extends Component.Type = HTMLDivElement, eventMap extends Events.EventMap = Events.EventMap> extends Component<T, eventMap> implements IsLayout {
    public readonly [LAYOUT] = true;
    
    /** The region inside the layout root where routed content mounts. **/
    public abstract readonly outlet: Element | Component;
}

export default Layout;