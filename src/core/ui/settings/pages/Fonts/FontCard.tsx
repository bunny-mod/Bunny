import { Strings } from "@core/i18n";
import { CardWrapper } from "@core/ui/components/AddonCard";
import { showConfirmationAlert } from "@core/vendetta/alerts";
import { useProxy } from "@core/vendetta/storage";
import { FontDefinition, fonts, selectFont } from "@lib/addons/fonts";
import { findAssetId } from "@lib/api/assets";
import { BundleUpdaterManager } from "@lib/api/native/modules";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByProps } from "@metro";
import { NavigationNative, tokens } from "@metro/common";
import { Button, Card, IconButton, Stack, Text } from "@metro/common/components";
import * as Skia from "@shopify/react-native-skia";
import { TextStyleSheet } from "@ui/styles";
import { useMemo } from "react";
import { View } from "react-native";

import FontEditor from "./FontEditor";

const { useToken } = lazyDestructure(() => findByProps("useToken"));

function FontPreview({ font }: { font: FontDefinition; }) {
    const TEXT_NORMAL = useToken(tokens.colors.TEXT_NORMAL);
    const { fontFamily: fontFamilyList, fontSize } = TextStyleSheet["text-md/medium"];
    const fontFamily = fontFamilyList!.split(/,/g)[0];

    const typeface = Skia.useFont(font.main[fontFamily])?.getTypeface();

    const paragraph = useMemo(() => {
        if (!typeface) return null;

        const fMgr = SkiaApi.TypefaceFontProvider.Make();
        fMgr.registerFont(typeface, fontFamily);


        return SkiaApi.ParagraphBuilder.Make({}, fMgr)
            .pushStyle({
                color: SkiaApi.Color(TEXT_NORMAL),
                fontFamilies: [fontFamily],
                fontSize,
            })
            .addText("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.")
            .pop()
            .build();
    }, [typeface]);

    return (
        // This does not work, actually :woeis:
        <View style={{ height: 64 }}>
            {typeface
                ? <Skia.Canvas style={{ height: 64 }}>
                    <Skia.Paragraph paragraph={paragraph} x={0} y={0} width={300} />
                </Skia.Canvas>
                : <View style={{ justifyContent: "center", alignItems: "center" }}>
                    <Text color="text-muted" variant="heading-lg/semibold">
                        Loading...
                    </Text>
                </View>}
        </View>
    );
}

export default function FontCard({ item: font }: CardWrapper<FontDefinition>) {
    useProxy(fonts);

    const navigation = NavigationNative.useNavigation();
    const selected = fonts.__selected === font.name;

    return (
        <Card>
            <Stack spacing={16}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View>
                        <Text variant="heading-lg/semibold">
                            {font.name}
                        </Text>
                        {/* TODO: Text wrapping doesn't work well */}
                        {/* <Text color="text-muted" variant="text-sm/semibold">
                            {font.description}
                        </Text> */}
                    </View>
                    <View style={{ marginLeft: "auto" }}>
                        <Stack spacing={12} direction="horizontal">
                            <IconButton
                                onPress={() => {
                                    navigation.push("FASTCORD_CUSTOM_PAGE", {
                                        title: "Edit Font",
                                        render: () => <FontEditor name={font.name} />
                                    });
                                }}
                                size="sm"
                                variant="secondary"
                                disabled={selected}
                                icon={findAssetId("PencilIcon")}
                            />
                            <Button
                                size="sm"
                                variant={selected ? "secondary" : "primary"}
                                text={selected ? "Unapply" : "Apply"}
                                onPress={async () => {
                                    await selectFont(selected ? null : font.name);
                                    showConfirmationAlert({
                                        title: Strings.HOLD_UP,
                                        content: "Reload Discord to apply changes?",
                                        confirmText: Strings.RELOAD,
                                        cancelText: Strings.CANCEL,
                                        confirmColor: "red",
                                        onConfirm: BundleUpdaterManager.reload
                                    });
                                }}
                            />
                        </Stack>
                    </View>
                </View>
                <FontPreview font={font} />
            </Stack>
        </Card>
    );
}
