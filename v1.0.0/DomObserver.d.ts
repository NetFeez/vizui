/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description adds an observer to an element
 * @module vizui
 * @license Apache-2.0
 */
import Element from "./Element.js";
import Events from "./Events.js";
export declare class DomObserver<T extends Element> extends Events<{
    [name in DomObserver.Type]: DomObserver.Listener<T>;
}> {
    readonly element: T;
    mutation: MutationObserver | null;
    intersection: IntersectionObserver | null;
    constructor(element: T);
    /**
     * count total of mutation event listeners
     * @returns number of event listeners
    */
    private mutationCount;
    /**
     * count total of intersection event listeners
     * @returns number of event listeners
    */
    private intersectionCount;
    /**
     * use to handle mutation events
     * @param mutations list of mutations
    */
    private handleMutation;
    /**
     * use to handle intersection events
     * @param entries list of entries
    */
    private handleIntersection;
    /**
     * check if the event is a mutation event
     * @param type type of event
     * @returns true if the event is a mutation event
    */
    private isMutationEvent;
    /**
     * check if the event is an intersection event
     * @param type type of event
     * @returns true if the event is an intersection event
    */
    private isIntersectionEvent;
    /**
     * initialize observer if is not initialized
     * @param type the type of event to check
    */
    private initObservers;
    /**
     * check if the type of observer not have events and disable the observer
     * @param type the type of event to check
    */
    private checkAndFinishObservers;
    /**
     * Add an event listener to the observer.
     * @param type The type of event to listen for.
     * @param listener The callback function to execute when the event occurs.
     */
    on(type: DomObserver.Type, listener: DomObserver.Listener<T>): void;
    /**
     * Add a one-time event listener to the observer.
     * @param type The type of event to listen for.
     * @param listener The callback function to execute when the event occurs.
     */
    once(type: DomObserver.Type, listener: DomObserver.Listener<T>): void;
    /**
     * Remove an event listener from the observer.
     * @param type The type of event to remove the listener from.
     * @param listener The listener function to remove.
     */
    off(type: DomObserver.Type, listener: DomObserver.Listener<T>): void;
    /**
     * Remove a one-time event listener from the observer.
     * @param type The type of event to remove the listener from.
     * @param listener The listener function to remove.
     */
    offOnce(type: DomObserver.Type, listener: DomObserver.Listener<T>): void;
    /**
     * Remove all event listeners of a specific type.
     * @param type The type of event to remove all listeners from.
     */
    ofAll(type: DomObserver.Type): void;
    /**
     * Remove all one-time event listeners of a specific type.
     * @param type The type of event to remove all listeners from.
     */
    ofAllOnce(type: DomObserver.Type): void;
}
export declare namespace DomObserver {
    type Listener<T> = (element: T) => void;
    type MutationType = 'add' | 'remove';
    type IntersectionType = 'visible' | 'hidden';
    type Type = MutationType | IntersectionType;
    interface Rule<T extends Element> {
        type: Type;
        listener: Listener<T>;
        once: boolean;
        observer?: MutationObserver | IntersectionObserver;
    }
}
export default DomObserver;
