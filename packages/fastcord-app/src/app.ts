/**
 * Main application entry point
 * Coordinates the initialization of Fastcord
 */

import {
	defineGlobalProperties,
	setupGlobalWindow,
} from "./modules/globalProperties";
import { initializeFastcord } from "./modules/initializer";

export { registerApp } from "./modules/appRegistry";
export type { AppFunction } from "./modules/appRegistry";

// Setup global environment
setupGlobalWindow();

// Initialize based on environment
// @ts-ignore - React Native global
if ("__r" in globalThis && typeof globalThis.__r !== "undefined") {
	// Direct initialization (React Native environment already initialized)
	initializeFastcord().catch((error: unknown) => {
		console.error("Failed to initialize Fastcord:", error);
	});
} else {
	// Delayed initialization (waiting for React Native to initialize)
	defineGlobalProperties();
}
