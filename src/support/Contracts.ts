/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Contracts and type guards for VizUI objects.
 * @license Apache-2.0
 */

import { APPENDABLE, DESTROYABLE, LAYOUT, VIEW, COMPONENT } from "./symbols.js";

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

//
// ======== Component objects ==========
//

export { COMPONENT }

export interface IsComponent extends IsAppendable, IsDestroyable {
    readonly [COMPONENT]: true;
    willMount?(): void | Promise<void>;
    onMount?(): void | Promise<void>;
    onUnmount?(): void | Promise<void>;
}

export function IsComponent<T>(object: T): object is Extract<T, IsComponent> {
    if (typeof object !== 'object' || object === null) return false;
    if (!(COMPONENT in object)) return false;
    if (object[COMPONENT] !== true) return false;
    return IsAppendable(object) && IsDestroyable(object);
}

//
// ======== Layout objects ==========
//

export { LAYOUT };

export interface IsLayout extends IsComponent {
    readonly [LAYOUT]: true;
    readonly outlet: IsAppendable | Node;
}

export function IsLayout<T>(object: T): object is Extract<T, IsLayout> {
    if (typeof object !== 'object' || object === null) return false;
    if (!(LAYOUT in object)) return false;
    if (object[LAYOUT] !== true) return false;
    return IsComponent(object);
}

//
// ======== View objects ==========
//

export { VIEW };

export interface IsView<Data extends unknown = unknown> extends IsComponent {
    readonly [VIEW]: true;
    load?(entry: IsView.Entry): void | Promise<void>;
    render?(data?: Data): void | Promise<void>;
}

export namespace IsView {
    export interface Entry {
        /** The normalized path of the navigation. **/
        path: string;

        /** The route parameters extracted by the matched rule. **/
        params: Record<string, string | undefined>;

        /** The query string of the navigation. **/
        query: URLSearchParams;
    }
}

export function IsView<T>(object: T): object is Extract<T, IsView> {
    if (typeof object !== 'object' || object === null) return false;
    if (!(VIEW in object)) return false;
    if (object[VIEW] !== true) return false;
    return IsComponent(object);
}
