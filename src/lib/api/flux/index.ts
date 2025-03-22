// shelter-mod inspired
import { FluxDispatcher } from "@metro/common";

const blockedSym = Symbol.for("fastcord.flux.blocked");
const modifiedSym = Symbol.for("fastcord.flux.modified");

export const dispatcher = FluxDispatcher;

type Intercept = (payload: Record<string, any> & { type: string; }) => any;
let intercepts: Intercept[] = [];

/**
 * @internal
 */
export function injectFluxInterceptor() {
    const cb = (payload: any) => {
        for (const intercept of intercepts) {
            const res = intercept(payload);

            // nullish -> nothing, falsy -> block, object -> modify
            if (res == null) {
                continue;
            } else if (!res) {
                payload[blockedSym] = true;
            } else if (typeof res === "object") {
                Object.assign(payload, res);
                payload[modifiedSym] = true;
            }
        }

        return blockedSym in payload;
    };

    (dispatcher._interceptors ??= []).unshift(cb);

    return () => dispatcher._interceptors &&= dispatcher._interceptors.filter(v => v !== cb);
}

/**
 * Intercept Flux dispatches. Return type affects the end result, where
 * nullish -> nothing, falsy -> block, object -> modify
 */
export function intercept(cb: Intercept) {
    intercepts.push(cb);

    return () => {
        intercepts = intercepts.filter(i => i !== cb);
    };
}
