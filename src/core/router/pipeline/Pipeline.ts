/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Ordered collection of guards. A pipeline runs its guards in
 * registration order; nested pipelines are flattened at registration so the combined
 * order stays linear (a parent guard after a nested pipeline keeps running).
 * Navigation guards run against the entry flow; a dedicated error channel
 * (runError) runs the error-boundary guards against failed navigations. The first
 * non-void control result short-circuits the remaining guards and is returned to the
 * caller; otherwise the optional destination runs last. Port of the Vortez Pipeline.
 *
 * Intentional divergence from the Vortez Pipeline (.vortez/src/server/router/middleware/Pipeline.ts):
 * - navigation guards may either call `next()` or return a control result ({ redirect | abort | error })
 *   instead of being required to continue or send; a guard returning undefined without calling
 *   next() auto-progresses, where Vortez raises an error.
 * - error guards (Guard.Error) mirror Vortez error middleware exactly: handling the error means
 *   returning without calling `next()`; calling `next()` forwards it, and an exhausted chain
 *   re-throws so the error climbs to the enclosing router boundary and is finally emitted once
 *   by the root `error` event.
 * - there is no HTTP/WS client dispatch; Vortez dispatches by client type (runHttp/runWs).
 * - `next()` takes no error argument; Vortez next(error) rethrows.
 * The shared skeleton is `use()` flattening and the recursive `next()` chain.
 * @license Apache-2.0
 */

import { GUARD } from '../../../support/symbols.js';

import Guard from './Guard.js';

import type Router from '../Router.js';

export class Pipeline {
    /** The guards registered in this pipeline. **/
    protected vItems: Guard.Type[] = [];

    /** The number of guards registered in this pipeline. **/
    public get length(): number { return this.vItems.length; }

    /**
     * Adds guards, plain guard functions or nested pipelines to this pipeline.
     * Plain functions are auto-wrapped into `Guard.Navigation`; nested pipelines
     * are flattened so the combined guard order is fully linear (mirrors Vortez).
     * @param items - The guards to add.
     * @returns This pipeline, for chaining.
     */
    public use(...items: (Guard.Type | Guard.Function | Pipeline)[]): this {
        for (const item of items) {
            if (item instanceof Pipeline) this.vItems.push(...item.vItems);
            else if (item instanceof Guard) this.vItems.push(item);
            else this.vItems.push(new Guard.Navigation(item));
        }
        return this;
    }

    /**
     * Runs the navigation guards against a navigation.
     * @param entry - The route entry being navigated.
     * @param state - The shared guard state.
     * @param destination - Optional final step executed after the guards continue.
     * @returns The first control result produced, or undefined if it continued.
     */
    public run(
        entry: Router.Entry,
        state: Guard.State,
        destination?: Pipeline.Destination,
    ): Promise<Guard.Result | undefined> {
        const items = this.vItems.filter((item): item is Guard.Navigation => GUARD.NAVIGATION in item);
        return this.execute(items, 0, entry, state, destination);
    }

    /**
     * Runs the error-boundary guards against a failed navigation.
     * @param error - The error that failed the navigation.
     * @param entry - The entry that was being navigated.
     * @param state - The shared guard state.
     * @returns A control result ({ redirect | abort | error }) if an error guard
     * short-circuited, undefined if a guard handled it silently, or the chain
     * re-throws the error when no guard handled it.
     */
    public runError(
        error: unknown,
        entry: Router.Entry,
        state: Guard.State,
    ): Promise<Guard.Result | undefined> {
        const items = this.vItems.filter((item): item is Guard.Error => GUARD.ERROR in item);
        return this.executeError(items, 0, error, entry, state);
    }

    /**
     * Runs the navigation chain recursively through the `next()` closures.
     * @param items - The navigation guards to run.
     * @param index - The current guard index.
     * @param entry - The entry being navigated.
     * @param state - The shared guard state.
     * @param destination - The final step executed after the chain continues.
     * @returns The first control result produced, or undefined when it continued.
     */
    protected async execute(
        items: Guard.Navigation[],
        index: number,
        entry: Router.Entry,
        state: Guard.State,
        destination: Pipeline.Destination | undefined,
    ): Promise<Guard.Result | undefined> {
        if (index >= items.length) {
            if (destination) return await destination(state);
            return undefined;
        }
        const item = items[index];

        let called = false;
        let forwarded: Promise<Guard.Result | undefined> = Promise.resolve(undefined);
        const next = (): Promise<Guard.Result | undefined> => {
            if (called) return Promise.reject(new Error('[Pipeline] next() was already called for this guard; each guard may continue the chain only once.'));
            called = true;
            forwarded = this.execute(items, index + 1, entry, state, destination);
            return forwarded;
        };

        const result = await item.run(entry, next, state);
        if (result !== undefined) return result;
        if (called) return await forwarded;
        return await this.execute(items, index + 1, entry, state, destination);
    }

    /**
     * Runs the error chain recursively. A guard handles the error by returning
     * without calling `next()`, forwards it by calling `next()`, and an
     * exhausted chain re-throws the error to the enclosing boundary.
     * @param items - The error guards to run.
     * @param index - The current guard index.
     * @param error - The error that failed the navigation.
     * @param entry - The entry that was being navigated.
     * @param state - The shared guard state.
     * @returns The control result produced by a handling guard, or undefined
     * when the error was handled silently.
     * @throws When the chain is exhausted without handling the error.
     */
    protected async executeError(
        items: Guard.Error[],
        index: number,
        error: unknown,
        entry: Router.Entry,
        state: Guard.State,
    ): Promise<Guard.Result | undefined> {
        if (index >= items.length) throw error;
        const item = items[index];

        let called = false;
        let forwarded: Promise<Guard.Result | undefined> = Promise.resolve(undefined);
        const next = (): Promise<Guard.Result | undefined> => {
            if (called) return Promise.reject(new Error('[Pipeline] next() was already called for this guard; each guard may continue the chain only once.'));
            called = true;
            forwarded = this.executeError(items, index + 1, error, entry, state);
            return forwarded;
        };

        const result = await item.run(error, entry, next, state);
        if (result !== undefined) return result;
        if (called) return await forwarded;
        return undefined;
    }
}

export namespace Pipeline {
    /** The final step executed after the navigation chain continues. **/
    export type Destination = (state: Guard.State) => Promise<Guard.Result | undefined>;
}

export default Pipeline;