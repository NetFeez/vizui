/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Observes mutation and intersection events on an element.
 * @license Apache-2.0
 */

import Element from './Element.js';
import Events from './Events.js';

export class DomObserver<T extends Element> extends Events<{
    [name in DomObserver.Type]: DomObserver.Params<T>
}> {
    public mutation: MutationObserver | null;
    public intersection: IntersectionObserver | null;
    public constructor(
        public readonly element: T
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
     * @param mutations The list of mutations.
     */
    private handleMutation(mutations: MutationRecord[]): void {
        for (const mutation of mutations) {
            if (mutation.type !== 'childList') continue;
            if ([...mutation.addedNodes].some((node) => node.contains(this.element.root))) {
                this.emit('add', this.element);
            }
            if ([...mutation.removedNodes].some((node) => node.contains(this.element.root))) {
                this.emit('remove', this.element);
            }
        }
    }
    /**
     * Handles intersection events.
     * @param entries The list of entries.
     */
    private handleIntersection(entries: IntersectionObserverEntry[]): void {
        for (const entry of entries) {
            if (entry.isIntersecting) this.emit('visible', this.element);
            else this.emit('hidden', this.element);
        }
    }
    /**
     * Checks if the event is a mutation event.
     * @param type The type of event.
     * @returns True if the event is a mutation event.
     */
    private isMutationEvent(type: DomObserver.Type): boolean {
        return type === 'add' || type === 'remove';
    }
    /**
     * Checks if the event is an intersection event.
     * @param type The type of event.
     * @returns True if the event is an intersection event.
     */
    private isIntersectionEvent(type: DomObserver.Type): boolean {
        return type === 'visible' || type === 'hidden';
    }
    /**
     * Initializes the observer if it is not initialized.
     * @param type The type of event to check.
     */
    private initObservers(type: DomObserver.Type): void {
        if (this.isMutationEvent(type)) {
            if (!this.mutation) {
                this.mutation = new MutationObserver(this.handleMutation.bind(this));
                this.mutation.observe(document, { subtree: true, childList: true });
            }
        } else if (this.isIntersectionEvent(type)) {
            if (!this.intersection) this.intersection = new IntersectionObserver(this.handleIntersection.bind(this));
            this.intersection.observe(this.element.root);
        }
    }
    /**
     * Checks if the type of observer no longer has events and disables the observer.
     * @param type The type of event to check.
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
    /**
     * Adds an event listener to the observer.
     * @param type The type of event to listen for.
     * @param listener The callback function to execute when the event occurs.
     */
    public on(type: DomObserver.Type, listener: DomObserver.Listener<T>): void {
        super.on(type, listener);
        this.initObservers(type);
    }
    /**
     * Adds a one-time event listener to the observer.
     * @param type The type of event to listen for.
     * @param listener The callback function to execute when the event occurs.
     */
    public once(type: DomObserver.Type, listener: DomObserver.Listener<T>): void {
        super.once(type, listener);
        this.initObservers(type);
    }
    /**
     * Removes an event listener from the observer.
     * @param type The type of event to remove the listener from.
     * @param listener The listener function to remove.
     */
    public off(type: DomObserver.Type, listener: DomObserver.Listener<T>): void {
        super.off(type, listener);
        this.checkAndFinishObservers(type);
    }
    /**
     * Removes a one-time event listener from the observer.
     * @param type The type of event to remove the listener from.
     * @param listener The listener function to remove.
     */
    public offOnce(type: DomObserver.Type, listener: DomObserver.Listener<T>): void {
        super.offOnce(type, listener);
        this.checkAndFinishObservers(type);
    }
    /**
     * Removes all event listeners of a specific type.
     * @param type The type of event to remove all listeners from.
     */
    public ofAll(type: DomObserver.Type): void {
        super.offAll(type);
        this.checkAndFinishObservers(type);
    }
    /**
     * Removes all one-time event listeners of a specific type.
     * @param type The type of event to remove all listeners from.
     */
    public ofAllOnce(type: DomObserver.Type): void {
        super.offAllOnce(type);
        this.checkAndFinishObservers(type);
    }
}

export namespace DomObserver {
    export type Listener<element extends Element> = (...args: Params<element>) => void;
    export type Params<element extends Element> = [element: element];

    export type MutationType = 'add' | 'remove';
    export type IntersectionType = 'visible' | 'hidden';

    export type Type = MutationType | IntersectionType;

    export interface Rule<T extends Element> {
        type: Type;
        listener: Listener<T>;
        once: boolean;
        observer?: MutationObserver | IntersectionObserver;
    }
}

export default DomObserver;
