/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Renders a store into a single attribute of an element.
 * @license Apache-2.0
 */

import Store from '../../state/Store.js';

import Reactive from './Reactive.js';

export class Attribute extends Reactive<string | null> {
    /** The subscription type, used by reactive filters. **/
    public readonly type = 'attribute' as const;

    /** The instance id of this attribute binding. **/
    public readonly id: string;

    /** The element the attribute belongs to. **/
    private readonly vTarget: HTMLElement;

    /** The attribute name. **/
    private readonly vName: string;

    /**
     * Binds a store to an attribute of an element.
     * @param store - The store providing the attribute value.
     * @param target - The element the attribute belongs to.
     * @param name - The attribute name.
     */
    public constructor(store: Store<string | null>, target: HTMLElement, name: string) {
        super(store);
        this.vTarget = target;
        this.vName = name;
        this.id = `${name}:${Math.random().toString(36).slice(2, 9)}`;
        this.render(store.state);
        this.subscribe();
    }

    /**
     * Writes the attribute value to the element, removing it when absent.
     * @param value - The new attribute value.
     */
    public override render(value: string | null): void {
        if (value === null || value === undefined) this.vTarget.removeAttribute(this.vName);
        else this.vTarget.setAttribute(this.vName, value);
    }
}

export namespace Attribute {
}

export default Attribute;