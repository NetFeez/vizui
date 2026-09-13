/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Cached response body reader for browser HTTP responses.
 * @license Apache-2.0
 */

export class Body {
    protected vResponse: globalThis.Response;
    protected vArrayBuffer?: Promise<ArrayBuffer>;
    protected vBlob?: Promise<Blob>;
    protected vText?: Promise<string>;
    protected vJson?: Promise<unknown>;

    public constructor(response: globalThis.Response) { this.vResponse = response; }

    /** Reads the response body as an ArrayBuffer. **/
    public arrayBuffer(): Promise<ArrayBuffer> { return this.vArrayBuffer ??= this.vResponse.arrayBuffer(); }

    /** Reads the response body as a Blob. **/
    public blob(): Promise<Blob> {
        return this.vBlob ??= this.arrayBuffer().then((buffer) => new Blob([buffer], {
            type: this.vResponse.headers.get('content-type') ?? '',
        }));
    }

    /** Reads the response body as text. **/
    public text(): Promise<string> {
        return this.vText ??= this.arrayBuffer().then((buffer) => new TextDecoder().decode(buffer));
    }

    /** Reads and parses the response body as JSON. **/
    public async json<T = unknown>(): Promise<T> {
        this.vJson ??= this.text().then((text) => JSON.parse(text));
        return await this.vJson as T;
    }
}

export default Body;