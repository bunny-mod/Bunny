import { formatString, Strings } from "@core/i18n";
import { showConfirmationAlert } from "@core/vendetta/alerts";
import { isPluginEnabled, refreshPlugin, startPlugin, stopPlugin, uninstallPlugin } from "@lib/addons/plugins";
import { findAssetId } from "@lib/api/assets";
import { purgeStorage } from "@lib/api/storage";
import { openAlert } from "@lib/ui/alerts";
import { AlertActionButton } from "@lib/ui/components/wrappers";
import { hideSheet } from "@lib/ui/sheets";
import { showToast } from "@lib/ui/toasts";
import { ActionSheet, AlertActions, AlertModal, Button, Stack, TableRowGroup, Text } from "@metro/common/components";
import { ScrollView, View } from "react-native";

import { PluginInfoActionSheetProps } from "./common";

export default function PluginInfoActionSheet({ plugin, navigation }: PluginInfoActionSheetProps) {
    plugin.usePluginState();

    return <ActionSheet>
        <ScrollView contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 24 }}>
                <View style={{ gap: 4 }}>
                    <Text variant="heading-xl/semibold">
                        {plugin.name}
                    </Text>
                    <Text variant="text-md/medium" color="text-muted">
                        {plugin.description}
                    </Text>
                </View>
                <View style={{ marginLeft: "auto" }}>
                    {plugin.getPluginSettingsComponent() && <Button
                        size="md"
                        text="Configure"
                        variant="secondary"
                        icon={findAssetId("WrenchIcon")}
                        onPress={() => {
                            hideSheet("PluginInfoActionSheet");
                            navigation.push("BUNNY_CUSTOM_PAGE", {
                                title: plugin.name,
                                render: plugin.getPluginSettingsComponent(),
                            });
                        }}
                    />}
                </View>
            </View>
            <TableRowGroup title="Actions">
                <Stack>
                    <ScrollView
                        horizontal={true}
                        contentContainerStyle={{ gap: 4 }}
                    >
                        <Button
                            size="md"
                            variant="secondary"
                            text={Strings.REFETCH}
                            icon={findAssetId("RetryIcon")}
                            onPress={async () => {
                                try {
                                    await refreshPlugin(plugin.id);
                                    showToast(Strings.PLUGIN_REFETCH_SUCCESSFUL, findAssetId("toast_image_saved"));
                                } catch {
                                    showToast(Strings.PLUGIN_REFETCH_FAILED, findAssetId("Small"));
                                }
                            }}
                        />
                        <Button
                            size="md"
                            variant="destructive"
                            text={Strings.CLEAR_DATA}
                            icon={findAssetId("CopyIcon")}
                            onPress={() => {
                                hideSheet("PluginInfoActionSheet");
                                openAlert("bunny-plugin-clear-data", <AlertModal
                                    title={Strings.HOLD_UP}
                                    content={formatString("ARE_YOU_SURE_TO_CLEAR_PLUGIN_DATA", { name: plugin.name })}
                                    actions={<AlertActions>
                                        <AlertActionButton
                                            text={Strings.CLEAR_DATA}
                                            variant="destructive"
                                            onPress={async () => {
                                                if (isPluginEnabled(plugin.id)) stopPlugin(plugin.id);

                                                let message: [any, any];
                                                try {
                                                    purgeStorage(`plugins/storage/${plugin.id}.json`);
                                                    message = ["CLEAR_DATA_SUCCESSFUL", "trash"];
                                                } catch {
                                                    message = ["CLEAR_DATA_FAILED", "Small"];
                                                }

                                                showToast(
                                                    formatString(message[0], { name: plugin.name }),
                                                    findAssetId(message[1])
                                                );

                                                if (isPluginEnabled(plugin.id)) await startPlugin(plugin.id);
                                            }}
                                        />
                                        <AlertActionButton
                                            text={Strings.CANCEL}
                                            variant="secondary"
                                            onPress={() => hideSheet("PluginInfoActionSheet")}
                                        />
                                    </AlertActions>}
                                />);

                            }}
                        />
                        <Button
                            size="md"
                            variant="destructive"
                            text={Strings.DELETE}
                            icon={findAssetId("TrashIcon")}
                            onPress={() => showConfirmationAlert({
                                title: Strings.HOLD_UP,
                                content: formatString("ARE_YOU_SURE_TO_DELETE_PLUGIN", { name: plugin.name }),
                                confirmText: Strings.DELETE,
                                cancelText: Strings.CANCEL,
                                confirmColor: "red",
                                onConfirm: async () => {
                                    try {
                                        await uninstallPlugin(plugin.id);
                                    } catch (e) {
                                        showToast(String(e), findAssetId("Small"));
                                    }
                                    hideSheet("PluginInfoActionSheet");
                                }
                            })}
                        />
                    </ScrollView>
                </Stack>
            </TableRowGroup>
        </ScrollView>
    </ActionSheet>;
}
