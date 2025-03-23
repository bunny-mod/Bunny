declare global {
    interface Window {
        __fbBatchedBridge: {
            getCallableModule: (module: string) => boolean;
            flushedQueue: () => void;
            __callFunction: (...args: unknown[]) => void;
            callFunctionReturnFlushedQueue: (...args: unknown[]) => unknown;
        };
        modules: Record<string, unknown> | Map<string, unknown>;
        __r: (moduleId: number) => unknown;
        __d: unknown;
        __c?: () => Record<string, unknown> | Map<string, unknown>;
        Object: ObjectConstructor;
    }

    let window: Window & typeof globalThis;

    interface GlobalThis {
        __r: (moduleId: number) => unknown;
        __d: unknown;
        window: Window & typeof globalThis;
    }
}

export {};
