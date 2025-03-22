import { Strings } from "@core/i18n";
import { FastcordIcon } from "@core/ui/settings";
import Version from "@core/ui/settings/pages/General/Version";
import { useProxy } from "@core/vendetta/storage";
import { getDebugInfo } from "@lib/api/debug";
import { settings } from "@lib/api/settings";
import { Stack, TableRowGroup } from "@metro/common/components";
import { Platform, ScrollView } from "react-native";

export default function About() {
    const debugInfo = getDebugInfo();
    useProxy(settings);

    const versions = [
        {
            label: Strings.FASTCORD,
            version: debugInfo.fastcord.version,
            icon: { uri: FastcordIcon },
        },
        {
            label: "Discord",
            version: `${debugInfo.discord.version} (${debugInfo.discord.build})`,
            icon: "Discord",
        },
        {
            label: "React",
            version: debugInfo.react.version,
            icon: "ScienceIcon",
        },
        {
            label: "React Native",
            version: debugInfo.react.nativeVersion,
            icon: "MobilePhoneIcon",
        },
        {
            label: Strings.BYTECODE,
            version: debugInfo.hermes.bytecodeVersion,
            icon: "TopicsIcon",
        },
    ];

    const platformInfo = [
        {
            label: Strings.LOADER,
            version: `${debugInfo.fastcord.loader.name} (${debugInfo.fastcord.loader.version})`,
            icon: "DownloadIcon",
        },
        {
            label: Strings.OPERATING_SYSTEM,
            version: `${debugInfo.os.name} ${debugInfo.os.version}`,
            icon: "ScreenIcon"
        },
        ...(debugInfo.os.sdk ? [{
            label: "SDK",
            version: debugInfo.os.sdk,
            icon: "StaffBadgeIcon"
        }] : []),
        {
            label: Strings.MANUFACTURER,
            version: debugInfo.device.manufacturer,
            icon: "WrenchIcon"
        },
        {
            label: Strings.BRAND,
            version: debugInfo.device.brand,
            icon: "SparklesIcon"
        },
        {
            label: Strings.MODEL,
            version: debugInfo.device.model,
            icon: "MobilePhoneIcon"
        },
        {
            label: Platform.select({ android: Strings.CODENAME, ios: Strings.MACHINE_ID })!,
            version: debugInfo.device.codename,
            icon: "TagIcon"
        }
    ];

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title={Strings.VERSIONS}>
                    {versions.map(v => <Version label={v.label} version={v.version} icon={v.icon} />)}
                </TableRowGroup>
                <TableRowGroup title={Strings.PLATFORM}>
                    {platformInfo.map(p => <Version label={p.label} version={p.version} icon={p.icon} />)}
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
