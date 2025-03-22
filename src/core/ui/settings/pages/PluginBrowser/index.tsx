import { deleteRepository, installPlugin, isCorePlugin, isPluginInstalled, pluginRepositories, registeredPlugins, uninstallPlugin, updateAllRepository, updateRepository } from "@lib/addons/plugins";
import { FastcordPluginManifestInternal } from "@lib/addons/plugins/types";
import { findAssetId } from "@lib/api/assets";
import { dismissAlert, openAlert } from "@lib/ui/alerts";
import { AlertActionButton } from "@lib/ui/components/wrappers";
import { hideSheet, showSheet } from "@lib/ui/sheets";
import { showToast } from "@lib/ui/toasts";
import { OFFICIAL_PLUGINS_REPO_URL } from "@lib/utils/constants";
import isValidHttpUrl from "@lib/utils/isValidHttpUrl";
import { clipboard, NavigationNative } from "@metro/common";
import { ActionSheet, AlertActions, AlertModal, Button, Card, FlashList, IconButton, Stack, TableRow, TableRowGroup, Text, TextInput } from "@metro/common/components";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { View } from "react-native";

const queryClient = new QueryClient();

async function getManifests() {
    await updateAllRepository();
    const plugins = [...registeredPlugins.values()];
    return plugins.filter(p => !isCorePlugin(p.id));
}

function InstallButton(props: { id: string; }) {
    const [installed, setInstalled] = useState(isPluginInstalled(props.id));
    const installationState = useMutation<void, Error, { install: boolean; }>({
        mutationFn: async ({ install }) => {
            await (install ? installPlugin : uninstallPlugin)(props.id, true);
        },
        onSettled() {
            setInstalled(isPluginInstalled(props.id));
        },
        onError(error) {
            showToast(error instanceof Error ? error.message : String(error));
        }
    });

    return <Button
        size="sm"
        loading={installationState.isPending}
        text={!installed ? "Install" : "Uninstall"}
        onPress={() => installationState.mutate({ install: !installed })}
        variant={!installed ? "primary" : "destructive"}
        icon={findAssetId(!installed ? "DownloadIcon" : "TrashIcon")}
    />;
}

function TrailingButtons(props: { id: string; }) {
    return <Stack spacing={8} direction="horizontal">
        <IconButton
            size="sm"
            onPress={() => {
                showSheet("plugin-info", () => {
                    return <ActionSheet>
                        <TableRowGroup title="Plugin Info">
                            <TableRow label="ID" subLabel={props.id} />
                        </TableRowGroup>
                    </ActionSheet>;
                });
            }}
            variant="secondary"
            icon={findAssetId("CircleInformationIcon")}
        />
        <InstallButton id={props.id} />
    </Stack>;
}

function PluginCard(props: { manifest: FastcordPluginManifestInternal; }) {
    const { display, version } = props.manifest;

    return (
        <Card>
            <Stack spacing={16}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexShrink: 1 }}>
                        <Text numberOfLines={1} variant="heading-lg/semibold">
                            {display.name}
                        </Text>
                        <Text variant="text-md/semibold" color="text-muted">
                            by {display.authors?.map(a => a.name).join(", ") || "Unknown"} ({version})
                        </Text>
                    </View>
                    <View>
                        <TrailingButtons id={props.manifest.id} />
                    </View>
                </View>
                <Text variant="text-md/medium">
                    {display.description}
                </Text>
            </Stack>
        </Card>
    );
}

function BrowserPage() {
    const navigation = NavigationNative.useNavigation();
    useEffect(() => {
        navigation.setOptions({
            title: "Plugin Browser",
            headerRight: () => <IconButton
                size="sm"
                variant="secondary"
                icon={findAssetId("PlusSmallIcon")}
                onPress={() => {
                    showSheet("plugin-browser-options", PluginBrowserOptions);
                }}
            />
        });
    }, [navigation]);

    const { data, error, isPending, refetch } = useQuery({
        queryKey: ["plugins-repo-fetch"],
        queryFn: () => getManifests()
    });

    if (error) {
        return <View style={{
            flex: 1,
            paddingHorizontal: 8,
            justifyContent: "center",
            alignItems: "center",
        }}>
            <Card style={{ gap: 8 }}>
                <Text style={{ textAlign: "center" }} variant="heading-lg/bold">
                    An error occured while fetching the repository!
                </Text>
                <Text style={{ textAlign: "center" }} variant="text-sm/medium" color="text-muted">
                    {error instanceof Error ? error.message : String(error)}
                </Text>
                <Button
                    size="lg"
                    text="Refetch"
                    onPress={refetch}
                    icon={findAssetId("RetryIcon")}
                />
            </Card>
        </View>;
    }

    return <FlashList
        data={data}
        refreshing={isPending}
        onRefresh={refetch}
        estimatedItemSize={136}
        contentContainerStyle={{ paddingBottom: 90, paddingHorizontal: 5 }}
        renderItem={({ item: manifest }: any) => (
            <View style={{ paddingVertical: 6, paddingHorizontal: 8 }}>
                <PluginCard manifest={manifest} />
            </View>
        )}
    />;
}

function AddRepositoryAlert() {
    const [value, setValue] = useState("");

    return <AlertModal
        title="Add Repository"
        content="Enter the URL of the repository you want to add."
        extraContent={<TextInput
            value={value}
            onChange={setValue}
            placeholder="https://example.com/repo.json" />}
        actions={<AlertActions>
            <AlertActionButton
                text="Add"
                variant="primary"
                disabled={!isValidHttpUrl(value)}
                onPress={async () => {
                    try {
                        await updateRepository(value);
                        showToast("Added repository!", findAssetId("Check"));
                    } catch (e) {
                        showToast("Failed to add repository!", findAssetId("Small"));
                    } finally {
                        dismissAlert("fastcord-add-plugin-repository");
                        showSheet("plugin-browser-options", PluginBrowserOptions);
                    }
                }} />
        </AlertActions>} />;
}

function PluginBrowserOptions() {
    return <ActionSheet>
        <TableRowGroup title="Repositories">
            {Object.keys(pluginRepositories).map(url => {
                return <RepositoryRow key={url} url={url} />;
            })}
            <TableRow
                label="Add Repository..."
                icon={<TableRow.Icon source={findAssetId("PlusMediumIcon")} />}
                onPress={() => {
                    openAlert("fastcord-add-plugin-repository", <AddRepositoryAlert />);
                    hideSheet("plugin-browser-options");
                }} />
        </TableRowGroup>
    </ActionSheet>;
}

function RepositoryRow(props: { url: string; }) {
    const repo = pluginRepositories[props.url];
    const isOfficial = props.url === OFFICIAL_PLUGINS_REPO_URL;

    return (
        <TableRow
            label={isOfficial ? "Fastcord's Repository" : (repo.$meta?.name ?? "Unknown")}
            subLabel={props.url}
            trailing={(
                <Stack direction="horizontal">
                    <IconButton
                        size="sm"
                        variant="secondary"
                        icon={findAssetId("LinkIcon")}
                        onPress={() => {
                            clipboard.setString(props.url);
                            showToast.showCopyToClipboard();
                        }}
                    />
                    <IconButton
                        size="sm"
                        variant="destructive"
                        disabled={isOfficial}
                        icon={findAssetId("TrashIcon")}
                        onPress={() => {
                            openAlert("fastcord-remove-repository", <AlertModal
                                title="Remove Repository"
                                content="Are you sure you want to remove this repository?"
                                extraContent={<Card>
                                    <Text variant="text-md/normal">{props.url}</Text>
                                </Card>}
                                actions={<AlertActions>
                                    <AlertActionButton
                                        text="Remove"
                                        variant="destructive"
                                        onPress={async () => {
                                            await deleteRepository(props.url);
                                            showToast("Removed repository!", findAssetId("Trash"));
                                            dismissAlert("fastcord-remove-repository");
                                        }}
                                    />
                                </AlertActions>}
                            />);
                        }}
                    />
                </Stack>
            )} />
    );
}

export default function PluginBrowser() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserPage />
        </QueryClientProvider>
    );
}
