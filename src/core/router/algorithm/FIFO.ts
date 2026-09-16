/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description FIFO matching: rules are tested in registration order. Default
 * algorithm for the SPA router. Port of Vortez FIFO (no Http/Ws split).
 * @license Apache-2.0
 */

import { RULE } from '../../../support/symbols.js';

import type RouterRule from '../rule/RouterRule.js';

import Algorithm from './Algorithm.js';
import type Rule from '../rule/Rule.js';

export class FIFO extends Algorithm {
    /** The plain rules in registration order. **/
    protected routes: Rule[] = [];

    /** The router rules in registration order. **/
    protected routerRules: RouterRule[] = [];

    /** All rules registered in the algorithm, in registration order. **/
    public override get rules(): Algorithm.ruleType[] {
        return [...this.routes, ...this.routerRules];
    }

    /**
     * Adds rules to the algorithm, splitting them by kind.
     * @param rules - The rules to add.
     */
    public override add(...rules: Algorithm.ruleType[]): void {
        for (const rule of rules) {
            if (RULE.ROUTER in rule) this.routerRules.push(rule);
            else this.routes.push(rule);
        }
    }

    /** Removes every rule from the algorithm. **/
    public override clear(): void {
        this.routes = [];
        this.routerRules = [];
    }

    /**
     * Finds the first rule matching a URL, in registration order.
     * @param url - The url to match.
     * @returns The matching rule, or null when none matches.
     */
    public override find(url: string): Algorithm.ruleType | null {
        return this.rules.find((rule) => rule.test(url)) || null;
    }
}

export namespace FIFO { }

export default FIFO;