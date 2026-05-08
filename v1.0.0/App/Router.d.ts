/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Adds the router to the vizui.
 * @module vizui
 * @license Apache-2.0
 */
import App from "./App.js";
import Events from "../Events.js";
import _Rule from "./Rule.js";
export { default as Rule } from "./Rule.js";
export declare class Router extends Events<Router.eventMap> {
    private static history;
    private index;
    private rules;
    /**
     * Creates an instance of Router.
    */
    constructor();
    private get history();
    private set history(value);
    /**
     * Triggered when the router receives a request.
     * @param app The app instance.
     */
    renderManager(app: App): Promise<undefined>;
    /**
     * Add render rules to the router.
     * @param rules The rules to add.
     */
    addRules(rules: Router.Rule[]): void;
    /**
     * Add a render rule to the router.
     * @param urlRule The url rule to match.
     * @param renderExec The function to execute when the rule is matched.
     * @param authExec The function to execute to check if the user is authenticated.
     */
    addRule(urlRule: string, renderExec: Router.Rule.renderer, authExec?: Router.Rule.authenticator): void;
    /**
     * Cleans the url.
     * @param url The url to clean.
     * @returns The cleaned url.
    */
    cleanUrl(url: string): string;
    /**
     * check if there is a previous page.
     * @returns true if there is a previous page, false otherwise.
    */
    hasPrevious(): boolean;
    /**
     * check if there is a next page.
     * @returns true if there is a next page, false otherwise.
    */
    hasNext(): boolean;
    /**
     * Gets the current page.
     * @returns The current page.
    */
    get page(): string;
    /**
     * Sets the current page.
     * @param page The page to set.
    */
    set page(page: string);
    /**
     * Sets the current page.
     * @param page The page to set.
    */
    set(page: string, change?: boolean): void;
    /**
     * Goes back to the previous page.
    */
    back(change?: boolean): void;
    /**
     * Goes to the next page.
    */
    next(change?: boolean): void;
}
export declare namespace Router {
    export import Rule = _Rule;
    type eventMap = {
        [name in ('change' | 'push' | 'back' | 'next')]: Events.Listener;
    };
}
export default Router;
