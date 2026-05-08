/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description add the rule class to the app.
 * @module vizui
 * @license Apache-2.0
*/
import App from './App.js';
export declare class Rule {
    urlRule: string;
    expression: RegExp;
    private authExec;
    private renderExec;
    /**
     * Creates a new rule.
     * @param urlRule The url rule.
     * @param renderExec The render function.
     * @param authExec The authentication function.
     */
    constructor(urlRule: string, renderExec: Rule.renderer, authExec?: Rule.authenticator);
    /**
     * Executes the rule.
     * @param app The app.
     */
    exec(app: App, url?: string): Promise<void>;
    /**
     * Tests the rule.
     * @param url The url to test.
     */
    test(url: string): boolean;
    /**
     * Tests the authentication.
     */
    testAuth(): Promise<boolean>;
    /**
     * Gets the parameters from the url.
     * @param url The url.
     */
    getParams(url: string): Rule.ruleParams;
    /**
     * Creates the expression.
     * @param urlRule The url rule.
     */
    private createExpression;
}
export declare namespace Rule {
    interface ruleParams {
        [name: string]: string | undefined;
    }
    type authenticator = () => boolean | Promise<boolean>;
    type renderer = (params: ruleParams, app: App) => void | Promise<void>;
}
export default Rule;
