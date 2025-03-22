import { createFilterDefinition } from "./factories";
import { metroModules } from "./internals/modules";

export const byProps = createFilterDefinition<string[]>(
    (props, m) => props.length === 0 ? m[props[0]] : props.every(p => m[p]),
    props => `fastcord.metro.byProps(${props.join(",")})`
);

export const byName = createFilterDefinition<[string]>(
    ([name], m) => m.name === name,
    name => `fastcord.metro.byName(${name})`
);

export const byDisplayName = createFilterDefinition<[string]>(
    ([displayName], m) => m.displayName === displayName,
    name => `fastcord.metro.byDisplayName(${name})`
);

export const byTypeName = createFilterDefinition<[string]>(
    ([typeName], m) => m.type?.name === typeName,
    name => `fastcord.metro.byTypeName(${name})`
);

export const byStoreName = createFilterDefinition<[string]>(
    ([name], m) => m.getName?.length === 0 && m.getName() === name,
    name => `fastcord.metro.byStoreName(${name})`
);

export const byFilePath = createFilterDefinition<[string, boolean]>(
    // module return depends on defaultCheck. if true, it'll return module.default, otherwise the whole module
    // unlike filters like byName, defaultCheck doesn't affect the return since we don't rely on exports, but only its ID
    // one could say that this is technically a hack, since defaultCheck is meant for filtering exports
    ([path, exportDefault], _, id, defaultCheck) => (exportDefault === defaultCheck) && metroModules[id]?.__filePath === path,
    ([path, exportDefault]) => `fastcord.metro.byFilePath(${path},${exportDefault})`
);

export const byMutableProp = createFilterDefinition<[string]>(
    ([prop], m) => m?.[prop] && !Object.getOwnPropertyDescriptor(m, prop)?.get,
    prop => `fastcord.metro.byMutableProp(${prop})`
);
