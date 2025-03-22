import { after } from "@lib/api/patcher";
import { findInReactTree } from "@lib/utils";
import { i18n, NavigationNative } from "@metro/common";
import { LegacyFormDivider,LegacyFormIcon, LegacyFormRow, LegacyFormSection } from "@metro/common/components";
import { findByNameLazy } from "@metro/wrappers";
import { registeredSections } from "@ui/settings";

import { CustomPageRenderer, wrapOnPress } from "./shared";

function SettingsSection() {
    const navigation = NavigationNative.useNavigation();

    return <>
        {Object.keys(registeredSections).map(sect => registeredSections[sect].length > 0 && (
            <LegacyFormSection key={sect} title={sect}>
                { /** Is usePredicate here safe? */}
                {registeredSections[sect].filter(r => r.usePredicate?.() ?? true).map((row, i, arr) => (
                    <>
                        <LegacyFormRow
                            label={row.title()}
                            leading={<LegacyFormIcon source={row.icon} />}
                            trailing={<LegacyFormRow.Arrow label={row.useTrailing?.() || undefined} />}
                            onPress={wrapOnPress(row.onPress, navigation, row.render, row.title())}
                        />
                        {i !== arr.length - 1 && <LegacyFormDivider />}
                    </>
                ))}
            </LegacyFormSection>
        ))}
    </>;
}

export function patchPanelUI(unpatches: (() => void | boolean)[]) {
    try {
        unpatches.push(
            after("default", findByNameLazy("getScreens", false), (_a, screens) => ({
                ...screens,
                VendettaCustomPage: {
                    title: "Fastcord",
                    render: () => <CustomPageRenderer />
                },
                FASTCORD_CUSTOM_PAGE: {
                    title: "Fastcord",
                    render: () => <CustomPageRenderer />
                }
            }))
        );

        const unpatch = after("default", findByNameLazy("UserSettingsOverviewWrapper", false), (_a, ret) => {
            const UserSettingsOverview = findInReactTree(ret.props.children, n => n.type?.name === "UserSettingsOverview");

            unpatches.push(after("renderSupportAndAcknowledgements", UserSettingsOverview.type.prototype, (_args, { props: { children } }) => {
                const index = children.findIndex((c: any) => c?.type?.name === "UploadLogsButton");
                if (index !== -1) children.splice(index, 1);
            }));

            unpatches.push(after("render", UserSettingsOverview.type.prototype, (_args, res) => {
                const titles = [i18n.Messages.BILLING_SETTINGS, i18n.Messages.PREMIUM_SETTINGS];

                const sections = findInReactTree(
                    res.props.children,
                    n => n?.children?.[1]?.type === LegacyFormSection
                )?.children || res.props.children;

                if (sections) {
                    const index = sections.findIndex((c: any) => titles.includes(c?.props.label));
                    sections.splice(-~index || 4, 0, <SettingsSection />);
                }
            }));
        }, true);

        unpatches.push(unpatch);
    } catch {

    }
}

