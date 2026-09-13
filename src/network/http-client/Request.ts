/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Fluent browser HTTP request builder backed by fetch.
 * @license Apache-2.0
 */

import Response from './Response.js';
import NetworkError from './NetworkError.js';

export class Request implements PromiseLike<Response> {
    protected vUrl: string;
    protected vMethod: Request.Method = 'GET';
    protected vHeaders: Record<string, string> = {};
    protected vSearchParams = new URLSearchParams();
    protected vBody?: Request.Body;
    protected vTimeout?: number;
    protected vSignal?: AbortSignal;
    protected vFetchOptions: RequestInit = {};

    public constructor(url: string, options: Request.Options = {}) {
        this.vUrl = url;
        this.applyOptions(options);
    }

    protected applyOptions(options: Request.Options): this {
        if (options.method) this.method(options.method);
        if (options.headers) this.headers(options.headers);
        if (options.searchParams) this.searchParams(options.searchParams);
        if (options.body !== undefined) this.body(options.body);
        if (options.json !== undefined) this.json(options.json);
        if (options.timeout !== undefined) this.timeout(options.timeout);
        if (options.signal) this.signal(options.signal);
        this.vFetchOptions = { ...options.fetch };
        return this;
    }

    public method(method: Request.Method): this { this.vMethod = method; return this; }
    public header(name: string, value: string): this { this.vHeaders[name] = value; return this; }
    public headers(headers: Record<string, string>): this { Object.assign(this.vHeaders, headers); return this; }
    public search(name: string, value: Request.SearchValue): this { this.vSearchParams.set(name, String(value)); return this; }
    public searchParams(params: Record<string, Request.SearchValue>): this {
        for (const [key, value] of Object.entries(params)) this.search(key, value);
        return this;
    }
    public body(body: Request.Body): this { this.vBody = body; return this; }
    public json(value: unknown): this {
        this.header('content-type', 'application/json');
        this.vBody = JSON.stringify(value);
        return this;
    }
    public timeout(timeout: number): this { this.vTimeout = timeout; return this; }
    public signal(signal: AbortSignal): this { this.vSignal = signal; return this; }

    /** Sends the request and preserves non-successful HTTP responses. */
    public async send(): Promise<Response> {
        const controller = new AbortController();
        let timedOut = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const abort = (): void => controller.abort();

        if (this.vSignal) {
            if (this.vSignal.aborted) controller.abort();
            else this.vSignal.addEventListener('abort', abort, { once: true });
        }
        if (this.vTimeout !== undefined) timer = setTimeout(() => { timedOut = true; controller.abort(); }, this.vTimeout);

        try {
            const response = await fetch(this.vUrlWithSearch(), {
                ...this.vFetchOptions,
                method: this.vMethod,
                headers: this.vHeaders,
                body: this.fetchBody(),
                signal: controller.signal,
            });
            return new Response(response);
        } catch (cause) {
            if (timedOut) throw new NetworkError('The request timed out', NetworkError.Kind.TIMEOUT, undefined, undefined, undefined, cause);
            if (controller.signal.aborted) throw new NetworkError('The request was aborted', NetworkError.Kind.ABORT, undefined, undefined, undefined, cause);
            throw new NetworkError('The request failed', NetworkError.Kind.NETWORK, undefined, undefined, undefined, cause);
        } finally {
            if (timer) clearTimeout(timer);
            this.vSignal?.removeEventListener('abort', abort);
        }
    }

    public then<TResult1 = Response, TResult2 = never>(
        onfulfilled?: ((value: Response) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2> { return this.send().then(onfulfilled, onrejected); }

    protected vUrlWithSearch(): string {
        const url = new URL(this.vUrl, typeof window !== 'undefined' ? window.location.href : 'http://localhost/');
        for (const [key, value] of this.vSearchParams) url.searchParams.set(key, value);
        return this.vUrl.startsWith('/') || this.vUrl.startsWith('.') ? `${url.pathname}${url.search}${url.hash}` : url.toString();
    }

    protected fetchBody(): BodyInit | undefined {
        if (this.vBody === undefined || this.vBody === null) return undefined;
        if (typeof this.vBody === 'string' || this.vBody instanceof ArrayBuffer) return this.vBody;
        if (typeof Blob !== 'undefined' && this.vBody instanceof Blob) return this.vBody;
        if (typeof FormData !== 'undefined' && this.vBody instanceof FormData) return this.vBody;
        return JSON.stringify(this.vBody);
    }
}

export namespace Request {
    export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE';
    export type SearchValue = string | number | boolean;
    export type Body = string | FormData | Record<string, unknown> | Blob | ArrayBuffer | null;
    export interface Options {
        method?: Method;
        headers?: Record<string, string>;
        searchParams?: Record<string, SearchValue>;
        body?: Body;
        json?: unknown;
        timeout?: number;
        signal?: AbortSignal;
        fetch?: RequestInit;
    }
}

export default Request;