/**
 * Metro Integration Module
 * Handles integration with Metro bundler used by React Native
 */

import { initializeFastcord } from "./initializer";
const { instead } = require("spitroast");

/**
 * Type representing the arguments for a bridge call
 */
export type BridgeCallArgs = [
	moduleName: string,
	methodName: string,
	args: unknown[],
];

/**
 * Handles conversion of modules from Map to Object if needed
 */
export function handleModulesFormat(): void {
	if (window.modules instanceof Map) {
		window.modules = Object.fromEntries([...window.modules]) as Record<
			string,
			unknown
		>;
	}
}

/**
 * Interface for bridge call interception data
 */
export interface BridgeInterception {
	unpatchHook: () => void;
	callQueue: BridgeCallArgs[];
}

/**
 * Intercepts calls to bridged functions and handles them appropriately
 * @param batchedBridge The React Native bridge
 * @returns Object with the unpatch function and callQueue
 */
export function interceptBridgeCalls(
	batchedBridge: Window["__fbBatchedBridge"],
): BridgeInterception {
	const callQueue = new Array<BridgeCallArgs>();
	const unpatchHook = instead(
		"callFunctionReturnFlushedQueue",
		batchedBridge,
		(args: BridgeCallArgs, orig: (args: BridgeCallArgs) => unknown) => {
			if (
				args[0] === "AppRegistry" ||
				!batchedBridge.getCallableModule(args[0])
			) {
				callQueue.push(args);
				return batchedBridge.flushedQueue();
			}

			return orig.apply(batchedBridge, [args]);
		},
	);

	return { unpatchHook, callQueue };
}

/**
 * Processes the queued bridge calls
 * @param batchedBridge The React Native bridge
 * @param callQueue The queue of calls to process
 */
export function processBridgeCalls(
	batchedBridge: Window["__fbBatchedBridge"],
	callQueue: BridgeCallArgs[],
): void {
	for (const arg of callQueue) {
		batchedBridge.getCallableModule(arg[0]) &&
			batchedBridge.__callFunction(...arg);
	}
}

/**
 * Type for the Metro require function
 */
export type MetroRequireFunction = (moduleId: number) => unknown;

/**
 * Starts Discord after intercepting the Metro require
 * @param originalRequire The original require function
 * @param callQueue The queue of bridge calls
 * @param unpatchHook The function to remove the intercept
 */
export async function startDiscord(
	originalRequire: MetroRequireFunction,
	callQueue: BridgeCallArgs[],
	unpatchHook: () => void,
): Promise<void> {
	await initializeFastcord();
	unpatchHook();
	originalRequire(0);

	const batchedBridge = window.__fbBatchedBridge;
	processBridgeCalls(batchedBridge, callQueue);
}

/**
 * Called once the index module is required
 * Sets up interception and starts Discord
 * @param originalRequire The original require function
 */
export function onceIndexRequired(originalRequire: MetroRequireFunction): void {
	const batchedBridge = window.__fbBatchedBridge;
	const { unpatchHook, callQueue } = interceptBridgeCalls(batchedBridge);

	startDiscord(originalRequire, callQueue, unpatchHook).catch((e) => {
		console.error(e);
		alert(
			"An error occurred while starting Discord. Check the console for more information.",
		);
	});
}
