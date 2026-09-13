/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description HTTP response wrapper exposing metadata and cached body readers.
 * @license Apache-2.0
 */

import Body from './Body.js';
import NetworkError from './NetworkError.js';

export class Response {
    public readonly body: Body;
    public readonly headers: Headers;
    public readonly status: number;
    public readonly statusText: string;
    public readonly url: string;
    public readonly redirected: boolean;

    public constructor(
        protected readonly vResponse: globalThis.Response
    ) {
        this.body = new Body(vResponse);
        this.headers = vResponse.headers;
        this.status = vResponse.status;
        this.statusText = vResponse.statusText;
        this.url = vResponse.url;
        this.redirected = vResponse.redirected;
    }

    public get ok(): boolean { return this.vResponse.ok; }
    public get type(): Response.Type { return this.vResponse.type; }

    /** Reads the response as JSON. **/
    public json<T = unknown>(): Promise<T> {
        return this.status === 204 ? Promise.resolve(undefined as T) : this.body.json<T>();
    }

    /** Reads the response as text. **/
    public text(): Promise<string> { return this.body.text(); }

    /** Converts a non-successful response into a typed network error. **/
    public async toError(): Promise<NetworkError> {
        let body: unknown;
        try { body = await this.json(); }
        catch { try { body = await this.text(); } catch { body = undefined; } }
        return new NetworkError(`Request failed with status ${this.status}`, NetworkError.Kind.HTTP, this.status, body, this);
    }
}

export namespace Response {
    export type Type = globalThis.Response['type'];
}

export default Response;