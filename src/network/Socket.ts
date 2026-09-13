/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description WebSocket client wrapper with automatic reconnection.
 * @license Apache-2.0
 */

import Events from '../events/Events.js';

export class Socket extends Events<Socket.EventMap> {
    /** The underlying websocket, when connected. **/
    private vSocket: WebSocket | null = null;

    /** The number of consecutive failed connections. **/
    private vAttempts = 0;

    /** Whether the socket was closed on purpose and must not reconnect. **/
    private vClosed = false;

    /** The pending reconnection timer, when scheduled. **/
    private vTimer: number | null = null;

    /**
     * Creates a socket and starts connecting immediately.
     * @param url - The websocket url.
     * @param options - The connection options.
     */
    public constructor(
        public readonly url: string,
        private readonly vOptions: Socket.Options = {}
    ) { super(); this.connect(); }

    /** Whether the socket is currently open. **/
    public get connected(): boolean { return this.vSocket?.readyState === WebSocket.OPEN; }

    /** The number of consecutive reconnection attempts performed. **/
    public get attempts(): number { return this.vAttempts; }

    /** The current connection status. **/
    public get status(): Socket.Status {
        switch (this.vSocket?.readyState) {
            case WebSocket.OPEN: return 'open';
            case WebSocket.CONNECTING: return 'connecting';
            default: return 'closed';
        }
    }

    /** Whether the connection has been closed. **/
    public get isClosed(): boolean { return this.status === 'closed'; }

    /**
     * Creates a socket and starts connecting immediately.
     * @param url - The websocket url.
     * @param options - The connection options.
     * @returns The socket.
     */
    public static connect(url: string, options?: Socket.Options): Socket { return new Socket(url, options); }

    /**
     * Sends data through the socket when open.
     * @param data - The data to send.
     * @returns Whether the data was sent.
     */
    public send(data: string | Blob | ArrayBuffer): boolean {
        if (!this.connected) return false;
        this.vSocket!.send(data);
        return true;
    }

    /**
     * Sends a JSON-serializable value through the socket as a text frame.
     * @param data - The value to serialize and send.
     * @returns Whether the data was sent.
     */
    public sendJson(data: unknown): boolean {
        return this.send(JSON.stringify(data));
    }

    /** Closes the socket and stops reconnecting. **/
    public close(): void {
        this.vClosed = true;
        this.clearTimer();
        this.vSocket?.close();
        this.vSocket = null;
        this.emit('close');
    }

    /** Establishes the underlying websocket connection. **/
    private connect(): void {
        if (this.vClosed) return;
        this.vSocket = new WebSocket(this.url);
        this.vSocket.addEventListener('open', () => {
            this.vAttempts = 0;
            this.emit('open');
        });
        this.vSocket.addEventListener('message', (event) => this.handleMessage(event.data));
        this.vSocket.addEventListener('error', (event) => {
            const error = 'error' in event && event.error instanceof Error
                ? event.error
                : new Error('WebSocket error.');
            this.emit('error', error);
        });
        this.vSocket.addEventListener('close', () => {
            this.vSocket = null;
            if (this.vClosed) return;
            this.emit('close');
            this.scheduleReconnect();
        });
    }

    /**
     * Routes an incoming message to the matching events.
     * @param data - The raw message payload.
     */
    private handleMessage(data: string | Blob | ArrayBuffer): void {
        this.emit('message', data);
        if (typeof data === 'string') this.emit('message:text', data);
        else this.emit('message:binary', data);
    }

    /** Schedules a reconnection attempt after the configured delay. **/
    private scheduleReconnect(): void {
        const options = this.vOptions;
        if (options.autoReconnect === false) return;
        const max = options.maxAttempts ?? Number.POSITIVE_INFINITY;
        if (this.vAttempts >= max) return;
        this.clearTimer();
        const delay = options.delay ?? 1000;
        this.vTimer = window.setTimeout(() => {
            this.vAttempts += 1;
            this.connect();
        }, delay);
    }

    /** Clears any pending reconnection timer. **/
    private clearTimer(): void {
        if (this.vTimer !== null) {
            window.clearTimeout(this.vTimer);
            this.vTimer = null;
        }
    }
}

export namespace Socket {
    /** The connection options of a socket. **/
    export interface Options {
        /** Whether failed connections reconnect automatically. **/
        autoReconnect?: boolean;

        /** The milliseconds between reconnection attempts. **/
        delay?: number;

        /** The maximum number of reconnection attempts. **/
        maxAttempts?: number;
    }

    /** The connection status of a socket. **/
    export type Status = 'connecting' | 'open' | 'closed';

    /** The events emitted by a socket. **/
    export type EventMap = {
        /** The connection was established. **/
        open: [];

        /** The connection was closed. **/
        close: [];

        /** A message arrived in any format. **/
        message: [data: string | Blob | ArrayBuffer];

        /** A text message arrived. **/
        'message:text': [data: string];

        /** A binary message arrived. **/
        'message:binary': [data: Blob | ArrayBuffer];

        /** A connection error occurred. **/
        error: [error: Error];
    };
}
export default Socket;
