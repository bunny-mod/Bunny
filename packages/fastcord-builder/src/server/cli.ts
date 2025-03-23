import type { Server } from "node:http";
import readline from "node:readline";
import chalk from "chalk";
import type { FastcordConfig } from "../config";
import { ADBManager } from "../utils/adb-manager";

export class CLI {
	private config: FastcordConfig;
	private adbManager: ADBManager;
	private server: Server | null = null;

	constructor(config: FastcordConfig) {
		this.config = config;
		this.adbManager = new ADBManager(config);
	}

	setServer(server: Server): void {
		this.server = server;
	}

	initialize(): void {
		console.log(chalk.bold("Available commands:"));
		console.log(
			chalk
				.dim(`  • ${chalk.bold("Q")} or ${chalk.bold("Ctrl+C")} `)
				.padEnd(25) + chalk.gray("Exit Fastcord"),
		);

		if (this.config.adb.enabled) {
			if (this.adbManager.isAvailableAndInstalled()) {
				const packageName = this.adbManager.getPackageName();

				console.log(
					chalk.dim(`  • ${chalk.bold("R")}`).padEnd(25) +
						chalk.gray(` Restart Discord (${chalk.blue(packageName)})`),
				);
				console.log(
					chalk.dim(`  • ${chalk.bold("S")}`).padEnd(25) +
						chalk.gray(` Force stop Discord (${chalk.blue(packageName)})`),
				);

				this.setupKeyboardHandlers();
			} else {
				console.log(
					chalk.yellow(
						"\n⚠️  ADB is enabled but failed to connect to device or app is not installed!",
					),
				);
			}
		}
		console.log();
	}

	private setupKeyboardHandlers(): void {
		readline.emitKeypressEvents(process.stdin);

		if (process.stdin.isTTY) {
			process.stdin.setRawMode(true);
		}

		process.stdin.on("keypress", (ch, key) => {
			if (!key) return;

			if (key.name === "q" || (key.ctrl && key.name === "c")) {
				this.exit();
			}

			if (key.name === "r") {
				this.restartApp();
			}

			if (key.name === "s") {
				this.stopApp();
			}
		});
	}

	private async restartApp(): Promise<void> {
		const packageName = this.adbManager.getPackageName();
		console.log(chalk.yellow(`\n🔄 Restarting ${chalk.bold(packageName)}...`));

		try {
			await this.adbManager.restart();
			console.log(chalk.green("✓ Successfully restarted Discord"));
		} catch (error) {
			console.error(chalk.red("\n❌ Error restarting Discord:"), error);
		}
	}

	private async stopApp(): Promise<void> {
		const packageName = this.adbManager.getPackageName();
		console.log(
			chalk.yellow(`\n⏹️  Force stopping ${chalk.bold(packageName)}...`),
		);

		try {
			this.adbManager.forceStop();
			console.log(chalk.green("✓ Successfully stopped Discord"));
		} catch (error) {
			console.error(chalk.red("\n❌ Error stopping Discord:"), error);
		}
	}

	exit(): void {
		console.log(chalk.yellow("\n👋 Shutting down Fastcord..."));
		process.exit(0);
	}
}
