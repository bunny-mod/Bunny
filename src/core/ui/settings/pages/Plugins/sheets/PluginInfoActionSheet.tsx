import { startPlugin } from "@lib/addons/plugins";
import { findAssetId } from "@lib/api/assets";
import { hideSheet } from "@lib/ui/sheets";
import { ActionSheet, Card, ContextMenu, IconButton, Text } from "@metro/common/components";
import { ComponentProps } from "react";
import { ScrollView, View } from "react-native";

import { PluginInfoActionSheetProps } from "./common";
import TitleComponent from "./TitleComponent";

function PluginInfoIconButton(props: ComponentProps<typeof IconButton>) {
    const { onPress } = props;
    props.onPress &&= () => {
        hideSheet("PluginInfoActionSheet");
        onPress?.();
    };

    return <IconButton {...props} />;
}

export default function PluginInfoActionSheet({ plugin, navigation }: PluginInfoActionSheetProps) {
    plugin.usePluginState();

    return <ActionSheet>
        <ScrollView contentContainerStyle={{ gap: 12, marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 24, justifyContent: "space-between", width: "100%" }}>
                <TitleComponent plugin={plugin} />
                <ContextMenu
                    items={[
                        {
                            label: "Details",
                            iconSource: findAssetId("CircleInformationIcon-primary"),
                            action: () => {
                            }
                        },
                        // {
                        //     label: true ? "Disable Updates" : "Enable Updates",
                        //     iconSource: true ? findAssetId("ClockXIcon") : findAssetId("ClockIcon"),
                        //     action: () => {

                        //     }
                        // },
                        {
                            label: "Clear Data",
                            iconSource: findAssetId("FileIcon"),
                            variant: "destructive",
                            action: () => {
                            }
                        },
                        {
                            label: "Uninstall",
                            iconSource: findAssetId("TrashIcon"),
                            variant: "destructive",
                            action: () => {
                            }
                        }
                    ]}
                >
                    {props => <IconButton
                        {...props}
                        icon={findAssetId("MoreHorizontalIcon")}
                        variant="secondary"
                        size="sm"
                    />}
                </ContextMenu>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-around", alignContent: "center" }}>
                <PluginInfoIconButton
                    label="Configure"
                    variant="secondary"
                    disabled={!plugin.getPluginSettingsComponent()}
                    icon={findAssetId("WrenchIcon")}
                    onPress={() => {
                        navigation.push("FASTCORD_CUSTOM_PAGE", {
                            title: plugin.name,
                            render: plugin.getPluginSettingsComponent(),
                        });
                    }}
                />
                <PluginInfoIconButton
                    label="Refetch"
                    variant="secondary"
                    icon={findAssetId("RetryIcon")}
                    onPress={() => {
                        startPlugin(plugin.id);
                    }}
                />
                <PluginInfoIconButton
                    label="Copy URL"
                    variant="secondary"
                    icon={findAssetId("LinkIcon")}
                    onPress={() => {
                    }}
                />
            </View>
            <Card>
                <Text variant="text-md/semibold" color="text-primary" style={{ marginBottom: 4 }}>
                    Description
                </Text>
                <Text variant="text-md/medium">
                    {plugin.description}
                </Text>
            </Card>
        </ScrollView>
    </ActionSheet>;
}
