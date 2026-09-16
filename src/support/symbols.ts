/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Discrimination symbols used to identify VizUI types without instanceof.
 * @license Apache-2.0
 */

//
// ========== Contract Symbols ==========
//

/** Marks an object as appendable. **/
export const APPENDABLE = Symbol('vizui.appendable');

/** Marks an object as destroyable. **/
export const DESTROYABLE = Symbol('vizui.destroyable');

/** Marks an object as a View. **/
export const VIEW = Symbol('vizui.view');

/** Marks an object as a Layout. **/
export const LAYOUT = Symbol('vizui.layout');

/** The contract discrimination symbols, grouped. **/
export const CONTRACTS: {
    APPENDABLE: typeof APPENDABLE;
    DESTROYABLE: typeof DESTROYABLE;
    VIEW: typeof VIEW;
    LAYOUT: typeof LAYOUT;
} = {
    APPENDABLE,
    DESTROYABLE,
    VIEW,
    LAYOUT
};

//
// ========== Core Symbols ==========
//


/** Marks an object as a Node. **/
export const NODE = Symbol('vizui.node');

/** Marks an object as an Element. **/
export const ELEMENT = Symbol('vizui.element');

/** Marks an object as a Component. **/
export const COMPONENT = Symbol('vizui.component');

/** The core discrimination symbols, grouped. **/
export const CORE: {
    NODE: typeof NODE;
    ELEMENT: typeof ELEMENT;
    COMPONENT: typeof COMPONENT;
} = {
    NODE,
    ELEMENT,
    COMPONENT
}

//
// ========== Route Symbols ==========
//

/** Marks an object as a rule. **/
export const RULE_BASE = Symbol('vizui.route.base');

/** Marks a rule as a show rule. **/
export const RULE_SHOW = Symbol('vizui.route.show');

/** Marks a rule as a layout rule. **/
export const RULE_LAYOUT = Symbol('vizui.route.layout');

/** Marks a rule as a socket rule. **/
export const RULE_SOCKET = Symbol('vizui.route.socket');

/** Marks a rule as a delegating router rule. **/
export const RULE_ROUTER = Symbol('vizui.route.router');

/** Marks a rule as a custom rule. **/
export const RULE_CUSTOM = Symbol('vizui.route.custom');

/** The route discrimination symbols, grouped. **/
export const RULE: {
    BASE: typeof RULE_BASE;
    SHOW: typeof RULE_SHOW;
    LAYOUT: typeof RULE_LAYOUT;
    SOCKET: typeof RULE_SOCKET;
    ROUTER: typeof RULE_ROUTER;
    CUSTOM: typeof RULE_CUSTOM;
} = {
    BASE: RULE_BASE,
    SHOW: RULE_SHOW,
    LAYOUT: RULE_LAYOUT,
    SOCKET: RULE_SOCKET,
    ROUTER: RULE_ROUTER,
    CUSTOM: RULE_CUSTOM,
}

//
// ========== Guard Symbols ==========
//

/** Marks an object as a guard. **/
export const GUARD_BASE = Symbol('vizui.guard.base');

/** Marks a guard as a navigation guard. **/
export const GUARD_NAVIGATION = Symbol('vizui.guard.navigation');

/** Marks a guard as an error guard. **/
export const GUARD_ERROR = Symbol('vizui.guard.error');

/** The guard discrimination symbols, grouped. **/
export const GUARD: {
    BASE: typeof GUARD_BASE;
    NAVIGATION: typeof GUARD_NAVIGATION;
    ERROR: typeof GUARD_ERROR;
} = {
    BASE: GUARD_BASE,
    NAVIGATION: GUARD_NAVIGATION,
    ERROR: GUARD_ERROR,
}

/** Every discrimination symbol of VizUI, grouped by concept. **/
export const symbols: {
    CONTRACTS: typeof CONTRACTS;
    CORE: typeof CORE;
    RULE: typeof RULE;
    GUARD: typeof GUARD;
} = {
    CONTRACTS,
    CORE,
    RULE,
    GUARD,
};

export default symbols;