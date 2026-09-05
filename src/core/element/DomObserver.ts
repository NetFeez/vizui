/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Observes mutation and intersection events on an element.
 * @license Apache-2.0
 */

import Events from '../../events/Events.js';

export class DomObserver<T extends HTMLElement = HTMLElement> extends Events<{
    [name in DomObserver.Type]: DomObserver.Params<T>
}> {
    public mutation: MutationObserver | null;
    public intersection: IntersectionObserver | null;
    public constructor(
        public readonly root: T
    ) { super();
        this.mutation = null;
        this.intersection = null;
    }
    
    /**
     * Counts the total of mutation event listeners.
     * @returns The number of mutation event listeners.
     */
    private mutationCount(): number {
        let count = 0;
        count += this.eventCount('add');
        count += this.eventCount('remove');
        return count;
    }

    /**
     * Counts the total of intersection event listeners.
     * @returns The number of intersection event listeners.
     */
    private intersectionCount(): number {
        let count = 0;
        count += this.eventCount('visible');
        count += this.eventCount('hidden');
        return count;
    }

    /**
     * Handles mutation events.
     * @param mutations - The list of mutations.
     */
    private handleMutation(mutations: MutationRecord[]): void {
        for (const mutation of mutations) {
            if (mutation.type !== 'childList') continue;
            if ([...mutation.addedNodes].some(node => node.contains(this.root))) this.emit('add', this.root);
            if ([...mutation.removedNodes].some(node => node.contains(this.root))) this.emit('remove', this.root);
        }
    }

    /**
     * Handles intersection events.
     * @param entries - The list of entries.
     */
    private handleIntersection(entries: IntersectionObserverEntry[]): void {
        for (const entry of entries) {
            if (entry.isIntersecting) this.emit('visible', this.root);
            else this.emit('hidden', this.root);
        }
    }

    /**
     * Checks whether the event type is a mutation event.
     * @param type - The type of event.
     */
    private isMutationEvent(type: DomObserver.Type): boolean { return type === 'add' || type === 'remove'; }

    /**
     * Checks whether the event type is an intersection event.
     * @param type - The type of event.
     */
    private isIntersectionEvent(type: DomObserver.Type): boolean { return type === 'visible' || type === 'hidden'; }

    /**
     * Initializes the observers for the specified event type.
     * @param type - The type of event to initialize.
     */
    private initObservers(type: DomObserver.Type): void {
        if (this.isMutationEvent(type)) {
            if (!this.mutation) {
                this.mutation = new MutationObserver(this.handleMutation.bind(this));
                this.mutation.observe(document, { subtree: true, childList: true });
            }
        } else if (this.isIntersectionEvent(type)) {
            if (!this.intersection) this.intersection = new IntersectionObserver(this.handleIntersection.bind(this));
            this.intersection.observe(this.root);
        }
    }

    /**
     * Checks whether the observer can be finished and disconnects it if it can.
     * @param type - The type of event to check.
     */
    private checkAndFinishObservers(type: DomObserver.Type): void {
        if (this.isMutationEvent(type)) {
            if (this.mutationCount() === 0 && this.mutation) {
                this.mutation.disconnect();
                this.mutation = null;
            }
        } else if (this.isIntersectionEvent(type)) {
            if (this.intersectionCount() === 0 && this.intersection) {
                this.intersection.disconnect();
                this.intersection = null;
            }
        }
    }

    public override on(type: DomObserver.Type, listener: DomObserver.Listener<T>): void {
        super.on(type, listener);
        this.initObservers(type);
    }
    public override once(type: DomObserver.Type, listener: DomObserver.Listener<T>): void {
        super.once(type, listener);
        this.initObservers(type);
    }
    public override off(type: DomObserver.Type, listener: DomObserver.Listener<T>): void {
        super.off(type, listener);
        this.checkAndFinishObservers(type);
    }

    public override offOnce(type: DomObserver.Type, listener: DomObserver.Listener<T>): void {
        super.offOnce(type, listener);
        this.checkAndFinishObservers(type);
    }

    public override offAll(type: DomObserver.Type): void {
        super.offAll(type);
        this.checkAndFinishObservers(type);
    }

    public override offAllOnce(type: DomObserver.Type): void {
        super.offAllOnce(type);
        this.checkAndFinishObservers(type);
    }
}

export namespace DomObserver {
    export type Listener<root extends HTMLElement> = (...args: Params<root>) => void;
    export type Params<root extends HTMLElement> = [root: root];
    export type MutationType = 'add' | 'remove';
    export type IntersectionType = 'visible' | 'hidden';
    export type Type = MutationType | IntersectionType;
}
export default DomObserver;