/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Route that mounts a View. The mount is performed by the router
 * renderer (inherited through the guard state) using the view content and the
 * optional declarative loader. Its `exec` runs the route pipeline and then mounts.
 * @license Apache-2.0
 */

import { COMPONENT, ELEMENT, RULE } from '../../../support/symbols.js';
import { IsComponent, IsView } from '../../../support/Contracts.js';

import Pipeline from '../pipeline/Pipeline.js';

import type Guard from '../pipeline/Guard.js';
import type Tracker from '../Tracker.js';
import type Router from '../Router.js';

import Element from '../../element/Element.js';
import View from '../../component/View.js';

import Rule from './Rule.js';

export class ShowRule<C extends ShowRule.Content = ShowRule.Content> extends Rule<C> {
    public [RULE.SHOW] = true;
    public readonly identifier = 'show';

    /** The declarative loader declared with `load`, typed with the view data of the route. **/
    protected vLoader: ShowRule.Loader<ShowRule.DataOf<C>> | null = null;

    /**
     * Creates a show route.
     * @param template - The url template of the route.
     * @param content - The view, or a factory producing it.
     * @param pipeline - The per-route pipeline.
     */
    public constructor(template: string, content: C, pipeline: Pipeline = new Pipeline()) {
        super(template, content, pipeline);
    }

    /** The declarative loader declared with `.load(...)` when present. **/
    public get loader(): ShowRule.Loader<ShowRule.DataOf<C>> | null { return this.vLoader; }

    /**
     * Declares a loader for this route. When present it wins over `View.load`.
     * The loader return type is inferred from the data painted by the view of the route.
     * @param loader - The loader producing the data delivered to `View.render`.
     * @returns This route, for chaining.
     */
    public load(loader: ShowRule.Loader<ShowRule.DataOf<C>>): this {
        this.vLoader = loader;
        return this;
    }

    /**
     * Resolves the view or element tree, instantiating lazy factories.
     * @returns The resolved view or element tree.
     * @throws When the content does not produce a View or Element.
     */
    public async resolve(): Promise<View<any, any, ShowRule.DataOf<C>> | Element> {
        const content = this.vContent;
        const resolved = typeof content === 'function' ? await content() : content;
        if (IsComponent(resolved) || ELEMENT in resolved) return resolved;
        throw new Error(`[ShowRule] The content of "${this.vTemplate}" must be a View, Element or lazy factory.`);
    }

    public override async exec(entry: Router.Entry, state: Guard.State, target: Element,): Promise<Guard.Result | undefined> {
        return await this.pipeline.run(entry, state, async (pipeState) => {
            const renderer = pipeState.renderer;
            if (!renderer) throw new Error(`[ShowRule] No renderer available to mount "${this.vTemplate}".`);
            const view = await this.resolve();
            if (IsView(view)) {
                if (this.vLoader) {
                    const data = await this.vLoader(entry);
                    if (view.render) await view.render(data);
                } else if (view.load) {
                    await view.load(entry);
                    if (view.render) await view.render();
                } else if (view.render) await view.render();
            }
            renderer.mount(view, target);
        });
    }
}

export namespace ShowRule {
    export type ContentObject = View | Element;
    /** The content kinds a show route accepts: views, element trees or lazy factories. **/
    export type Content = ContentObject | (() => ContentObject | Promise<ContentObject>);

    /** The data painted by the view of a show route, inferred from the view's
     * `render` signature or, failing that, its `RenderData` type argument. **/
    export type DataOf<V> =
        V extends { render?(data: infer D, ...rest: never[]): unknown } ? D | undefined :
        V extends View<infer T, infer E, infer D> ? D | undefined :
        V extends (...args: never[]) => infer R ? DataOf<Awaited<R>> :
        unknown;

    /** The loader producing the data delivered to the view of the route. **/
    export type Loader<D> = (entry: Router.Entry) => D | Promise<D>;
}

export default ShowRule;