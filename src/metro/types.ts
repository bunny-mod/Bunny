import { Nullish } from "@lib/utils/types";

/** @see {@link https://github.com/facebook/metro/blob/c2d7539dfc10aacb2f99fcc2f268a3b53e867a90/packages/metro-runtime/src/polyfills/require.js} */
export namespace Metro {
    export type DependencyMap = Array<ModuleID> & {
        readonly paths?: Readonly<Record<ModuleID, string>> | undefined;
    };

    /** Only available on Discord's development environment, will never be defined on release builds */
    export type InverseDependencyMap = Record<ModuleID, ModuleID[]>;

    export type FactoryFn = (
        global: object,
        require: RequireFn,
        metroImportDefault: RequireFn,
        metroImportAll: RequireFn,
        moduleObject: {
            exports: any;
        },
        exports: any,
        dependencyMap: DependencyMap | Nullish,
    ) => void;

    /** Only available on Discord's development environment, will never be defined on release builds */
    export interface HotModuleReloadingData {
        _acceptCallback: (() => void) | Nullish;
        _disposeCallback: (() => void) | Nullish;
        _didAccept: boolean;
        accept: (callback?: (() => void) | undefined) => void;
        dispose: (callback?: (() => void) | undefined) => void;
    }

    export type ModuleID = number;

    export interface Module {
        id?: ModuleID | undefined;
        exports: any;
        hot?: HotModuleReloadingData | undefined;
    }

    export interface ModuleDefinition {
        /** Set to undefined once module is initialized */
        dependencyMap: DependencyMap | Nullish;
        /** Error.value thrown by the factory */
        error?: any;
        /** Set to undefined once module is initialized */
        factory: FactoryFn | undefined;
        /**
         * If factory thrown any error
         * */
        hasError: boolean;
        /**
         * Only available on Discord's development environment, will never be defined on release builds
         * */
        hot?: HotModuleReloadingData | undefined;
        /**
         * Cached `import *` imports in Metro, always an empty object as Fastcord prevents outdated import cache
         * */
        importedAll: any;
        /**
         * Cached `import module from "./module"` imports in Metro, always an empty object as Fastcord prevents outdated import cache
         * */
        importedDefault: any;
        /**
         * Whether factory has been successfully called
         * */
        isInitialized: boolean;
        /**
         * Only available on Discord's development environment, will never be defined on release builds
         * */
        path?: string | undefined;
        /**
         * Acts as CJS module in the bundler
         * */
        publicModule: Module;
        /**
         * Only available on Discord's development environment, will never be defined on release builds
         * */
        verboseName?: string | undefined;

        /**
         * This is set by us. Should be available for all Discord's tsx modules!
         */
        __filePath?: string;
    }

    export type ModuleList = Record<ModuleID, ModuleDefinition | Nullish>;

    export type RequireFn = (id: ModuleID) => any;

    export type DefineFn = (
        factory: FactoryFn,
        moduleId: ModuleID,
        dependencyMap?: DependencyMap | undefined,
        /** Only available on Discord's development environment, will never be defined on release builds */
        verboseName?: string | undefined,
        /** Only available on Discord's development environment, will never be defined on release builds */
        inverseDependencies?: InverseDependencyMap | undefined
    ) => void;

    export type ModuleDefiner = (moduleId: ModuleID) => void;

    export type ClearFn = () => ModuleList;

    export type RegisterSegmentFn = (
        segmentId: number,
        moduleDefiner: ModuleDefiner,
        moduleIds: Readonly<ModuleID[]> | Nullish
    ) => void;

    export interface Require extends RequireFn {
        importDefault: RequireFn;
        importAll: RequireFn;
        /** @throws {Error} A macro, will always throws an error at runtime */
        context: () => never;
        /** @throws {Error} A macro, will always throws an error at runtime */
        resolveWeak: () => never;
        unpackModuleId: (moduleId: ModuleID) => {
            localId: number;
            segmentId: number;
        };
        packModuleId: (value: {
            localId: number;
            segmentId: number;
        }) => ModuleID;
    }
}


export type ModuleExports = any;
export type FilterCheckDef<A extends unknown[]> = (
    args: A,
    module: any,
    modulesId: number,
    defaultCheck: boolean
) => boolean;

export interface FilterFn<A extends unknown[]> {
    (m: any, id: number, defaultCheck: boolean): boolean;
    filter: FilterCheckDef<A>;
    raw: boolean;
    uniq: string;
}

export interface FilterDefinition<A extends unknown[]> {
    (...args: A): FilterFn<A>;
    byRaw(...args: A): FilterFn<A>;
    uniqMaker(args: A): string;
}

export interface LazyModuleContext<A extends unknown[] = unknown[]> {
    filter: FilterFn<A>;
    indexed: boolean;
    moduleId?: number;
    getExports(cb: (exports: any) => void): () => void;
    subscribe(cb: (exports: any) => void): () => void;
    forceLoad(): any;
    get cache(): any;
}
