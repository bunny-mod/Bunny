import { CardWrapper } from "@core/ui/components/AddonCard";
import { UnifiedPluginModel } from "@core/ui/settings/pages/Plugins/models";
import { usePluginCardStyles } from "@core/ui/settings/pages/Plugins/usePluginCardStyles";
import { findAssetId } from "@lib/api/assets";
import { NavigationNative, tokens } from "@metro/common";
import { Card, IconButton, Stack, TableSwitch, Text } from "@metro/common/components";
import { showSheet } from "@ui/sheets";
import chroma from "chroma-js";
import { createContext, useContext, useMemo } from "react";
import { Image, View } from "react-native";

const CardContext = createContext<{ plugin: UnifiedPluginModel, result: Fuzzysort.KeysResult<UnifiedPluginModel>; }>(null!);
const useCardContext = () => useContext(CardContext);

function getHighlightColor(): import("react-native").ColorValue {
    return chroma(tokens.unsafe_rawColors.YELLOW_300).alpha(0.3).hex();
}

function Title() {
    const styles = usePluginCardStyles();
    const { plugin, result } = useCardContext();

    // could be empty if the plugin name is irrelevant!
    const highlightedNode = result[0].highlight((m, i) =>
        <Text key={i} style={{ backgroundColor: getHighlightColor() }}>
            {m}
        </Text>
    );

    const icon = plugin.icon && findAssetId(plugin.icon);

    const textNode = (
        <Text
            numberOfLines={1}
            variant="heading-lg/semibold"
        >
            {highlightedNode.length ? highlightedNode : plugin.name}
        </Text>
    );

    return <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {icon && <Image
            style={styles.smallIcon}
            source={icon}
        />}
        {textNode}
    </View>;
}

function Authors() {
    const { plugin, result } = useCardContext();
    const styles = usePluginCardStyles();

    if (!plugin.authors) return null;

    // could be empty if the author(s) are irrelevant with the search!
    const highlightedNode = result[2].highlight((m, i) =>
        <Text key={i} style={{ backgroundColor: getHighlightColor() }}>
            {m}
        </Text>
    );

    const badges = plugin.getBadges();
    const authorText = highlightedNode.length > 0 ? highlightedNode : plugin.authors.map(a => a.name).join(", ");

    return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", flexShrink: 1, gap: 4 }}>
            <Text variant="text-sm/semibold" color="text-muted">
                by {authorText}
            </Text>
            {badges.length > 0 && <View style={styles.badgesContainer}>
                {badges.map((b, i) => <Image
                    key={i}
                    source={b.source}
                    style={styles.badgeIcon}
                />)}
            </View>}
        </View>
    );
}

function Description() {
    const { plugin, result } = useCardContext();

    // could be empty if the description is irrelevant with the search!
    const highlightedNode = result[1].highlight((m, i) =>
        <Text key={i} style={{ backgroundColor: getHighlightColor() }}>{m}</Text>
    );

    return <Text variant="text-md/medium">
        {highlightedNode.length ? highlightedNode : plugin.description}
    </Text>;
}

const Actions = () => {
    const { plugin } = useCardContext();
    const navigation = NavigationNative.useNavigation();

    return <View style={{ flexDirection: "row", gap: 6 }}>
        <IconButton
            size="sm"
            variant="secondary"
            icon={findAssetId("WrenchIcon")}
            disabled={!plugin.getPluginSettingsComponent()}
            onPress={() => navigation.push("FASTCORD_CUSTOM_PAGE", {
                title: plugin.name,
                render: plugin.getPluginSettingsComponent(),
            })}
        />
        <IconButton
            size="sm"
            variant="secondary"
            icon={findAssetId("CircleInformationIcon-primary")}
            onPress={() => void showSheet(
                "PluginInfoActionSheet",
                plugin.resolveSheetComponent(),
                { plugin, navigation }
            )}
        />
    </View>;
};

export default function PluginCard({ result, item: plugin }: CardWrapper<UnifiedPluginModel>) {
    plugin.usePluginState();

    const [, forceUpdate] = React.useReducer(() => ({}), 0);
    const cardContextValue = useMemo(() => ({ plugin, result }), [plugin, result]);

    return (
        <CardContext.Provider value={cardContextValue}>
            <Card>
                <Stack spacing={16}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <View style={{ flexShrink: 1 }}>
                            <Title />
                            <Authors />
                        </View>
                        <View>
                            <Stack spacing={12} direction="horizontal">
                                <Actions />
                                <TableSwitch
                                    value={plugin.isEnabled()}
                                    onValueChange={(v: boolean) => {
                                        plugin.toggle(v);
                                        forceUpdate();
                                    }}
                                />
                            </Stack>
                        </View>
                    </View>
                    <Description />
                </Stack>
            </Card>
        </CardContext.Provider>
    );
}
