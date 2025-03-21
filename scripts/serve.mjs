// @ts-nocheck
import chalk from "chalk";
import { readFile } from "fs/promises";
import http from "http";
import os from "os";
import readline from "readline";
import url from "url";
import yargs from "yargs-parser";

import { forceStopAppFromADB, getPackageName, isADBAvailableAndAppInstalled, restartAppFromADB } from "./adb.mjs";
import { buildBundle } from "./build.mjs";
import { printBuildSuccess } from "./util.mjs";

const args = yargs(process.argv.slice(2));

export function serve(options) {
    // @ts-ignore
    const server = http.createServer(async (req, res) => {
        const { pathname } = url.parse(req.url || "", true);
        if (pathname?.endsWith(".js")) {
            try {
                const { config, context, timeTook } = await buildBundle();

                printBuildSuccess(
                    context.hash,
                    args.production,
                    timeTook
                );

                res.writeHead(200, { "Content-Type": "application/javascript" });
                res.end(await readFile(config.outfile, "utf-8"));
            } catch {
                res.writeHead(500);
                res.end();
            }
        } else {
            res.writeHead(404);
            res.end();
        }
    }, options);

    server.listen(args.port ?? 4040);

    console.info(chalk.bold.yellowBright("Serving Fastcord bundle, available on:"));

    const netInterfaces = os.networkInterfaces();
    for (const netinterfaces of Object.values(netInterfaces)) {
        for (const details of netinterfaces || []) {
            if (details.family !== "IPv4") continue;
            const port = chalk.green(server.address()?.port.toString());
            console.info(`  http://${details.address}:${port}/bundle.js`);
        }
    }

    return server;
}

const server = serve();

console.log("\nPress Q key or Ctrl+C to exit.");

if (args.adb && isADBAvailableAndAppInstalled()) {
    const packageName = getPackageName();

    console.log(`Press R key to reload Discord ${chalk.bold.blue(`(${packageName})`)}.`);
    console.log(`Press S key to force stop Discord ${chalk.bold.blue(`(${packageName})`)}.`);

    readline.emitKeypressEvents(process.stdin);

    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }

    process.stdin.on("keypress", (ch, key) => {
        if (!key) return;

        if (key.name === "q" || key.ctrl && key.name === "c") {
            process.exit(0);
        }

        if (key.name === "r") {
            console.info(chalk.yellow(`${chalk.bold("↻ Reloading")} ${packageName}`));
            restartAppFromADB(server.address().port)
                .then(() => console.info(chalk.greenBright(`${chalk.bold("✔ Executed")} reload command`)))
                .catch(e => console.error(e));
        }

        if (key.name === "s") {
            console.info(chalk.yellow(`${chalk.bold("⎊ Force stopping")} ${packageName}`));
            forceStopAppFromADB()
                .then(() => console.info(chalk.greenBright(`${chalk.bold("✔ Executed")} force stop command`)))
                .catch(e => console.error(e));
        }
    });
} else if (args.adb) {
    console.warn("ADB option enabled but failed to connect to device!");
}
