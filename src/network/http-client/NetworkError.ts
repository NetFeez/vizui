/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Network error contract shared by http and socket clients.
 * @license Apache-2.0
 */

export class NetworkError extends Error {
    /**
     * Creates a network error.
     * @param message - The error message.
     * @param kind - The category of the failure.
     * @param status - The http status, when the failure came from a response.
     */
    public constructor(
        message: string,
        public readonly kind: NetworkError.Kind,
        public readonly status?: number,
        public readonly body?: unknown,
        public readonly response?: unknown,
        public readonly cause?: unknown,
    ) { super(message, { cause }); }

    /** Whether the failure was a timeout. **/
    public get isTimeout(): boolean { return this.kind === NetworkError.Kind.TIMEOUT; }

    /** Whether the failure was an abort. **/
    public get isAbort(): boolean { return this.kind === NetworkError.Kind.ABORT; }

    /** Whether the failure was an http error response. **/
    public get isHttp(): boolean { return this.kind === NetworkError.Kind.HTTP; }
}

export namespace NetworkError {
    /** The categories of network failures. **/
    export enum Kind {
        NETWORK = 'network',
        TIMEOUT = 'timeout',
        ABORT = 'abort',
        HTTP = 'http',
        PARSE = 'parse',
    }
}
export default NetworkError;
