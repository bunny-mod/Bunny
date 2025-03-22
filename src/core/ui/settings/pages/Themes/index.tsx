import { formatString, Strings } from "@core/i18n";
import AddonPage from "@core/ui/components/AddonPage";
import ThemeCard from "@core/ui/settings/pages/Themes/ThemeCard";
import { useProxy } from "@core/vendetta/storage";
import { getCurrentTheme, installTheme, themes, VdThemeInfo } from "@lib/addons/themes";
import { colorsPref } from "@lib/addons/themes/colors/preferences";
import { updateFastcordColor } from "@lib/addons/themes/colors/updater";
import { Author } from "@lib/addons/types";
import { findAssetId } from "@lib/api/assets";
import { settings } from "@lib/api/settings";
import { useObservable } from "@lib/api/storage";
import { ActionSheet, BottomSheetTitleHeader, Button, TableRadioGroup, TableRadioRow, TableRowIcon } from "@metro/common/components";
import { View } from "react-native";

export default function Themes() {
    useProxy(settings);
    useProxy(themes);

    return (
        <AddonPage<VdThemeInfo>
            title={Strings.THEMES}
            searchKeywords={[
                "data.name",
                "data.description",
                p => p.data.authors?.map((a: Author) => a.name).join(", ") ?? ""
            ]}
            sortOptions={{
                "Name (A-Z)": (a, b) => a.data.name.localeCompare(b.data.name),
                "Name (Z-A)": (a, b) => b.data.name.localeCompare(a.data.name)
            }}
            installAction={{
                label: "Install a theme",
                fetchFn: installTheme
            }}
            items={Object.values(themes)}
            safeModeHint={{
                message: formatString("SAFE_MODE_NOTICE_THEMES", { enabled: Boolean(settings.safeMode?.currentThemeId) }),
                footer: settings.safeMode?.currentThemeId && <Button
                    size="small"
                    text={Strings.DISABLE_THEME}
                    onPress={() => delete settings.safeMode?.currentThemeId}
                    style={{ marginTop: 8 }}
                />
            }}
            CardComponent={ThemeCard}
            OptionsActionSheetComponent={() => {
                useObservable([colorsPref]);

                return <ActionSheet>
                    <BottomSheetTitleHeader title="Options" />
                    <View style={{ paddingVertical: 20, gap: 12 }}>
                        <TableRadioGroup
                            title="Override Theme Type"
                            value={colorsPref.type ?? "auto"}
                            hasIcons={true}
                            onChange={type => {
                                colorsPref.type = type !== "auto" ? type as "dark" | "light" : undefined;
                                getCurrentTheme()?.data && updateFastcordColor(getCurrentTheme()!.data!, { update: true });
                            }}
                        >
                            <TableRadioRow icon={<TableRowIcon source={findAssetId("RobotIcon")} />} label="Auto" value="auto" />
                            <TableRadioRow icon={<TableRowIcon source={findAssetId("ThemeDarkIcon")} />} label="Dark" value="dark" />
                            <TableRadioRow icon={<TableRowIcon source={findAssetId("ThemeLightIcon")} />} label="Light" value="light" />
                        </TableRadioGroup>
                        <TableRadioGroup
                            title="Chat Background"
                            value={colorsPref.customBackground ?? "shown"}
                            hasIcons={true}
                            onChange={type => {
                                colorsPref.customBackground = type !== "shown" ? type as "hidden" : null;
                            }}
                        >
                            <TableRadioRow icon={<TableRowIcon source={findAssetId("ImageIcon")} />} label="Show" value={"shown"} />
                            <TableRadioRow icon={<TableRowIcon source={findAssetId("DenyIcon")} />} label="Hide" value={"hidden"} />
                        </TableRadioGroup>
                    </View>
                </ActionSheet>;
            }}
        />
    );
}
