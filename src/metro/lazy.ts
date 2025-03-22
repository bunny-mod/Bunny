import { _patcherDelaySymbol } from "@lib/api/patcher";
import { proxyLazy } from "@lib/utils/lazy";

import { findExports } from "./finders";
import { getMetroCache } from "./internals/caches";
import { metroModules, subscribeModule } from "./internals/modules";
import type { FilterFn, LazyModuleContext } from "./types";

/** @internal */
export const _lazyContextSymbol = Symbol.for("fastcord.metro.lazyContext");

const _lazyContexts = new WeakMap<any, LazyModuleContext>();

function getIndexedFind<A extends unknown[]>(filter: FilterFn<A>) {
    const modulesMap = getMetroCache().findIndex[filter.uniq];
    if (!modulesMap) return undefined;

    for (const k in modulesMap)
        if (k[0] !== "_") return Number(k);
}

function subscribeLazyModule(proxy: any, callback: (exports: any) => void) {
    const info = getLazyContext(proxy);
    if (!info) throw new Error("Subscribing a module for non-proxy-find");
    if (!info.indexed) throw new Error("Attempting to subscribe to a non-indexed find");

    return subscribeModule(info.moduleId!, () => {
        callback(findExports(info.filter));
    });
}

export function getLazyContext<A extends unknown[]>(proxy: any): LazyModuleContext<A> | void {
    return _lazyContexts.get(proxy) as unknown as LazyModuleContext<A>;
}

export function createLazyModule<A extends unknown[]>(filter: FilterFn<A>) {
    let cache: any = undefined;

    const moduleId = getIndexedFind(filter);
    const context: LazyModuleContext<A> = {
        filter,
        indexed: !!moduleId,
        moduleId,
        getExports(cb: (exports: any) => void) {
            if (!moduleId || metroModules[moduleId]?.isInitialized) {
                cb(this.forceLoad());
                return () => void 0;
            }
            return this.subscribe(cb);
        },
        subscribe(cb: (exports: any) => void) {
            return subscribeLazyModule(proxy, cb);
        },
        get cache() {
            return cache;
        },
        forceLoad() {
            cache ??= findExports(filter);
            if (!cache) throw new Error(`${filter.uniq} is ${typeof cache}! (id ${context.moduleId ?? "unknown"})`);
            return cache;
        }
    };

    const proxy = proxyLazy(() => context.forceLoad(), {
        exemptedEntries: {
            [_lazyContextSymbol]: context,
            [_patcherDelaySymbol]: (cb: (exports: any) => void) => context.getExports(cb)
        }
    });

    _lazyContexts.set(proxy, context as LazyModuleContext<any>);

    return proxy;
}
