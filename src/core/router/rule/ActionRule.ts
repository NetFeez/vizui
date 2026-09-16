/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Route for custom mount kinds. The general form behind `action()`, the
 * typed shortcuts and any developer-defined mount kind. Its content runs after the
 * route pipeline and may return a control result (redirect/abort/error).
 * @license Apache-2.0
 */

import { RULE } from '../../../support/symbols.js';

import Pipeline from '../pipeline/Pipeline.js';

import type Element from '../../element/Element.js';
import type Guard from '../pipeline/Guard.js';
import type Tracker from '../Tracker.js';
import type Router from '../Router.js';

import Rule from './Rule.js';

export class ActionRule extends Rule<ActionRule.Content> {
    public [RULE.CUSTOM] = true;

    /**
     * Creates a custom route.
     * @param kind - The custom mount kind.
     * @param template - The url template of the route.
     * @param content - The content executed when the route matches.
     * @param pipeline - The per-route pipeline.
     */
    public constructor(
        /** The custom mount kind of the rule. **/
        public readonly kind: string,
        template: string,
        content: ActionRule.Content,
        pipeline: Pipeline = new Pipeline()
    ) { super(template, content, pipeline); }

    /** The mount kind of the rule. **/
    public get identifier(): Rule.Identifier { return `custom-${this.kind}`; }

    public override async exec(entry: Router.Entry, state: Guard.State): Promise<Guard.Result | undefined> {
        return await this.pipeline.run(entry, state, async () => {
            return await this.vContent(entry, state);
        });
    }
}

export namespace ActionRule {
    /** The custom content executed when the route matches. **/
    export type Content = (entry: Router.Entry, state: Router.State) => Guard.Result | Promise<Guard.Result>;
}

export default ActionRule;