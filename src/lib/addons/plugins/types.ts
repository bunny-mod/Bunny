import { BunnyManifest } from "@lib/addons/types";
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

export interface BunnyPluginManifest extends BunnyManifest {
    readonly type: "plugin";
    readonly spec: 3;
    readonly main: string;
}

export interface BunnyPluginManifestInternal extends BunnyPluginManifest {
    readonly parentRepository: string;
    readonly jsPath?: string;
}

export interface PluginInstance {
    start?(): void;
    stop?(): void;
    SettingsComponent?(): JSX.Element;
}

export interface PluginInstanceInternal extends PluginInstance {
    readonly manifest: BunnyPluginManifest;
}

export interface BunnyPluginProperty {
    readonly manifest: BunnyPluginManifestInternal;
    readonly logger: Logger;
    createStorage<T extends object>(): ReturnType<typeof createStorage<T>>;
}

export type BunnyPluginObject = typeof window.fastcord & {
    plugin: BunnyPluginProperty;
};
