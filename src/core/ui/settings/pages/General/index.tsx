import { isSafeMode, toggleSafeMode } from "@core/debug/safeMode";
import { Strings } from "@core/i18n";
import { FastcordIcon } from "@core/ui/settings";
import About from "@core/ui/settings/pages/General/About";
import { useProxy } from "@core/vendetta/storage";
import { findAssetId } from "@lib/api/assets";
import { getDebugInfo } from "@lib/api/debug";
import { BundleUpdaterManager } from "@lib/api/native/modules";
import { settings } from "@lib/api/settings";
import { openAlert } from "@lib/ui/alerts";
import { DISCORD_SERVER, GITHUB } from "@lib/utils/constants";
import { NavigationNative, url } from "@metro/common";
import { AlertActionButton, AlertActions, AlertModal, Stack, TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { ScrollView } from "react-native";

export default function General() {
    useProxy(settings);

    const debugInfo = getDebugInfo();
    const navigation = NavigationNative.useNavigation();

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title={Strings.INFO}>
                    <TableRow
                        label={Strings.FASTCORD}
                        icon={<TableRow.Icon source={{ uri: FastcordIcon }} />}
                        trailing={<TableRow.TrailingText text={debugInfo.fastcord.version} />}
                    />
                    <TableRow
                        label={"Discord"}
                        icon={<TableRow.Icon source={findAssetId("Discord")!} />}
                        trailing={<TableRow.TrailingText text={`${debugInfo.discord.version} (${debugInfo.discord.build})`} />}
                    />
                    <TableRow
                        arrow
                        label={Strings.ABOUT}
                        icon={<TableRow.Icon source={findAssetId("CircleInformationIcon-primary")!} />}
                        onPress={() => navigation.push("FASTCORD_CUSTOM_PAGE", {
                            title: Strings.ABOUT,
                            render: () => <About />,
                        })}
                    />
                </TableRowGroup>
                <TableRowGroup title={Strings.LINKS}>
                    <TableRow
                        arrow={true}
                        label={Strings.DISCORD_SERVER}
                        icon={<TableRow.Icon source={findAssetId("Discord")!} />}
                        onPress={() => url.openDeeplink(DISCORD_SERVER)}
                    />
                    <TableRow
                        arrow={true}
                        label={Strings.GITHUB}
                        icon={<TableRow.Icon source={findAssetId("img_account_sync_github_white")!} />}
                        onPress={() => url.openURL(GITHUB)}
                    />
                </TableRowGroup>
                <TableRowGroup title={Strings.ACTIONS}>
                    <TableRow
                        label={Strings.RELOAD_DISCORD}
                        icon={<TableRow.Icon source={findAssetId("RetryIcon")!} />}
                        onPress={() => BundleUpdaterManager.reload()}
                    />
                    <TableSwitchRow
                        label={"Safe Mode"}
                        subLabel={"Load Fastcord without loading add-ons"}
                        icon={<TableRow.Icon source={findAssetId("ShieldIcon")!} />}
                        value={isSafeMode()}
                        onValueChange={(to: boolean) => {
                            toggleSafeMode({ to, reload: false });
                            openAlert(
                                "fastcord-reload-safe-mode",
                                <AlertModal
                                    title="Reload now?"
                                    content={!to ? "All add-ons will load normally." : "All add-ons will be temporarily disabled upon reload."}
                                    actions={<AlertActions>
                                        <AlertActionButton
                                            text="Reload Now"
                                            variant="destructive"
                                            onPress={() => BundleUpdaterManager.reload()}
                                        />
                                        <AlertActionButton text="Later" variant="secondary" />
                                    </AlertActions>}
                                />
                            );
                        }}
                    />
                    <TableSwitchRow
                        label={Strings.DEVELOPER_SETTINGS}
                        icon={<TableRow.Icon source={findAssetId("WrenchIcon")!} />}
                        value={settings.developerSettings}
                        onValueChange={(v: boolean) => {
                            settings.developerSettings = v;
                        }}
                    />
                </TableRowGroup>
                <TableRowGroup title={Strings.MISCELLANEOUS}>
                    <TableSwitchRow
                        label={Strings.SETTINGS_ACTIVATE_DISCORD_EXPERIMENTS}
                        subLabel={Strings.SETTINGS_ACTIVATE_DISCORD_EXPERIMENTS_DESC}
                        icon={<TableRow.Icon source={findAssetId("WrenchIcon")!} />}
                        value={settings.enableDiscordDeveloperSettings}
                        onValueChange={(v: boolean) => {
                            settings.enableDiscordDeveloperSettings = v;
                        }}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
