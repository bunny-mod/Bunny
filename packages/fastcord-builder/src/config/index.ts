import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

const defaultServerConfig = {
	port: 3000,
	host: "0.0.0.0",
	bundlePath: "/bundle.js",
};

const defaultBuilderConfig = {
	entryPoint: "src/index.ts",
	outfile: "dist/bundle.js",
	production: false,
	watch: false,
};

const defaultAdbConfig = {
	enabled: false,
	packageName: process.env.DISCORD_PACKAGE_NAME ?? "com.discord",
};

type Config = {
	server: typeof defaultServerConfig;
	builder: typeof defaultBuilderConfig;
	adb: typeof defaultAdbConfig;
	paths: {
		root: string;
		dist: string;
		src: string;
	};
};

/**
 * Gets project configuration based on command line arguments
 */
export function getConfig(): Config {
	const program = new Command();

	program
		.option(
			"-p, --port <number>",
			"Server port",
			String(defaultServerConfig.port),
		)
		.option("-h, --host <string>", "Server host", defaultServerConfig.host)
		.option(
			"--bundle-path <string>",
			"Path to the bundle",
			defaultServerConfig.bundlePath,
		);

	program
		.option(
			"-e, --entry-point <string>",
			"Build entry point",
			defaultBuilderConfig.entryPoint,
		)
		.option(
			"-o, --outfile <string>",
			"Output file",
			defaultBuilderConfig.outfile,
		)
		.option("--production", "Production mode", defaultBuilderConfig.production)
		.option(
			"-w, --watch",
			"Watch for file changes",
			defaultBuilderConfig.watch,
		);

	program
		.option("--adb", "Enable ADB integration", defaultAdbConfig.enabled)
		.option(
			"--package-name <string>",
			"Discord package name",
			defaultAdbConfig.packageName,
		);

	program.parse();
	const options = program.opts();

	return {
		server: {
			port: Number.parseInt(options.port, 10),
			host: options.host,
			bundlePath: options.bundlePath,
		},
		builder: {
			entryPoint: options.entryPoint,
			outfile: options.outfile,
			production: options.production,
			watch: options.watch,
		},
		adb: {
			enabled: options.adb,
			packageName: options.packageName,
		},
		paths: {
			root: rootDir,
			dist: path.resolve(rootDir, "dist"),
			src: path.resolve(rootDir, "src"),
		},
	};
}

export type FastcordConfig = ReturnType<typeof getConfig>;
