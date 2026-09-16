/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Abstract reactive contract: a store subscription that renders new values into a target.
 * @license Apache-2.0
 */

import { DESTROYABLE, IsDestroyable } from '../../support/Contracts.js';

import Store from '../../state/Store.js';

export abstract class Reactive<T> implements IsDestroyable {
    public readonly [DESTROYABLE] = true;

    /** The kind of target the reactive renders into. **/
    public abstract readonly type: Reactive.Type;

    /** The instance id of the reactive, unique per binding. **/
    public abstract readonly id: string;
    public readonly store: Store<T>;

    private vUnsubscribe: Store.Unsubscribe | null = null;
    private vListener: Store.Listener<T> | null = null;

    protected constructor(store: Store<T>) {
        this.store = store.select(s => s);
    }

    /**
     * Re-renders the reactive from a new state.
     * @param value - The new state to render.
     */
    public abstract render(value: T): void;

    /**
     * Subscribes the reactive to the store, triggering future updates.
     *
     * @remarks Can be overridden to add custom subscription logic, but should call `super.subscribe()` to ensure the store subscription is added. Calling it while already subscribed is a no-op.
     *
     * The store holds the subscription weakly (see {@link Store.subscribeWeak}): it stores a
     * `WeakRef` to the listener, so the reactive is never retained by the store. The listener does
     * not capture this reactive strongly either: it references it through a `WeakRef`, so the
     * reactive remains collectable even when an engine keeps the listener closure alive. Once the
     * reactive is unreachable, the store drops the subscription on the next emission.
     */
    public subscribe(): void {
        if (this.vUnsubscribe) return;
        const target = new WeakRef(this);
        this.vListener = (value) => target.deref()?.render(value);
        this.vUnsubscribe = this.store.subscribeWeak(this.vListener);
    }

    /**
     * Detaches the reactive from the store, stopping future updates.
     *
     * @remarks Can be overridden to add custom cleanup logic, but should call `super.unsubscribe()` to ensure the store subscription is removed.
     */
    public unsubscribe(): void {
        if (!this.vUnsubscribe) return;
        this.vUnsubscribe();
        this.vListener = this.vUnsubscribe = null;
    }

    /**
     * Destroys the reactive, unsubscribing it from the store and releasing any resources.
     *
     * @remarks Can be overridden to add custom cleanup logic, but should call `super.destroy()` to ensure the store subscription is removed.
     */
    public destroy(): void {
        this.unsubscribe();
    }
}

export namespace Reactive {
    /** The kind of target a reactive renders into. **/
    export type Type = 'child' | 'attribute' | (string & {});

    /** A predicate selecting reactives for teardown. **/
    export type Filter = (reactive: Reactive<any>) => boolean;
}

export default Reactive;