/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Rendering contract between the router and the DOM. The router
 * decides *what* to mount (routes, layouts, delegation); the renderer decides
 * *how* a component is placed and torn down. Kept behind an interface so tests
 * and alternative hosts can inject a fake renderer.
 * @license Apache-2.0
 */

import Element from '../element/Element.js';
import Component from '../component/Component.js';
import Layout from '../component/Layout.js';

export interface Renderer {
    /** The root outlet of the renderer, when it owns one. **/
    readonly outlet: Element | null;

    /**
     * Mounts a component into an outlet, tearing down the previous mount there.
     * @param component - The component to mount.
     * @param outlet - The outlet element to mount into.
     * @returns The outlet.
     */
    mount(component: Component<any> | Element, outlet: Element): Element;

    /**
     * Mounts an element tree into an outlet, tearing down the previous mount there.
     * Elements mount without lifecycle hooks (teardown is handled by `outlet.clean()`).
     * @param element - The element tree to mount.
     * @param outlet - The outlet element to mount into.
     * @returns The outlet.
     */
    // mountElement(element: Element, outlet: Element): Element;

    /**
     * Tears down and cleans whatever is mounted in an outlet.
     * @param outlet - The outlet element to unmount.
     */
    unmount(outlet: Element): void;

    /**
     * Mounts a layout component into an outlet and returns the child outlet
     * element where nested content will mount. Reusing a mounted layout keeps its
     * state across nested navigations.
     * @param layout - The layout component.
     * @param outlet - The outlet the layout is mounted into.
    * @param selector - Optional outlet of the nested region: a selector to resolve
    * inside the layout root, a direct element or a component root.
     * @returns The child outlet element.
     */
    layout(layout: Component, outlet: Element, selector?: string | Element | Component): Element;
}

export class DomRenderer implements Renderer {
    /** The components currently mounted, keyed by their outlet. **/
    protected vMounts = new WeakMap<Element, Component>();

    /** Cached Element wrappers, keyed by their raw DOM node. **/
    protected static vWrappers = new WeakMap<HTMLElement, Element>();

    /**
     * Creates a DOM renderer. Mounts are tracked per outlet in a WeakMap so
     * unmounting never leaks listeners and concurrent outlets stay independent.
     * @param outlet - The root element the renderer mounts into by default.
     */
    public constructor(
        /** The root element the renderer mounts into by default. **/
        outlet: Element = DomRenderer.widened(Element.new('div')),
    ) { this.outlet = outlet; }

    /** The root element the renderer mounts into by default. **/
    public readonly outlet: Element;

    /**
     * Widens a concrete Element to its base type for storage in base-typed fields.
     * @param element - The element to widen.
     * @returns The widened element.
     */
    protected static widened<Specific extends HTMLElement>(element: Element<Specific>): Element {
        return element as unknown as Element;
    }

    /**
     * Returns the singleton Element wrapper for a raw DOM node, so mount
     * tracking stays stable when the same node is resolved repeatedly.
     * @param node - The raw DOM node.
     * @returns The cached wrapper, or a new one stored for later reuse.
     */
    protected static wrap(node: HTMLElement): Element {
        let wrapper = DomRenderer.vWrappers.get(node);
        if (!wrapper) { wrapper = new Element(node); DomRenderer.vWrappers.set(node, wrapper); }
        return wrapper;
    }

    /**
     * Mounts a component into an outlet, tearing down the previous mount there.
     * @param component - The component to mount.
     * @param outlet - The outlet element to mount into.
     * @returns The outlet.
     */
    public mount(component: Component<any>, outlet: Element): Element {
        this.unmount(outlet);
        component.appendTo(outlet);
        this.vMounts.set(outlet, component);
        return outlet;
    }

    /**
     * Tears down and cleans whatever is mounted in an outlet.
     * @param outlet - The outlet element to unmount.
     */
    public unmount(outlet: Element): void {
        const mounted = this.vMounts.get(outlet);
        if (mounted) {
            Component.unmount(mounted);
            this.vMounts.delete(outlet);
        }
        outlet.clean();
    }

    /**
     * Mounts a layout component into an outlet and returns the child outlet
     * element where nested content will mount. Reusing a mounted layout keeps
     * its state across nested navigation`s.
     * @param layout - The layout component.
     * @param outlet - The outlet the layout is mounted into.
     * @param selector - Optional outlet: a selector to resolve inside the layout
     * root, a direct element, or none to fall back to the layout's own outlet.
     * @returns The child outlet element.
     */
    public layout(layout: Component, outlet: Element, selector?: string | Element | Component): Element {
        const mounted = this.vMounts.get(outlet);
        if (mounted !== layout) {
            if (mounted) {
                Component.unmount(mounted);
                this.vMounts.delete(outlet);
            }
            layout.appendTo(outlet);
            this.vMounts.set(outlet, layout);
        }
        const region = this.region(layout, selector);
        return selector !== undefined || layout instanceof Layout ? region : this.childOutlet(region);
    }

    /**
     * Resolves the region where routed content mounts: an explicitly provided
     * outlet element wins, then a selector inside the layout root, then the
     * outlet the layout itself exposes, falling back to the layout root.
     * @param layout - The mounted layout component.
     * @param selector - The explicit outlet element or selector, if any.
     * @returns The outlet region.
     */
    protected region(layout: Component, selector?: string | Element | Component): Element {
        if (selector instanceof Component) return selector.root;
        if (selector instanceof Element) return selector;
        if (typeof selector === 'string' && selector) return this.resolve(layout.root, selector);
        if (layout instanceof Layout) return this.asElement(layout.outlet);
        return layout.root;
    }

    /** Converts a component outlet to the element it exposes. **/
    protected asElement(outlet: Element | Component): Element {
        return outlet instanceof Component ? outlet.root : outlet;
    }

    /**
     * Finds or creates the child outlet element inside a layout region.
     * @param region - The region to resolve the outlet inside.
     * @returns The child outlet element.
     */
    protected childOutlet(region: Element): Element {
        const existing = this.child(region);
        if (existing) return existing;
        const outlet = Element.new('div');
        outlet.classList.add('router-outlet');
        region.append(outlet);
        return DomRenderer.wrap(outlet.root);
    }

    /**
     * Finds the existing child outlet element inside a layout region.
     * @param region - The region to search.
     * @returns The child outlet element, or null when absent.
     */
    protected child(region: Element): Element | null {
        const found = region.root.querySelector(':scope > .router-outlet');
        return found ? DomRenderer.wrap(found as HTMLElement) : null;
    }

    /**
     * Resolves a selector against a layout root.
     * @param root - The layout root element.
     * @param selector - The selector of the nested region.
     * @returns The resolved region element.
     * @throws When the selector matches nothing inside the layout.
     */
    protected resolve(root: Element, selector: string): Element {
        const found = root.root.querySelector(selector);
        if (!found) throw new Error(`[DomRenderer] Outlet selector "${selector}" was not found inside the layout.`);
        return DomRenderer.wrap(found as HTMLElement);
    }
}

export namespace Renderer { }

export default Renderer;