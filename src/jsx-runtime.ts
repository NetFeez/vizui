import { COMPONENT } from './support/symbols.js';

import Element from './core/element/Element.js';
import { Node } from './core/element/Node.js';
import Store from './state/Store.js';

import Component from './core/component/Component.js';
import View from './core/component/View.js';
import Layout from './core/component/Layout.js';

export class JSXRuntime {
    public static jsx<T extends keyof Element.Type>(tag: T, attributes: JSXRuntime.jsx.IntrinsicElements[T] | null, ...childrenList: JSXRuntime.Child[]): Element<Element.Type[T]>;
    public static jsx<Props, T extends Component>(tag: JSXRuntime.ComponentClass<Props, T>, attributes: JSXRuntime.Attributes<Props> | null, ...childrenList: JSXRuntime.Child[]): T;
    public static jsx<Props>(tag: JSXRuntime.FunctionComponent<Props>, attributes: JSXRuntime.Attributes<Props> | null, ...childrenList: JSXRuntime.Child[]): Element<any>;
    public static jsx(tag: JSXRuntime.Tag, attributes: JSXRuntime.Attributes | null, ...childrenList: JSXRuntime.Child[]): Element<any> | Component {
        const children = JSXRuntime.normalizeChildren(childrenList, attributes?.children);
        if (typeof tag === 'function') {
            if (JSXRuntime.isComponentClass(tag)) return JSXRuntime.createComponent(tag, { ...attributes, children });
            return tag({ ...attributes, children });
        }
        const element = Element.create(tag);
        if (attributes) JSXRuntime.setAttributes(element, attributes);
        element.append(...children);
        return element;
    }

    public static Fragment(attributes: JSXRuntime.Attributes | null, ...childrenList: JSXRuntime.Child[]): JSXRuntime.Child[] {
        const children: JSXRuntime.Child[] = [];
        if (attributes?.children !== undefined) {
            children.push(...(Array.isArray(attributes.children) ? attributes.children : [attributes.children]));
        }
        children.push(...childrenList);
        return children;
    }

    /** Whether a tag is a `Component` class (not a function component). **/
    public static isComponentClass(tag: unknown): tag is JSXRuntime.ComponentClass {
        return typeof tag === 'function'
            && tag.prototype instanceof Component;
    }

    /** Instantiates a `Component` class tag, passing the merged attributes as props. **/
    public static createComponent<Props, T extends Component>(tag: JSXRuntime.ComponentClass<Props, T>, props: JSXRuntime.Attributes<Props>): T {
        return new tag(props);
    }

    /** Whether a layout root contains its outlet region. **/
    public static outletContains(root: Element<any>, outlet: Element<any> | Component): boolean {
        return root.contains(COMPONENT in outlet ? outlet.root : outlet);
    }

    private static setAttributes(element: Element<any>, attributes: JSXRuntime.Attributes): void {
        const { style, children, ...rest } = attributes;
        if (style) {
            if (typeof style === 'string') element.setAttribute('style', style);
            else Object.assign(element.style, style);
        }
        for (const [key, value] of Object.entries(rest)) {
            if (JSXRuntime.isEventName(key)) {
                if (JSXRuntime.isEventListener(value)) element.on(key.slice(3), value);
                continue;
            }
            if (value instanceof Store) { element.bindAttribute(key, value); continue; }
            if (!JSXRuntime.isValidAttributeValue(value)) throw new Error(`[vizui] attribute "${key}" received a ${typeof value} value, which is only supported on event ("on:") names or "style".`);
            if (value === null || value === undefined || value === false) element.removeAttribute(key);
            else if (value === true) element.setAttribute(key, '');
            else if (typeof value === 'number') element.setAttribute(key, String(value));
            else element.setAttribute(key, value);
        }
    }
    /** Resolves the children of an element: explicit children win over the `children` attribute, and nested arrays (fragments, mapped lists) are flattened. **/
    private static normalizeChildren(
        childrenList: JSXRuntime.Child[],
        attributeChildren: JSXRuntime.Child | JSXRuntime.Child[] | undefined
    ): JSXRuntime.Child[] {
        const source = childrenList.length > 0
            ? childrenList
            : attributeChildren === undefined
                ? []
                : Array.isArray(attributeChildren)
                    ? attributeChildren
                    : [attributeChildren];
        return JSXRuntime.flattenChildren(source);
    }

    /** Recursively collects nested child arrays into a single flat list. **/
    private static flattenChildren(children: JSXRuntime.Child | JSXRuntime.Child[], flat: JSXRuntime.Child[] = []): JSXRuntime.Child[] {
        if (Array.isArray(children)) {
            for (const child of children) JSXRuntime.flattenChildren(child, flat);
            return flat;
        }
        flat.push(children as JSXRuntime.Child);
        return flat;
    }

    public static isEventListener(listener: unknown): listener is EventListener {
        return typeof listener === 'function';
    }
    public static isEventName<T extends HTMLElement>(name: string): name is keyof JSXRuntime.EventAttributes<T> {
        return name.length > 3 && name.startsWith('on:');
    }
    public static isValidAttributeValue(value: unknown): value is JSXRuntime.AttributeValue {
        if (value === null || value === undefined) return true;
        if (value instanceof Store) return true;
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
        return false;
    }
}

export namespace JSXRuntime {
    export type AttributeValue = Primitive | boolean | Store<string | null>;
    export type Attributes<Props = Record<string, unknown>> = Props & { children?: Child | Child[] };
    export type Primitive = string | number;
    export type Child = Node.ValueType;

    export type FunctionComponent<Props = Record<string, unknown>> = (
        props: Attributes<Props>
    ) => Element<any>;

    export type ComponentClass<
        Props = Record<string, unknown>,
        T extends Component = Component
    > = new (props?: Attributes<Props>) => T;

    export type Tag =
        | keyof jsx.IntrinsicElements
        | FunctionComponent
        | ComponentClass;

    export type EventAttributes<T extends HTMLElement> = {
        [E in keyof HTMLElementEventMap as `on:${E}`]?: (this: T, event: HTMLElementEventMap[E]) => void;
    };

    export type HTMLAttributes<T extends HTMLElement = HTMLElement> = EventAttributes<T> & {
        children?: Child | Child[];
        style?: string | Partial<CSSStyleDeclaration>;
        [attribute: string]: AttributeValue | Function | Partial<CSSStyleDeclaration> | Child | Child[] | null | undefined;
    };

    export namespace jsx {
        export type Child = JSXRuntime.Child;
        export type Attributes<Props = Record<string, unknown>> = JSXRuntime.Attributes<Props>;
        export type Primitive = JSXRuntime.Primitive;
        export type Tag = JSXRuntime.Tag;
        export type AttributeValue = JSXRuntime.AttributeValue;
        export type EventAttributes<T extends HTMLElement> = JSXRuntime.EventAttributes<T>;
        export type HTMLAttributes<T extends HTMLElement> = JSXRuntime.HTMLAttributes<T>;
        export type ComponentClass<Props = Record<string, unknown>> = JSXRuntime.ComponentClass<Props>;
        export type FunctionComponent<Props = Record<string, unknown>> = JSXRuntime.FunctionComponent<Props>;

        // The result type of every JSX expression. Under the automatic runtime TypeScript
        // types JSX elements as this namespace alias, NOT as the jsx() factory return
        // type — so `InstanceType<typeof Element>` here widened every tag to Element<HTMLElement>.
        // `Element<any>` keeps the JSX expression assignable to any concrete Element<T>.
        export type Element = import('./core/element/Element.js').default<any>;

        export type IntrinsicElements = {
            [tag in keyof HTMLElementTagNameMap]: HTMLAttributes<HTMLElementTagNameMap[tag]>;
        };
    }
}

export default JSXRuntime;

export import jsx = JSXRuntime.jsx;
export import JSX = JSXRuntime.jsx;
export import Fragment = JSXRuntime.Fragment;
export import jsxs = JSXRuntime.jsx;

/**
 * A `View` without class syntax: pages with lifecycle hooks but no `extends`.
 * @template Root - The root tag of the view, inferred from `root` when possible.
 */
export function view<Root extends Component.Type = 'div'>(options: view.Options<Root>): View<Root> {
    return new AnonymousView(options);
}

export namespace view {
    export interface Options<Root extends Component.Type = 'div'> {
        /** The root element of the view. **/
        root: Element<Component.ComponentElement<Root>>;
        load?(entry: View.Entry): void | Promise<void>;
        render?(data?: unknown): void | Promise<void>;
        willMount?(): void | Promise<void>;
        onMount?(): void | Promise<void>;
        onUnmount?(): void | Promise<void>;
    }
}

/**
 * A `Layout` without class syntax: an outlet embedded positionally in the root,
 * or injected through the factory form. The outlet must be a descendant of the
 * layout root; the helper validates it and throws otherwise.
 * @template Root - The root tag of the layout.
 */

export function layout<Root extends Component.Type = 'div'>(options: layout.Options<Root> | layout.Factory<Root>): Layout<Root> {
    const injected = { outlet: Element.new('div') };
    const resolved = typeof options === 'function'
        ? { ...options(injected), outlet: injected.outlet }
        : options;
    const outlet: Element<any> | Component = resolved.outlet ?? injected.outlet;
    if (!JSXRuntime.outletContains(resolved.root, outlet)) throw new Error('[vizui] layout(): the outlet must be embedded inside the layout root.');
    return new AnonymousLayout({ ...resolved, outlet });
}

export namespace layout {
    export interface Options<Root extends Component.Type = 'div'> {
        /** The root element of the layout. **/
        root: Element<Component.ComponentElement<Root>>;
        /** The region where routed content mounts; must be a child of `root`. **/
        outlet?: Element | Component;
        willMount?(): void | Promise<void>;
        onMount?(): void | Promise<void>;
        onUnmount?(): void | Promise<void>;
    }

    /** The context delivered to factory layouts, carrying the injected outlet. **/
    export interface OutletContext {
        outlet: Element<any>;
    }

    /** Builds a layout from the injected outlet: `layout(({ outlet }) => ({ root: <div>{outlet}</div> }))`. **/
    export type Factory<Root extends Component.Type = 'div'> = (context: OutletContext) => Options<Root>;
}

class AnonymousView<Root extends Component.Type> extends View<Root> {
    public readonly root: Element<Component.ComponentElement<Root>>;
    public constructor(options: view.Options<Root>) { super();
        this.root = options.root;
        this.load = options.load;
        this.render = options.render;
        this.willMount = options.willMount;
        this.onMount = options.onMount;
        this.onUnmount = options.onUnmount;
    }
}

class AnonymousLayout<Root extends Component.Type> extends Layout<Root> {
    public readonly root: Element<Component.ComponentElement<Root>>;
    public readonly outlet: Element | Component;
    public constructor(options: layout.Options<Root> & { outlet: Element | Component }) { super();
        this.root = options.root;
        this.outlet = options.outlet;
        this.willMount = options.willMount;
        this.onMount = options.onMount;
        this.onUnmount = options.onUnmount;
    }
}