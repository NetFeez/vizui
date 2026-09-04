/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description URL rule with expression matching, params and auth guard.
 * @license Apache-2.0
 */

import App from './App.js';

export class Rule {
    public urlRule: string;
    public expression: RegExp;
    private vAuthExec: Rule.authenticator;
    private vRenderExec: Rule.renderer;
    /**
     * Creates a new rule.
     * @param urlRule The url rule.
     * @param renderExec The render function.
     * @param authExec The authentication function.
     */
    public constructor(urlRule: string, renderExec: Rule.renderer, authExec?: Rule.authenticator) {
        urlRule = !urlRule.startsWith('/') ? `/${urlRule}` : urlRule;
        urlRule = urlRule.endsWith('/') ? urlRule.slice(0, -1) : urlRule;
        this.urlRule = urlRule;
        this.expression = this.vCreateExpression(urlRule);
        this.vRenderExec = renderExec;
        this.vAuthExec = authExec ?? (() => true);
    }
    /**
     * Executes the rule.
     * @param app The app.
     * @param url The url to test.
     */
    public async exec(app: App, url?: string): Promise<void> {
        if (!await this.testAuth()) return;
        const params = this.getParams(url ?? app.router.page);
        await this.vRenderExec(params, app);
    }
    /**
     * Tests the rule against a url.
     * @param url The url to test.
     * @returns True if the rule matches.
     */
    public test(url: string): boolean {
        return this.expression.test(url);
    }
    /**
     * Tests the authentication.
     * @returns True if authenticated.
     */
    public async testAuth(): Promise<boolean> {
        return !this.vAuthExec || await this.vAuthExec();
    }
    /**
     * Gets the parameters from the url.
     * @param url The url.
     * @returns The parameters.
     */
    public getParams(url: string): Rule.ruleParams {
        const match = this.expression.exec(url);
        if (!match || !match.groups) return {};
        return { ...match.groups };
    }
    /**
     * Creates the expression regex from a url rule.
     * @param urlRule The url rule.
     * @returns The compiled regex.
     */
    private vCreateExpression(urlRule: string): RegExp {
        const validators = {
            paramRequired: /^\$(?<param>(?!\$).+)$/,
            paramOptional: /^\$\?(?<param>(?!\$).+)$/,
            escape: /\\(?![\$\[\]\*\+\?\.\(\)\{\}\^\|\-])|(?<!\\)[\$\[\]\*\+\?\.\(\)\{\}\^\|\-]/gi,
        };
        const zones = urlRule.split('/').slice(1);
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
    export interface ruleParams {
        [name: string]: string | undefined;
    }
    export type authenticator = () => boolean | Promise<boolean>;
    export type renderer = (params: ruleParams, app: App) => void | Promise<void>;
}

export default Rule;
