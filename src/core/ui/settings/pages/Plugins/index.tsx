import { Strings } from "@core/i18n";
import AddonPage from "@core/ui/components/AddonPage";
import PluginCard from "@core/ui/settings/pages/Plugins/components/PluginCard";
import { VdPluginManager } from "@core/vendetta/plugins";
import { useProxy } from "@core/vendetta/storage";
import { isCorePlugin, isPluginInstalled, pluginSettings, registeredPlugins } from "@lib/addons/plugins";
import { Author } from "@lib/addons/types";
import { findAssetId } from "@lib/api/assets";
import { settings } from "@lib/api/settings";
import { useObservable } from "@lib/api/storage";
import { showToast } from "@lib/ui/toasts";
import { FASTCORD_PROXY_PREFIX, VD_PROXY_PREFIX } from "@lib/utils/constants";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByProps } from "@metro";
import { NavigationNative } from "@metro/common";
import { Button, Card, FlashList, IconButton, Text } from "@metro/common/components";
import { ComponentProps } from "react";
import { View } from "react-native";

import { UnifiedPluginModel } from "./models";
import unifyFastcordPlugin from "./models/fastcord";
import unifyVdPlugin from "./models/vendetta";

const { openAlert } = lazyDestructure(() => findByProps("openAlert", "dismissAlert"));
const { AlertModal, AlertActions, AlertActionButton } = lazyDestructure(() => findByProps("AlertModal", "AlertActions"));

interface PluginPageProps extends Partial<ComponentProps<typeof AddonPage<UnifiedPluginModel>>> {
    useItems: () => unknown[];
}

function PluginPage(props: PluginPageProps) {
    const items = props.useItems();

    return <AddonPage<UnifiedPluginModel>
        CardComponent={PluginCard}
        title={Strings.PLUGINS}
        searchKeywords={[
            "name",
            "description",
            p => p.authors?.map(
                (a: Author | string) => typeof a === "string" ? a : a.name
            ).join() || ""
        ]}
        sortOptions={{
            "Name (A-Z)": (a, b) => a.name.localeCompare(b.name),
            "Name (Z-A)": (a, b) => b.name.localeCompare(a.name)
        }}
        safeModeHint={{ message: Strings.SAFE_MODE_NOTICE_PLUGINS }}
        items={items}
        {...props}
    />;
}

export default function Plugins() {
    useProxy(settings);
    const navigation = NavigationNative.useNavigation();

    return <PluginPage
        useItems={() => {
            useProxy(VdPluginManager.plugins);
            useObservable([pluginSettings]);

            const vdPlugins = Object.values(VdPluginManager.plugins).map(unifyVdPlugin);
            const bnPlugins = [...registeredPlugins.values()].filter(p => isPluginInstalled(p.id) && !isCorePlugin(p.id)).map(unifyFastcordPlugin);

            return [...vdPlugins, ...bnPlugins];
        }}
        ListHeaderComponent={() => {
            const unproxiedPlugins = Object.values(VdPluginManager.plugins).filter(p => !p.id.startsWith(VD_PROXY_PREFIX) && !p.id.startsWith(FASTCORD_PROXY_PREFIX));
            if (!unproxiedPlugins.length) return null;

            return <View style={{ marginVertical: 12, marginHorizontal: 10 }}>
                <Card border="strong">
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", flexDirection: "row" }}>
                        <View style={{ gap: 6, flexShrink: 1 }}>
                            <Text variant="heading-md/bold">Unproxied Plugins Found</Text>
                            <Text variant="text-sm/medium" color="text-muted">
                                Plugins installed from unproxied sources may run unverified code in this app without your awareness.
                            </Text>
                        </View>
                        <View style={{ marginLeft: "auto" }}>
                            <IconButton
                                size="sm"
                                variant="secondary"
                                icon={findAssetId("CircleInformationIcon-primary")}
                                style={{ marginLeft: 8 }}
                                onPress={() => {
                                    navigation.push("FASTCORD_CUSTOM_PAGE", {
                                        title: "Unproxied Plugins",
                                        render: () => {
                                            return <FlashList
                                                data={unproxiedPlugins}
                                                contentContainerStyle={{ padding: 8 }}
                                                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                                                renderItem={({ item: p }: any) => <Card>
                                                    <Text variant="heading-md/semibold">{p.id}</Text>
                                                </Card>}
                                            />;
                                        }
                                    });
                                }}
                            />
                        </View>
                    </View>
                </Card>
            </View>;
        }}
        ListFooterComponent={() => __DEV__ && (
            <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 16, gap: 12 }}><Button
                size="lg"
                text="Browse Plugins"
                icon={findAssetId("CompassIcon")}
                onPress={() => {
                    navigation.push("FASTCORD_CUSTOM_PAGE", {
                        title: "Plugin Browser",
                        render: React.lazy(() => import("../PluginBrowser")),
                    });
                }}
            />
            </View>
        )}
        installAction={{
            label: "Install a plugin",
            fetchFn: async (url: string) => {
                if (!url.startsWith(VD_PROXY_PREFIX) && !url.startsWith(FASTCORD_PROXY_PREFIX) && !settings.developerSettings) {
                    openAlert("fastcord-plugin-unproxied-confirmation", <AlertModal
                        title="Hold On!"
                        content="You're trying to install a plugin from an unproxied external source. This means you're trusting the creator to run their code in this app without your knowledge. Are you sure you want to continue?"
                        extraContent={<Card><Text variant="text-md/bold">{url}</Text></Card>}
                        actions={<AlertActions>
                            <AlertActionButton text="Continue" variant="primary" onPress={() => {
                                VdPluginManager.installPlugin(url)
                                    .then(() => showToast(Strings.TOASTS_INSTALLED_PLUGIN, findAssetId("Check")))
                                    .catch(e => openAlert("fastcord-plugin-install-failed", <AlertModal
                                        title="Install Failed"
                                        content={`Unable to install plugin from '${url}':`}
                                        extraContent={<Card><Text variant="text-md/normal">{e instanceof Error ? e.message : String(e)}</Text></Card>}
                                        actions={<AlertActionButton text="Okay" variant="primary" />}
                                    />));
                            }} />
                            <AlertActionButton text="Cancel" variant="secondary" />
                        </AlertActions>}
                    />);
                } else {
                    return await VdPluginManager.installPlugin(url);
                }
            }
        }}
    />;
}
