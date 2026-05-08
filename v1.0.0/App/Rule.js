/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description add the rule class to the app.
 * @module vizui
 * @license Apache-2.0
*/
export class Rule {
    urlRule;
    expression;
    authExec;
    renderExec;
    /**
     * Creates a new rule.
     * @param urlRule The url rule.
     * @param renderExec The render function.
     * @param authExec The authentication function.
     */
    constructor(urlRule, renderExec, authExec) {
        urlRule = !urlRule.startsWith('/') ? `/${urlRule}` : urlRule;
        urlRule = urlRule.endsWith('/') ? urlRule.slice(0, -1) : urlRule;
        this.urlRule = urlRule;
        this.expression = this.createExpression(urlRule);
        this.renderExec = renderExec;
        this.authExec = authExec ?? (() => true);
    }
    /**
     * Executes the rule.
     * @param app The app.
     */
    async exec(app, url) {
        if (!this.testAuth())
            return;
        const params = this.getParams(url ?? app.router.page);
        await this.renderExec(params, app);
    }
    /**
     * Tests the rule.
     * @param url The url to test.
     */
    test(url) {
        return this.expression.test(url);
    }
    /**
     * Tests the authentication.
     */
    async testAuth() {
        return !this.authExec || await this.authExec();
    }
    /**
     * Gets the parameters from the url.
     * @param url The url.
     */
    getParams(url) {
        const match = this.expression.exec(url);
        if (!match || !match.groups)
            return {};
        return { ...match.groups };
    }
    /**
     * Creates the expression.
     * @param urlRule The url rule.
     */
    createExpression(urlRule) {
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
export default Rule;
