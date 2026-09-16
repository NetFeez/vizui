/**
 * @author NetFeez <netfeez.dev@netfeez.dev>.
 * @description Contracts and type guards for VizUI objects.
 * @license Apache-2.0
 */

import { APPENDABLE, DESTROYABLE } from "./symbols.js";

//
// ======== Appendable objects ==========
//

export { APPENDABLE };

export interface IsAppendable {
    readonly [APPENDABLE]: true;
    root: IsAppendable | Node;
}

export function IsAppendable<T>(object: T): object is Extract<T, IsAppendable> {
    if (typeof object !== 'object' || object === null) return false;
    if (!(APPENDABLE in object)) return false;
    if (object[APPENDABLE] !== true) return false;
    if (!('root' in object)) return false;
    return object.root instanceof Node || IsAppendable(object.root);
}

//
// ======== Destroyable objects ==========
//

export { DESTROYABLE };

export interface IsDestroyable {
    readonly [DESTROYABLE]: true;
    destroy(): void | Promise<void>;
}

export function IsDestroyable<T>(object: T): object is Extract<T, IsDestroyable> {
    if (typeof object !== 'object' || object === null) return false;
    if (!(DESTROYABLE in object)) return false;
    if (object[DESTROYABLE] !== true) return false;
    if (!('destroy' in object)) return false;
    return typeof object.destroy === 'function';
}