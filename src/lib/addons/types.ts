export type Author = { name: string, id?: `${bigint}`; };

export interface FastcordManifest {
    readonly id: string;
    readonly spec: number;
    readonly version: string;
    readonly type: string;
    readonly display: {
        readonly name: string;
        readonly description?: string;
        readonly authors?: Author[];
    };
    readonly main: unknown;
    readonly extras?: {
        readonly [key: string]: any;
    };
}
