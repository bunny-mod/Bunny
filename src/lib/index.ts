import "../global.d.ts"; // eslint-disable-line import-alias/import-alias
import "../modules.d.ts"; // eslint-disable-line import-alias/import-alias

export * as fonts from "./addons/fonts/index.js";
export * as plugins from "./addons/plugins/index.js";
export * as themes from "./addons/themes/index.js";
export * as api from "./api";
export * as ui from "./ui";
export * as utils from "./utils";
export * as metro from "@metro";

import * as fonts from "./addons/fonts/index.js";
import * as plugins from "./addons/plugins/index.js";
import * as themes from "./addons/themes/index.js";

/** @internal */
export * as _jsx from "react/jsx-runtime";

import { proxyLazy } from "./utils/lazy";

/**
 * @internal
 * @deprecated Moved to top level (fastcord.*)
 */
export const managers = proxyLazy(() => {
    console.warn("fastcord.managers.* is deprecated, and moved the top level (fastcord.*). fastcord.managers will be eventually removed soon");

    return {
        get fonts() { return fonts; },
        get plugins() { return plugins; },
        get themes() { return themes; }
    };
}, { hint: "object" });

const _disposer = [] as Array<() => unknown>;

export function unload() {
    for (const d of _disposer) if (typeof d === "function") d();
    // @ts-expect-error
    delete window.fastcord;
}

/**
 * For internal use only, do not use!
 * @internal
 */
unload.push = (fn: typeof _disposer[number]) => {
    _disposer.push(fn);
};
