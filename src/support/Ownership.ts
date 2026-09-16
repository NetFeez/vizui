/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Ownership management for destroyable objects.
 * @license Apache-2.0
 */

import { DESTROYABLE, IsDestroyable } from "./Contracts.js";

export class Ownership implements IsDestroyable {
    public readonly [DESTROYABLE] = true;
    
    public readonly owned: Ownership.Owned = new Set();

    /**
     * Owns a destroyable object, either directly or via a WeakRef. The owned object will be destroyed when this Ownership instance is destroyed.
     * If a destroyable object is passed directly, a warning will be logged to the console, as this can lead to memory leaks if the object is not properly dereferenced.
     * It is recommended to pass a WeakRef to the destroyable object instead.
     * @param target - The destroyable object or WeakRef to own.
     */
    public own(target: IsDestroyable | WeakRef<IsDestroyable>): void {
        if (IsDestroyable(target)) console.warn(`Ownership.own() received a destroyable object. Consider passing a WeakRef instead to avoid memory leaks.`);
        else if (!target.deref()) return;
        this.owned.add(target);
    }

    /**
     * Unowns a destroyable object, either directly or via a WeakRef. The unowned object will not be destroyed when this Ownership instance is destroyed.
     * @param target - The destroyable object or WeakRef to unown.
     */
    public unown(target: IsDestroyable | WeakRef<IsDestroyable>): void {
        this.owned.delete(target);
    }

    /**
     * Destroys all owned objects. If an owned object is a WeakRef, it will be dereferenced before calling destroy().
     * If the WeakRef has been garbage collected, it will be skipped.
     * This method does not remove the owned objects from the set, so they will still be considered owned after destruction.
     * It is recommended to clear the set after calling destroy() if you want to release ownership of the objects.
     */
    public destroy(): void {
        const consumible = [...this.owned];
        this.owned.clear();
        for (const item of consumible) {
            const target = item instanceof WeakRef ? item.deref() : item;
            if (!target) continue;
            target.destroy();
        }
    }
}

export namespace Ownership {
    export type Owned = Set<IsDestroyable | WeakRef<IsDestroyable>>;
}

export default Ownership;