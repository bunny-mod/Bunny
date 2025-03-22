import { Author, FastcordManifest } from "@lib/addons/types";

interface SemanticReference {
    type: "color" | "raw";
    value: string;
    opacity?: number;
}

interface BackgroundDefinition {
    url: string;
    blur?: number;
    opacity?: number;
}

export interface FastcordColorManifest extends FastcordManifest {
    type: "color";
    spec: 3;
    main: {
        type: "dark" | "light";
        semantic?: Record<string, string | SemanticReference>;
        raw?: Record<string, string>;
        background?: BackgroundDefinition;
    }
}

export interface VendettaThemeManifest {
    spec: 2;
    name: string;
    description?: string;
    authors?: Author[];
    semanticColors?: Record<string, (string | false)[]>;
    rawColors?: Record<string, string>;
    background?: {
        url: string;
        blur?: number;
        alpha?: number;
    };
}

/** @internal */
export interface InternalColorDefinition {
    spec: 2 | 3;
    reference: "darker" | "light";
    semantic: Record<string, {
        value: string;
        opacity: number;
    }>;
    raw: Record<string, string>;
    background?: BackgroundDefinition;
}

export type ColorManifest = FastcordColorManifest | VendettaThemeManifest;
