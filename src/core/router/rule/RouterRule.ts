/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description RouterRule delegates nested paths to a sub-router. Reinterprets
 * Vortez RouterRule for the SPA: a `router()` child mounts its routes inside the
 * parent layout/outlet, inheriting the parent renderer and guard order.
 * @license Apache-2.0
 */

import { RULE } from '../../../support/symbols.js';

import type Guard from '../pipeline/Guard.js';
import Pipeline from '../pipeline/Pipeline.js';
import type Tracker from '../Tracker.js';

import type Element from '../../element/Element.js';
import type Router from '../Router.js';

import Rule from './Rule.js';

export class RouterRule extends Rule<Router> {
    public [RULE.ROUTER] = true;
    public readonly identifier = 'router';

    /**
     * Creates a delegating route, suffixing the template with `/*` when missing.
     * @param template - The url template prefix of the sub-router.
     * @param content - The sub-router.
     * @param pipeline - The per-route pipeline.
     */
    public constructor(template: string, content: Router, pipeline: Pipeline = new Pipeline()) {
        template = template.endsWith('/*') ? template : template + '/*';
        super(template, content, pipeline);
    }

    public override test(url: string): boolean {
        if (!super.test(url)) return false;
        const surplus = this.surplus(url);
        return this.vContent.test(surplus);
    }

    /**
     * Executes this rule's pipeline and delegates the navigation to the sub-router
     * using the surplus path. Route guards inherited via `pipeline` run first and
     * the delegation mounts into the target outlet. Mirrors Vortez RouterRule.exec.
     * @param entry - The route entry being navigated (carries inherited params).
     * @param state - The shared guard state.
     * @param target - The outlet where the route mounts its content.
     * @param tracker - The navigation tracker, when present.
     * @param path - The path level to match (the surplus inside delegations).
     * @returns The control result produced by the sub-router, if any.
     */
    public override async exec(
        entry: Router.Entry,
        state: Guard.State,
        target: Element,
        tracker?: Tracker,
        path: string = entry.path,
    ): Promise<Guard.Result | undefined> {
        return await this.pipeline.run(entry, state, async () => {
            const surplus = this.surplus(path);
            return await this.vContent.route(entry, state, tracker, surplus, target);
        });
    }
}

export namespace RouterRule { }

export default RouterRule;