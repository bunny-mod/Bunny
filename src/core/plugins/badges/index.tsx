import { after } from "@lib/api/patcher";
import { onJsxCreate } from "@lib/api/react/jsx";
import { findByName } from "@metro";
import { useEffect, useState } from "react";

import { defineCorePlugin } from "..";

interface FastcordBadge {
    label: string;
    url: string;
}

const useBadgesModule = findByName("useBadges", false);

export default defineCorePlugin({
    manifest: {
        id: "fastcord.badges",
        name: "Badges",
        version: "1.0.0",
        description: "Adds badges to user's profile",
        authors: [{ name: "pylixonly" }]
    },
    start() {
        const propHolder = {} as Record<string, any>;
        const badgeCache = {} as Record<string, FastcordBadge[]>;

        onJsxCreate("RenderedBadge", (_, ret) => {
            if (ret.props.id.match(/fastcord-\d+-\d+/)) {
                Object.assign(ret.props, propHolder[ret.props.id]);
            }
        });

        after("default", useBadgesModule, ([user], r) => {
            const [badges, setBadges] = useState<FastcordBadge[]>(user ? badgeCache[user.userId] ??= [] : []);

            useEffect(() => {
                if (user) {
                    fetch(`https://raw.githubusercontent.com/pyoncord/badges/refs/heads/main/${user.userId}.json`)
                        .then(r => r.json())
                        .then(badges => setBadges(badgeCache[user.userId] = badges));
                }
            }, [user]);

            if (user) {
                badges.forEach((badges, i) => {
                    propHolder[`fastcord-${user.userId}-${i}`] = {
                        source: { uri: badges.url },
                        id: `fastcord-${i}`,
                        label: badges.label
                    };

                    r.push({
                        id: `fastcord-${user.userId}-${i}`,
                        description: badges.label,
                        icon: "_",
                    });
                });
            }
        });
    }
});
