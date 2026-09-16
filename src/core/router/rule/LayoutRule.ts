/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Route that mounts a layout Component. Layout templates are automatically
 * suffixed with `/*` so the layout covers every nested child path (RouterRule-style).
 * Layouts are matched by the router through the layout chain; they are never dispatched
 * as rules, so `exec` is a defensive guard.
 * @license Apache-2.0
 */

import { RULE } from '../../../support/symbols.js';

import Pipeline from '../pipeline/Pipeline.js';

import type Element from '../../element/Element.js';
import type Guard from '../pipeline/Guard.js';
import type Tracker from '../Tracker.js';
import type Router from '../Router.js';

import Component from '../../component/Component.js';
import Layout from '../../component/Layout.js';

import Rule from './Rule.js';

export class LayoutRule extends Rule<LayoutRule.Content> {
    public [RULE.LAYOUT] = true;
    public readonly identifier = 'layout';

    /**
     * Creates a layout route, suffixing the template with `/*` when missing.
     * @param template - The url template of the layout.
     * @param content - The layout component, or a factory producing it.
     * @param pipeline - The per-route pipeline.
     */
    public constructor(template: string, content: LayoutRule.Content, pipeline: Pipeline = new Pipeline()) {
        template = template.endsWith('/*') ? template : template + '/*';
        super(template, content, pipeline);
    }

    /** The optional outlet of the layout: a selector, element or component. **/
    public get outletSelector(): string | Element | Component | undefined {
        return this.vContent instanceof Layout || typeof this.vContent === 'function'
            ? undefined : this.vContent.outlet;
    }

    /**
     * Resolves the layout component instance, instantiating lazy factories.
     * @returns The resolved layout component.
     * @throws When the content does not produce a Component.
     */
    public async resolve(): Promise<Component<any>> {
        const content = this.vContent;
        const component = content instanceof Layout
            ? content
            : typeof content === 'function' ? content() : content.component;
        const resolved = typeof component === 'function' ? await component() : component;
        if (!(resolved instanceof Component)) throw new Error(`[LayoutRule] Invalid layout for template "${this.vTemplate}": expected a Component, got ${typeof resolved}.`);
        return resolved;
    }

    /**
     * Guards against dispatching layouts as rules; layouts mount through the
     * router layout chain instead.
     * @throws Always, layouts are never executed as rules.
     */
    public override async exec(): Promise<Guard.Result | undefined> {
        throw new Error(`[LayoutRule] The layout for template "${this.vTemplate}" is mounted through the router layout chain, not executed as a rule.`);
    }
}

export namespace LayoutRule {
    export type ComponentFactory = () => Component | Promise<Component>;
    export type LayoutFactory = () => Layout | Promise<Layout>;

    export type Content = Layout | Configuration | LayoutFactory | ComponentFactory;

    /** The layout kinds a layout route accepts. **/
    export interface Configuration {
        /** The layout component, or a factory producing it. **/
        component: Component | LayoutFactory | ComponentFactory;

        /** The layout outlet: a selector to resolve inside the root, or a direct element or component. **/
        outlet?: string | Element | Component;
    }
}

export default LayoutRule;