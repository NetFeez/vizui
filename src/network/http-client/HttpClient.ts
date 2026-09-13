/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description HTTP client factory with shared defaults and JSON conveniences.
 * @license Apache-2.0
 */

import Request from './Request.js';

export { Request } from './Request.js';
export { Response } from './Response.js';
export { Body } from './Body.js';

export class HttpClient {
    protected readonly vBase: string;
    protected readonly vDefaults: HttpClient.Options;

    public constructor(base: string = '', defaults: HttpClient.Options = {}) {
        this.vBase = base.replace(/\/$/, '');
        this.vDefaults = { ...defaults, headers: { ...defaults.headers } };
    }

    public request(url: string, options: Request.Options = {}): Request {
        return new Request(this.buildUrl(url), {
            ...this.vDefaults,
            ...options,
            headers: { ...this.vDefaults.headers, ...options.headers },
        });
    }

    public get(url: string, options: HttpClient.Options = {}): Request { return this.request(url, { ...options, method: 'GET' }); }
    public post(url: string, options: HttpClient.Options = {}): Request { return this.request(url, { ...options, method: 'POST' }); }
    public put(url: string, options: HttpClient.Options = {}): Request { return this.request(url, { ...options, method: 'PUT' }); }
    public patch(url: string, options: HttpClient.Options = {}): Request { return this.request(url, { ...options, method: 'PATCH' }); }
    public delete(url: string, options: HttpClient.Options = {}): Request { return this.request(url, { ...options, method: 'DELETE' }); }
    public head(url: string, options: HttpClient.Options = {}): Request { return this.request(url, { ...options, method: 'HEAD' }); }
    public options(url: string, options: HttpClient.Options = {}): Request { return this.request(url, { ...options, method: 'OPTIONS' }); }

    public async getJson<T = unknown>(url: string, options: HttpClient.Options = {}): Promise<T> { return this.json<T>(this.get(url, options)); }
    public async postJson<T = unknown>(url: string, body: unknown, options: HttpClient.Options = {}): Promise<T> { return this.json<T>(this.post(url, { ...options, json: body })); }
    public async putJson<T = unknown>(url: string, body: unknown, options: HttpClient.Options = {}): Promise<T> { return this.json<T>(this.put(url, { ...options, json: body })); }
    public async patchJson<T = unknown>(url: string, body: unknown, options: HttpClient.Options = {}): Promise<T> { return this.json<T>(this.patch(url, { ...options, json: body })); }
    public async deleteJson<T = unknown>(url: string, options: HttpClient.Options = {}): Promise<T> { return this.json<T>(this.delete(url, options)); }

    protected async json<T>(request: Request): Promise<T> {
        const response = await request;
        if (!response.ok) throw await response.toError();
        return response.json<T>();
    }

    protected buildUrl(url: string): string {
        if (!this.vBase || /^https?:\/\//i.test(url)) return url;
        return `${this.vBase}/${url.replace(/^\//, '')}`;
    }
}

export namespace HttpClient {
    export type Options = Omit<Request.Options, 'method'>;
}

export default HttpClient;
