#!/usr/bin/env bun
import { Command } from "commander";
import chalk from "chalk";
import { startFastcordServer } from "./server";

const program = new Command();

program
  .name("fastcord")
  .description("Development tool for Fastcord")
  .version("1.0.0");

program
  .command("build")
  .description("Build the Fastcord bundle")
  .option("-p, --production", "Build in production mode")
  .option("-w, --watch", "Watch for file changes")
  .option("-o, --outfile <path>", "Path to output file")
  .action(async (options) => {
    console.log(chalk.cyan.bold("\n🏗️  Fastcord Builder"));
    console.log(chalk.dim("=========================================="));

    const { runBuild } = await import("./build/builder.js");
    await runBuild();
  });

const startServer = async (options: any) => {
  try {
    await startFastcordServer();
  } catch (error) {
    console.error(chalk.red("\n❌ Error starting Fastcord server:"), error);
    process.exit(1);
  }
};

program
  .command("serve")
  .description("Start the Fastcord development server")
  .option("-p, --port <number>", "Server port")
  .option("--adb", "Enable ADB integration")
  .option("--package-name <n>", "Discord package name")
  .action(startServer);

program
  .command("dev")
  .description("Start development server with watch mode")
  .option("-p, --port <number>", "Server port")
  .option("--adb", "Enable ADB integration")
  .option("--package-name <n>", "Discord package name")
  .action(async (options) => {
    console.log(chalk.cyan.bold(`\n${chalk.bold.yellowBright("⚡ Fastcord")} Development Mode`));
    console.log(chalk.dim("=========================================="));
    process.argv.push("--watch");
    await startServer(options);
  });

program.parse();
