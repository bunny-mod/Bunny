import { version } from "fastcord-build-info";
const { instead } = require("spitroast");

// @ts-ignore - shut up fr
globalThis.window = globalThis;

async function initializeFastcord() {
    try {
        // Make 'freeze' and 'seal' do nothing
        Object.freeze = Object.seal = Object;

        await require("@metro/internals/caches").initMetroCache();
        await require(".").default();
    } catch (e) {
        const { ClientInfoManager } = require("@lib/api/native/modules");
        const stack = e instanceof Error ? e.stack : undefined;

        console.log(stack ?? e?.toString?.() ?? e);
        alert([
            "Failed to load Fastcord!\n",
            `Build Number: ${ClientInfoManager.Build}`,
            `Fastcord: ${version}`,
            stack || e?.toString?.(),
        ].join("\n"));
    }
}

// @ts-ignore
if (typeof globalThis.__r !== "undefined") {
    initializeFastcord();
} else {
    // We hold calls from the native side
    function onceIndexRequired(originalRequire: any) {
        const batchedBridge = window.__fbBatchedBridge;

        const callQueue = new Array<any>;
        const unpatchHook = instead("callFunctionReturnFlushedQueue", batchedBridge, (args: any, orig: any) => {
            if (args[0] === "AppRegistry" || !batchedBridge.getCallableModule(args[0])) {
                callQueue.push(args);
                return batchedBridge.flushedQueue();
            }

            return orig.apply(batchedBridge, args);
        });

        const startDiscord = async () => {
            await initializeFastcord();
            unpatchHook();
            originalRequire(0);

            callQueue.forEach(arg =>
                batchedBridge.getCallableModule(arg[0])
                && batchedBridge.__callFunction(...arg));
        };

        startDiscord();
    }

    var _requireFunc: any; // We can't set properties to 'this' during __r set for some reason

    Object.defineProperties(globalThis, {
        __r: {
            configurable: true,
            get: () => _requireFunc,
            set(v) {
                _requireFunc = function patchedRequire(a: number) {
                    // Initializing index.ts(x)
                    if (a === 0) {
                        // https://github.com/facebook/metro/commit/1361405ffe6f1bdef54295addfef0f30523aaab2
                        if (window.modules instanceof Map) {
                            window.modules = Object.fromEntries([...window.modules]);
                        }

                        onceIndexRequired(v);
                        _requireFunc = v;
                    } else return v(a);
                };
            }
        },
        __d: {
            configurable: true,
            get() {
                // @ts-ignore - I got an error where 'Object' is undefined *sometimes*, which is literally never supposed to happen
                if (window.Object && !window.modules) {
                    window.modules = window.__c?.();
                }
                return this.value;
            },
            set(v) { this.value = v; }
        }
    });
}
