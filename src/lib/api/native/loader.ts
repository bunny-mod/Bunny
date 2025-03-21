import { VdThemeInfo } from "@lib/addons/themes";

// @ts-ignore
const fastcordLoaderIdentity = globalThis.__FASTCORD_LOADER__;
// @ts-ignore
const vendettaLoaderIdentity = globalThis.__vendetta_loader;

export interface VendettaLoaderIdentity {
    name: string;
    features: {
        loaderConfig?: boolean;
        devtools?: {
            prop: string;
            version: string;
        },
        themes?: {
            prop: string;
        };
    };
}

export function isVendettaLoader() {
    return vendettaLoaderIdentity != null;
}

export function isFastcordLoader() {
    return fastcordLoaderIdentity != null;
}

function polyfillVendettaLoaderIdentity() {
    if (!isFastcordLoader() || isVendettaLoader()) return null;

    const loader = {
        name: fastcordLoaderIdentity.loaderName,
        features: {} as Record<string, any>
    };

    if (isLoaderConfigSupported()) loader.features.loaderConfig = true;
    if (isSysColorsSupported()) {
        loader.features.syscolors = {
            prop: "__vendetta_syscolors"
        };

        Object.defineProperty(globalThis, "__vendetta_syscolors", {
            get: () => getSysColors(),
            configurable: true
        });
    }
    if (isThemeSupported()) {
        loader.features.themes = {
            prop: "__vendetta_theme"
        };

        Object.defineProperty(globalThis, "__vendetta_theme", {
            // get: () => getStoredTheme(),
            get: () => {
                // PyonXposed only returns keys it parses, making custom keys like Themes+' to gone
                const id = getStoredTheme()?.id;
                if (!id) return null;

                const { themes } = require("@lib/addons/themes");
                return themes[id] ?? getStoredTheme() ?? null;
            },
            configurable: true
        });
    }

    Object.defineProperty(globalThis, "__vendetta_loader", {
        get: () => loader,
        configurable: true
    });

    return loader as VendettaLoaderIdentity;
}

export function getLoaderIdentity() {
    if (isFastcordLoader()) {
        return fastcordLoaderIdentity;
    } else if (isVendettaLoader()) {
        return getVendettaLoaderIdentity();
    }

    return null;
}

export function getVendettaLoaderIdentity(): VendettaLoaderIdentity | null {
    // @ts-ignore
    if (globalThis.__vendetta_loader) return globalThis.__vendetta_loader;
    return polyfillVendettaLoaderIdentity();
}

// add to __vendetta_loader anyway
getVendettaLoaderIdentity();

export function getLoaderName() {
    if (isFastcordLoader()) return fastcordLoaderIdentity.loaderName;
    else if (isVendettaLoader()) return vendettaLoaderIdentity.name;

    return "Unknown";
}

export function getLoaderVersion(): string | null {
    if (isFastcordLoader()) return fastcordLoaderIdentity.loaderVersion;
    return null;
}

export function isLoaderConfigSupported() {
    if (isFastcordLoader()) {
        return true;
    } else if (isVendettaLoader()) {
        return vendettaLoaderIdentity!!.features.loaderConfig;
    }

    return false;
}

export function isThemeSupported() {
    if (isFastcordLoader()) {
        return fastcordLoaderIdentity.hasThemeSupport;
    } else if (isVendettaLoader()) {
        return vendettaLoaderIdentity!!.features.themes != null;
    }

    return false;
}

export function getStoredTheme(): VdThemeInfo | null {
    if (isFastcordLoader()) {
        return fastcordLoaderIdentity.storedTheme;
    } else if (isVendettaLoader()) {
        const themeProp = vendettaLoaderIdentity!!.features.themes?.prop;
        if (!themeProp) return null;
        // @ts-ignore
        return globalThis[themeProp] || null;
    }

    return null;
}

export function getThemeFilePath() {
    if (isFastcordLoader()) {
        return "pyoncord/current-theme.json";
    } else if (isVendettaLoader()) {
        return "vendetta_theme.json";
    }

    return null;
}

export function isReactDevToolsPreloaded() {
    if (isFastcordLoader()) {
        return Boolean(window.__reactDevTools);
    }
    if (isVendettaLoader()) {
        return vendettaLoaderIdentity!!.features.devtools != null;
    }

    return false;
}

export function getReactDevToolsProp(): string | null {
    if (!isReactDevToolsPreloaded()) return null;

    if (isFastcordLoader()) {
        window.__pyoncord_rdt = window.__reactDevTools.exports;
        return "__pyoncord_rdt";
    }

    if (isVendettaLoader()) {
        return vendettaLoaderIdentity!!.features.devtools!!.prop;
    }

    return null;
}

export function getReactDevToolsVersion() {
    if (!isReactDevToolsPreloaded()) return null;

    if (isFastcordLoader()) {
        return window.__reactDevTools.version || null;
    }
    if (isVendettaLoader()) {
        return vendettaLoaderIdentity!!.features.devtools!!.version;
    }

    return null;
}

export function isSysColorsSupported() {
    if (isFastcordLoader()) return fastcordLoaderIdentity.isSysColorsSupported;
    else if (isVendettaLoader()) {
        return vendettaLoaderIdentity!!.features.syscolors != null;
    }

    return false;
}

export function getSysColors() {
    if (!isSysColorsSupported()) return null;
    if (isFastcordLoader()) {
        return fastcordLoaderIdentity.sysColors;
    } else if (isVendettaLoader()) {
        return vendettaLoaderIdentity!!.features.syscolors!!.prop;
    }

    return null;
}

export function getLoaderConfigPath() {
    if (isFastcordLoader()) {
        return "fastcord/loader.json";
    } else if (isVendettaLoader()) {
        return "vendetta_loader.json";
    }

    return "loader.json";
}

export function isFontSupported() {
    if (isFastcordLoader()) return fastcordLoaderIdentity.fontPatch === 2;

    return false;
}
