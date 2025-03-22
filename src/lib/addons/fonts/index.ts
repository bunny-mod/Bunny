import { awaitStorage, createMMKVBackend, createStorage, wrapSync } from "@core/vendetta/storage";
import { clearFolder, downloadFile, fileExists, removeFile, writeFile } from "@lib/api/native/fs";
import { safeFetch } from "@lib/utils";

type FontMap = Record<string, string>;

export interface FontDefinition {
    spec: 1;
    name: string;
    description?: string;
    main: FontMap;
    __source?: string;
    __edited?: boolean;
}

type FontStorage = Record<string, FontDefinition> & { __selected?: string; };
export const fonts = wrapSync(createStorage<FontStorage>(createMMKVBackend("FASTCORD_FONTS")));

async function writeFont(font: FontDefinition | null) {
    if (!font && font !== null) throw new Error("Arg font must be a valid object or null");
    if (font) {
        await writeFile("fonts.json", JSON.stringify(font));
    } else {
        await removeFile("fonts.json");
    }
}

export function validateFont(font: FontDefinition) {
    if (!font || typeof font !== "object") throw new Error("URL returned a null/non-object JSON");
    if (typeof font.spec !== "number") throw new Error("Invalid font 'spec' number");
    if (font.spec !== 1) throw new Error("Only fonts which follows spec:1 are supported");

    const requiredFields = ["name", "main"] as const;

    if (requiredFields.some(f => !font[f])) throw new Error(`Font is missing one of the fields: ${requiredFields}`);
    if (font.name.startsWith("__")) throw new Error("Font names cannot start with __");
    if (font.name in fonts) throw new Error(`There is already a font named '${font.name}' installed`);
}

export async function saveFont(data: string | FontDefinition, selected = false) {
    let fontDefJson: FontDefinition;

    if (typeof data === "object" && data.__source) data = data.__source;

    if (typeof data === "string") {
        try {
            fontDefJson = await (await safeFetch(data)).json();
            fontDefJson.__source = data;
        } catch (e) {
            throw new Error(`Failed to fetch fonts at ${data}`, { cause: e });
        }
    } else {
        fontDefJson = data;
    }

    validateFont(fontDefJson);

    try {
        await Promise.all(Object.entries(fontDefJson.main).map(async ([font, url]) => {
            let ext = url.split(".").pop();
            if (ext !== "ttf" && ext !== "otf") ext = "ttf";
            const path = `downloads/fonts/${fontDefJson.name}/${font}.${ext}`;
            if (!await fileExists(path)) await downloadFile(url, path);
        }));
    } catch (e) {
        throw new Error("Failed to download font assets", { cause: e });
    }

    fonts[fontDefJson.name] = fontDefJson;

    if (selected) writeFont(fonts[fontDefJson.name]);
    return fontDefJson;
}

export async function installFont(url: string, selected = false) {
    if (
        typeof url !== "string"
        || Object.values(fonts).some(f => typeof f === "object" && f.__source === url)
    ) {
        throw new Error("Invalid source or font was already installed");
    }

    const font = await saveFont(url);
    if (selected) await selectFont(font.name);
}

export async function selectFont(name: string | null) {
    if (name && !(name in fonts)) throw new Error("Selected font does not exist!");

    if (name) {
        fonts.__selected = name;
    } else {
        delete fonts.__selected;
    }
    await writeFont(name == null ? null : fonts[name]);
}

export async function removeFont(name: string) {
    const selected = fonts.__selected === name;
    if (selected) await selectFont(null);
    delete fonts[name];
    try {
        await clearFolder(`downloads/fonts/${name}`);
    } catch {
        // ignore
    }
}

export async function updateFonts() {
    await awaitStorage(fonts);
    await Promise.allSettled(
        Object.keys(fonts).map(
            name => saveFont(fonts[name], fonts.__selected === name)
        )
    );
}
