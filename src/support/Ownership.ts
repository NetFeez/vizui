/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Ownership management for destroyable objects.
 * @license Apache-2.0
 */

import { DESTROYABLE, IsDestroyable } from "./Contracts.js";

export class Ownership implements IsDestroyable {
    public readonly [DESTROYABLE] = true;
    
    private vOwned: Ownership.Owned = new Set();

    /** The owned targets of this instance, as a read-only view of the internal set. **/
    public get owned(): ReadonlySet<Ownership.Target> { return this.vOwned; }

    /**
     * Owns a destroyable object, either directly or via a WeakRef. The owned object will be destroyed when this Ownership instance is destroyed.
     * Passing the destroyable object directly establishes a strong ownership: the owner retains the target.
     * Passing a WeakRef establishes a weak ownership: the owner never retains the target, so the target must be kept alive elsewhere; if it is garbage collected before destruction, it is skipped.
     * @param target - The destroyable object or WeakRef to own.
     *
     * @remarks Dead WeakRef entries are pruned lazily on each {@link own} call, so a long-lived ownership instance does not accumulate collected targets.
     */
    public own(target: Ownership.Target): void {
        this.prune();
        if (target instanceof WeakRef && !target.deref()) return;
        this.vOwned.add(target);
    }

    /**
     * Unowns a destroyable object, either directly or via a WeakRef. The unowned object will not be destroyed when this Ownership instance is destroyed.
     * @param target - The destroyable object or WeakRef to unown.
     *
     * @remarks The target must be the exact reference previously passed to {@link own}: entries are matched by identity.
     */
    public unown(target: Ownership.Target): void {
        this.vOwned.delete(target);
    }

    /**
     * Destroys all owned objects. If an owned object is a WeakRef, it will be dereferenced before calling destroy().
     * If the WeakRef has been garbage collected, it will be skipped.
     * The set is emptied before the targets are destroyed, so cyclic ownership or destruction chains that mutate ownership cannot produce infinite iterations.
     * After calling this method, the instance remains usable and may receive new owned objects.
     */
    public destroy(): void {
        const targets = [...this.vOwned];
        this.vOwned.clear();
        let error: unknown = null;
        for (const item of targets) {
            const target = item instanceof WeakRef ? item.deref() : item;
            if (!target) continue;
            target.destroy();
        }
    }

    /** Drops the owned WeakRef entries whose target has already been collected. */
    private prune(): void {
        for (const item of this.vOwned) {
            if (item instanceof WeakRef && !item.deref()) this.vOwned.delete(item);
        }
    }
}

export namespace Ownership {
    /** A destroyable object or a weak reference to one. **/
    export type Target = IsDestroyable | WeakRef<IsDestroyable>;

    /** The internal set of targets owned by an Ownership instance. **/
    export type Owned = Set<Target>;
}

export default Ownership;