import * as path from "node:path";
import swc from "@swc/core";
import chalk from "chalk";
import { type BuildOptions, type BuildResult, build } from "esbuild";
import type { FastcordConfig } from "../config";

type BuildResultConfig = {
	config: BuildOptions;
	context: BuildResult;
	hash: string;
	timeTook: number;
};

export class Builder {
	private config: FastcordConfig;
	private buildContext?: BuildResult;
	private hash = "local";

	constructor(config: FastcordConfig) {
		this.config = config;
	}

	private generateHash(): string {
		return crypto.randomUUID();
	}

	private createBuildConfig(
		overrideConfig: Partial<BuildOptions> = {},
	): BuildOptions {
		const { outfile, entryPoint, production } = this.config.builder;

		console.log(chalk.cyan("\n⚙️  Configuring build..."));
		console.log(
			chalk.dim(`   Mode: ${production ? "production" : "development"}`),
		);
		console.log(chalk.dim(`   Entry: ${entryPoint}`));
		console.log(chalk.dim(`   Output: ${outfile}\n`));

		return {
			entryPoints: [entryPoint],
			outfile,
			bundle: true,
			format: "iife",
			splitting: false,
			legalComments: "none",
			minify: production,
			external: [],
			supported: {
				"const-and-let": false,
			},
			footer: {
				js: "//# sourceURL=fastcord",
			},
			loader: {
				".png": "dataurl",
			},
			define: {
				__DEV__: production ? "false" : "true",
			},
			inject: [
				`${path.resolve(__dirname, "./shims/async-iterator-symbol.js")}`,
				`${path.resolve(__dirname, "./shims/promise-all-settled.js")}`,
			],
			alias: {
				"!fastcord-deps-shim!": `${path.resolve(__dirname, "./shims/deps-shim.js")}`,
				"react/jsx-runtime": `${path.resolve(__dirname, "./shims/react-jsx-runtime.js")}`,
				spitroast: "./node_modules/spitroast",
			},
			plugins: [
				{
					name: "swc",
					setup: (build) => {
						build.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async (args) => {
							const result = await swc.transformFile(args.path, {
								jsc: {
									externalHelpers: true,
									transform: {
										constModules: {
											globals: {
												"fastcord-build-info": {
													version: `"${this.hash}"`,
												},
											},
										},
										react: {
											runtime: "automatic",
										},
									},
								},
								env: {
									targets: "fully supports es6",
									include: [
										"transform-block-scoping",
										"transform-classes",
										"transform-async-to-generator",
										"transform-async-generator-functions",
									],
									exclude: [
										"transform-parameters",
										"transform-template-literals",
										"transform-exponentiation-operator",
										"transform-named-capturing-groups-regex",
										"transform-nullish-coalescing-operator",
										"transform-object-rest-spread",
										"transform-optional-chaining",
										"transform-logical-assignment-operators",
									],
								},
							});

							return { contents: result.code };
						});
					},
				},
			],
			...overrideConfig,
		};
	}

	async build(
		overrideConfig: Partial<BuildOptions> = {},
	): Promise<BuildResultConfig> {
		this.hash = this.generateHash();
		const config = this.createBuildConfig(overrideConfig);
		const startTime = performance.now();
		let context: BuildResult;

		try {
			console.log(chalk.yellow("⚡ Starting build process..."));
			context = await build(config);
			this.buildContext = context;
		} catch (error) {
			console.error(chalk.red("\n❌ Build failed:"), error);
			throw error;
		}

		const endTime = performance.now();
		const timeTook = endTime - startTime;

		return {
			config: config,
			context,
			hash: this.hash,
			timeTook,
		};
	}

	async dispose(): Promise<void> {
		if (this.buildContext) {
			console.log(chalk.dim("\n🧹 Cleaning up build context..."));
			this.buildContext = undefined;
		}
	}
}

export function printBuildSuccess(result: BuildResultConfig): void {
	const { hash, timeTook } = result;
	const isProduction = result.config.define?.__DEV__ === "false";
	const timeFormatted = timeTook.toFixed(2);

	console.log(
		chalk.green(
			`\n✨  ${isProduction ? "Production" : "Development"} build completed in ${chalk.bold(`${timeFormatted}ms`)}`,
		),
	);

	const details = [
		["Build ID", hash],
		["Output", result.config.outfile],
		["Mode", isProduction ? "production" : "development"],
	];

	console.log(chalk.dim("\nBuild details:"));
	for (const [key, value] of details) {
		console.log(chalk.dim(`  • ${key}: `).padEnd(20) + chalk.cyan(value));
	}
	console.log();
}

export async function runBuild(): Promise<void> {
	const { getConfig } = await import("../config");
	const config = getConfig();

	const builder = new Builder(config);
	const result = await builder.build();

	printBuildSuccess(result);

	if (!config.builder.watch) {
		await builder.dispose();
	}
}
