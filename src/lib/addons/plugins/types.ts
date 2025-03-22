import { FastcordManifest } from "@lib/addons/types";
import { createStorage } from "@lib/api/storage";
import { Logger } from "@lib/utils/logger";

export type PluginRepo = Record<string, {
    version: string;
    // For plugin developing convenience, plugins with this on will always get fetched
    alwaysFetch?: boolean;
}> & {
    $meta: {
        name: string;
        description: string;
    };
};

export interface PluginRepoStorage {
    [repoUrl: string]: PluginRepo;
}

export interface PluginSettingsStorage {
    [pluginId: string]: {
        enabled: boolean;
    };
}

export interface FastcordPluginManifest extends FastcordManifest {
    readonly type: "plugin";
    readonly spec: 3;
    readonly main: string;
}

export interface FastcordPluginManifestInternal extends FastcordPluginManifest {
    readonly parentRepository: string;
    readonly jsPath?: string;
}

export interface PluginInstance {
    start?(): void;
    stop?(): void;
    SettingsComponent?(): JSX.Element;
}

export interface PluginInstanceInternal extends PluginInstance {
    readonly manifest: FastcordPluginManifest;
}

export interface FastcordPluginProperty {
    readonly manifest: FastcordPluginManifestInternal;
    readonly logger: Logger;
    createStorage<T extends object>(): ReturnType<typeof createStorage<T>>;
}

export type FastcordPluginObject = typeof window.fastcord & {
    plugin: FastcordPluginProperty;
};
