/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Discrimination symbols used to identify VizUI types without instanceof.
 * @license Apache-2.0
 */

export const APPENDABLE = Symbol('vizui.apendable');
export const ELEMENT = Symbol('vizui.element');
export const COMPONENT = Symbol('vizui.component');

export const symbols: {
    COMPONENT: typeof COMPONENT;
    ELEMENT: typeof ELEMENT;
} = {
    COMPONENT,
    ELEMENT
};

export default symbols;