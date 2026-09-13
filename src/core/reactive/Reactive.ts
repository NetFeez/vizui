/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Abstract reactive contract: a store subscription that renders new values into a target.
 * @license Apache-2.0
 */

import Store from '../../state/Store.js';

export abstract class Reactive<T> {
    /** The kind of target the reactive renders into. **/
    public abstract readonly type: Reactive.Type;

    /** The instance id of the reactive, unique per binding. **/
    public abstract readonly id: string;

    private vUnsubscribe: Store.Unsubscribe | null = null;

    protected constructor(
        public readonly store: Store<T>
    ) {}

    /**
     * Re-renders the reactive from a new state.
     * @param value - The new state to render.
     */
    public abstract render(value: T): void;

    /**
     * Subscribes the reactive to the store, triggering future updates.
     *
     * @remarks Can be overridden to add custom subscription logic, but should call `super.subscribe()` to ensure the store subscription is added. Calling it while already subscribed is a no-op.
     */
    public subscribe(): void {
        if (this.vUnsubscribe) return;
        this.vUnsubscribe = this.store.subscribe(value => this.render(value));
    }

    /**
     * Detaches the reactive from the store, stopping future updates.
     *
     * @remarks Can be overridden to add custom cleanup logic, but should call `super.unsubscribe()` to ensure the store subscription is removed.
     */
    public unsubscribe(): void {
        if (!this.vUnsubscribe) return;
        this.vUnsubscribe();
        this.vUnsubscribe = null;
    }
}

export namespace Reactive {
    /** The kind of target a reactive renders into. **/
    export type Type = 'child' | 'attribute' | (string & {});

    /** A predicate selecting reactives for teardown. **/
    export type Filter = (reactive: Reactive<any>) => boolean;
}

export default Reactive;