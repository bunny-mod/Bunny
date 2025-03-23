import { execSync } from "node:child_process";
import chalk from "chalk";
import type { FastcordConfig } from "../config";

export function isADBAvailable(): boolean {
	try {
		execSync("adb devices", { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

export function isAppInstalled(packageName: string): boolean {
	try {
		const output = execSync(
			`adb shell pm list packages ${packageName}`,
		).toString();
		return output.includes(packageName);
	} catch {
		return false;
	}
}

export function isADBAvailableAndAppInstalled(config: FastcordConfig): boolean {
	const adbAvailable = isADBAvailable();
	const appInstalled = isAppInstalled(config.adb.packageName);

	if (!adbAvailable) {
		console.log(chalk.yellow("\n⚠️  ADB is not available on this system"));
	} else if (!appInstalled) {
		console.log(
			chalk.yellow(
				`\n⚠️  Discord (${config.adb.packageName}) is not installed on the device`,
			),
		);
	}

	return adbAvailable && appInstalled;
}

export function startApp(packageName: string): void {
	try {
		console.log(chalk.dim(`\n📱 Launching ${packageName}...`));
		execSync(
			`adb shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`,
			{ stdio: "ignore" },
		);
	} catch (error) {
		console.error(chalk.red("\n❌ Error launching app:"), error);
	}
}

export function forceStopApp(packageName: string): void {
	try {
		console.log(chalk.dim(`\n🛑 Force stopping ${packageName}...`));
		execSync(`adb shell am force-stop ${packageName}`);
	} catch (error) {
		console.error(chalk.red("\n❌ Error force stopping app:"), error);
	}
}

export async function restartApp(config: FastcordConfig): Promise<void> {
	const { port } = config.server;
	const { packageName } = config.adb;

	console.log(chalk.cyan(`\n🔄 Setting up port forwarding (${port})...`));
	try {
		execSync(`adb reverse tcp:${port} tcp:${port}`);
	} catch (error) {
		console.error(chalk.red("\n❌ Error setting up port forwarding:"), error);
		throw error;
	}

	forceStopApp(packageName);
	startApp(packageName);
}

/**
 * Class to manage ADB interactions
 */
export class ADBManager {
	private readonly config: FastcordConfig;

	constructor(config: FastcordConfig) {
		this.config = config;
	}

	isAvailableAndInstalled(): boolean {
		return isADBAvailableAndAppInstalled(this.config);
	}

	getPackageName(): string {
		return this.config.adb.packageName;
	}

	async restart(): Promise<void> {
		return restartApp(this.config);
	}

	forceStop(): void {
		forceStopApp(this.config.adb.packageName);
	}
}
