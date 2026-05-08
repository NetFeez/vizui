/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Adds a class that manages events.
 * @module vizui
 * @license Apache-2.0
 */
export declare class Events<eventMap extends Events.EventMap = Events.EventMap> {
    private listeners;
    private onceListeners;
    /**
     * Adds an event to the EventManager.
     * @param name The name of the event.
     * @param listener The callback that will be executed.
     */
    on<E extends string & keyof eventMap>(name: E, listener: eventMap[E]): void;
    /**
     * Adds an once event to the EventManager.
     * @param name The name of the event.
     * @param callback The callback that will be executed.
     */
    once<E extends string & keyof eventMap>(name: E, listener: eventMap[E]): void;
    /**
     * Removes an event from the EventManager.
     * @param name The name of the event to remove.
     * @param listener The callback of the event to remove.
     */
    off<E extends string & keyof eventMap>(name: E, listener: eventMap[E]): void;
    /**
     * Removes an once event from the EventManager.
     * @param name The name of the event to remove.
     * @param listener The callback of the event to remove.
     */
    offOnce<E extends string & keyof eventMap>(name: E, listener: eventMap[E]): void;
    /**
     * Removes all listeners from an event.
     * @param name The name of the event from which the callbacks will be removed.
     */
    offAll(name: string): void;
    /**
     * Removes all listeners from an once event.
     * @param name The name of the event from which the callbacks will be removed.
     */
    offAllOnce(name: string): void;
    /**
     * Executes an event.
     * @param name The name of the event to execute.
     * @param args The arguments that will be passed to the callbacks.
     */
    protected emit<E extends string & keyof eventMap>(name: E, ...args: Parameters<eventMap[E]>): void;
    /**
     * Returns the number of callbacks of an event.
     * @param name The name of the event.
     * @returns The number of callbacks of the event.
     */
    eventCount(name: string): number;
}
export declare class PublicEmitter<eventMap extends Events.EventMap = Events.EventMap> extends Events<eventMap> {
    emit<E extends string & keyof eventMap>(name: E, ...args: Parameters<eventMap[E]>): void;
}
export declare namespace Events {
    type Listener = (...args: any[]) => void;
    type ListenerList<eventMap extends EventMap> = {
        [name in keyof eventMap]?: Set<eventMap[name]>;
    };
    interface EventMap {
        [name: string]: Listener;
    }
}
export default Events;
