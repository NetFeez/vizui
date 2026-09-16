/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Base Route for the SPA router: URL matching engine (port of Vortez Rule),
 * per-rule guard pipeline and mount execution. Each concrete route implements `exec`
 * to run its own pipeline and mount its content, mirroring `Rule.exec` of Vortez.
 * @license Apache-2.0
 */

import { RULE } from '../../../support/symbols.js';

import Pipeline from '../pipeline/Pipeline.js';

import type Element from '../../element/Element.js';
import type Guard from '../pipeline/Guard.js';
import type Tracker from '../Tracker.js';
import type Router from '../Router.js';
import type RouterRule from './RouterRule.js';

export abstract class Rule<Content = unknown> {
    /** Collapses duplicate slashes when normalizing templates. **/
    protected static readonly MULTI_SLASH_REPLACER = /\/+/g;

    /** Trims a single leading and trailing slash when normalizing templates. **/
    protected static readonly RULE_NORMALIZER = /^\/?(.+?)\/?$/;

    public [RULE.BASE] = true;

    /** The mount kind of the rule. **/
    public abstract readonly identifier: Rule.Identifier;

    /** The per-rule guard pipeline. **/
    public readonly pipeline: Pipeline;

    /** The normalized url template. **/
    protected vTemplate: string;

    /** The compiled matching expression. **/
    protected vExpression: RegExp;

    /** The mount content of the rule. **/
    protected vContent: Content;

    /**
     * Creates a route.
     * @param template - The url template of the route.
     * @param content - The mount content of the route.
     * @param pipeline - The per-route pipeline.
     */
    public constructor(template: string, content: Content, pipeline: Pipeline = new Pipeline()) {
        this.vTemplate = template = Rule.normalize(template);
        this.vExpression = Rule.create(template);
        this.vContent = content;
        this.pipeline = pipeline;
    }

    /** The normalized URL template (includes the router base when prefixed). **/
    public get template(): string { return this.vTemplate; }

    /**
     * Replaces the url template, recompiling the matching expression.
     * @param template - The new template.
     */
    public set template(template: string) {
        this.vTemplate = template = Rule.normalize(template);
        this.vExpression = Rule.create(template);
    }

    /** The compiled template expression. **/
    public get expression(): RegExp { return this.vExpression; }

    /** The mount content associated with the route. **/
    public get content(): Content { return this.vContent; }

    /**
     * Adds guards to this route's pipeline. They run after parent/global guards and
     * before the route is mounted. Mirrors `Rule.use` of Vortez.
     * @param items - The guards or pipelines to add.
     * @returns This route, for chaining.
     */
    public use(...items: (Guard.Type | Guard.Function | Pipeline)[]): this {
        this.pipeline.use(...items);
        return this;
    }

    /**
     * Tests whether the URL matches this route's template.
     * @param url - The url to match.
     * @returns Whether the url matches the template.
     */
    public test(url: string): boolean { return this.vExpression.test(url); }

    /**
     * Extracts the named parameters from a matched URL.
     * @param path - The path to extract from.
     * @returns The extracted parameters.
     */
    public params(path: string): Rule.Params {
        const match = this.vExpression.exec(path);
        return match?.groups ? { ...match.groups } : {};
    }

    /**
     * Extracts the surplus (the `$surplus` group) from a matched URL.
     * @param path - The path to extract from.
     * @returns The surplus path, or an empty string.
     */
    public surplus(path: string): string {
        const { $surplus = '' } = this.params(path);
        return $surplus;
    }

    /**
     * Executes this rule's guard pipeline and mounts its content. Mirrors `Rule.exec`
     * of Vortez: the router runs the global pipeline and calls `exec` as its destination.
     * @param entry - The route entry being navigated (carries inherited params).
     * @param state - The shared guard state.
     * @param target - The outlet where the route mounts its content.
     * @param tracker - The navigation tracker, when present.
     * @param path - The path level to match (the surplus inside delegations).
     * @returns A control result produced by the pipeline or content, if any.
     */
    public abstract exec(
        entry: Router.Entry,
        state: Guard.State,
        target: Element,
        tracker?: Tracker,
        path?: string,
    ): Promise<Guard.Result | undefined>;

    /**
     * Normalizes a template: collapses duplicate slashes and guarantees a single
     * leading and no trailing slash.
     * @param template - The raw template.
     * @returns The normalized template.
     */
    protected static normalize(template: string): string {
        const normalized = template
            .replace(this.MULTI_SLASH_REPLACER, '/')
            .replace(this.RULE_NORMALIZER, '/$1');
        return normalized === '//' ? '/' : normalized;
    }

    /**
     * Compiles a template into a matching RegExp. Supports `$param` / `:param`
     * (required), `$?param` / `:?param` (optional), `*` (wildcard/surplus) and
     * escaped special characters. Port verbatim from Vortez v6 Rule.create.
     * @param template - The normalized template.
     * @returns The compiled expression.
     */
    protected static create(template: string): RegExp {
        const validators = {
            paramRequired: /^(?:\:|\$)(?<param>(?!\$).+)$/,
            paramOptional: /^(?:\:|\$)\?(?<param>(?!\$).+)$/,
            escape: /\\(?![\$\[\]\*\+\?\.\(\)\{\}\^\|\-])|(?<!\\)[\$\[\]\*\+\?\.\(\)\{\}\^\|\-]/gi,
        };
        const zones = template.split('/').slice(1);
        let generated = '^';

        for (let index = 0; index < zones.length; index++) {
            const zone = zones[index];

            if (zone == '*') {
                const isLast = index == (zones.length - 1);
                generated += isLast ? '(?<$surplus>/.+)?' : '(?:/[^/]+)';
                continue;
            }

            const optional = zone.match(validators.paramOptional);
            if (optional && optional.groups) {
                const param = optional.groups['param'].replace(validators.escape, '');
                generated += `(?:/(?<${param}>[^/]+))?`;
                continue;
            }

            const required = zone.match(validators.paramRequired);
            if (required && required.groups) {
                const param = required.groups['param'].replace(validators.escape, '');
                generated += `/(?<${param}>[^/]+)`;
                continue;
            }

            generated += `/${zone}`;
        }
        return new RegExp(`${generated}/?$`);
    }
}

export namespace Rule {
    /** The mount kinds a rule can declare. **/
    export type Identifier = 'show' | 'layout' | 'socket' | 'router' | `custom-${string}`;

    /** The route parameters extracted from a url. **/
    export interface Params {
        [name: string]: string | undefined;
    }

    /** Any rule kind, plain or delegating. **/
    export type Any = Rule | RouterRule;
}

export default Rule;