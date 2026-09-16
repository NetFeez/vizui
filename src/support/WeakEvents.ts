export class WeakEvents<EventMap extends WeakEvents.EventMap = WeakEvents.EventMap> implements WeakEvents.Public<EventMap> {
    protected vGCN: FinalizationRegistry<WeakEvents.GCNEntry>;
    protected vStorage: WeakEvents.ListenerMap<EventMap>;
    protected vOnces: Set<WeakRef<WeakEvents.Listener<any>>>;

    public constructor() {
        this.vGCN = new FinalizationRegistry((entry) => {
            const listeners = this.vStorage[entry.name];
            if (!listeners) return;
            listeners.delete(entry.listener);
            this.vOnces.delete(entry.listener);
            if (listeners.size === 0) delete this.vStorage[entry.name];
        });
        this.vStorage = {};
        this.vOnces = new Set();
    }

    public get public(): WeakEvents.Public<EventMap> { return this; }

    public on<E extends string & keyof EventMap>(name: E, listener: WeakEvents.Listener<EventMap[E]>): WeakEvents.off {
        const ref = new WeakRef(listener);
        const listeners = this.vStorage[name] ?? (this.vStorage[name] = new Set());
        this.vGCN.register(listener, { name, listener: ref }, ref);
        listeners.add(ref);
        return () => {
            listeners.delete(ref);
            this.vGCN.unregister(ref);
            if (listeners.size === 0) delete this.vStorage[name];
        };
    }
    public once<E extends string & keyof EventMap>(name: E, listener: WeakEvents.Listener<EventMap[E]>): WeakEvents.off {
        const ref = new WeakRef(listener);
        this.vGCN.register(listener, { name, listener: ref }, ref);
        const listeners = this.vStorage[name] ?? (this.vStorage[name] = new Set());
        this.vOnces.add(ref);
        listeners.add(ref);
        return () => {
            this.vGCN.unregister(ref);
            this.vOnces.delete(ref);
            listeners.delete(ref);
            if (listeners.size === 0) delete this.vStorage[name];
        };
    }
    public clear(): void {
        for (const name in this.vStorage) {
            const listeners = this.vStorage[name];
            if (!listeners) continue;
            for (const ref of listeners) {
                this.vGCN.unregister(ref);
            }
        }
        this.vStorage = {};
        this.vOnces.clear();
    }

    public emit<E extends string & keyof EventMap>(name: E, ...args: EventMap[E]): void {
        const listeners = this.vStorage[name];
        if (!listeners) return;
        for (const ref of listeners) {
            const listener = ref.deref();
            if (!listener) { listeners.delete(ref); continue; }
            try { listener(...args); }
            finally {
                if (this.vOnces.has(ref)) {
                    listeners.delete(ref);
                    this.vOnces.delete(ref);
                }
            }
        }
    }
}

export namespace WeakEvents {
    export interface EventMap {
        [name: string]: [...args: any[]];
    }
    export type off = () => void;
    export type Listener<T extends any[]> = (...args: T) => void;
    export type ListenerMap<eventMap extends EventMap> = {
        [name in keyof eventMap]?: Set<WeakRef<Listener<eventMap[name]>>>;
    }
    export interface Public<eventMap extends EventMap> {
        on<E extends string & keyof eventMap>(name: E, listener: Listener<eventMap[E]>): off;
        once<E extends string & keyof eventMap>(name: E, listener: Listener<eventMap[E]>): off;
        // emit<E extends string & keyof eventMap>(name: E, ...args: eventMap[E]): void;
    }
    export interface GCNEntry {
        name: string;
        listener: WeakRef<Listener<any>>;
    }
}