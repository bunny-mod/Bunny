/**
 * Global Properties Module
 * Handles global property definitions and window object modifications
 */

import { onceIndexRequired } from "./metroIntegration";
import type { MetroRequireFunction } from "./metroIntegration";

/**
 * Sets up the global window property
 */
export function setupGlobalWindow(): void {
	// This is necessary to ensure window is available globally
	// @ts-expect-error - Assigning globalThis to window is expected in our context
	globalThis.window = globalThis;
}

/**
 * Ensures modules are properly initialized in the global scope
 */
export function ensureModulesInitialized(): void {
	if (window.Object !== undefined && !window.modules) {
		const modules = window.__c?.();
		if (modules) {
			window.modules = modules;
		}
	}
}

/**
 * Interface for the property descriptor context
 */
interface PropertyDescriptorContext {
	value: unknown;
}

/**
 * Defines global properties to intercept Metro bundler internals
 */
export function defineGlobalProperties(): void {
	let _requireFunc: MetroRequireFunction | undefined;

	Object.defineProperties(globalThis, {
		__r: {
			configurable: true,
			get: () => _requireFunc,
			set(v: MetroRequireFunction) {
				_requireFunc = function patchedRequire(a: number): unknown {
					// Initializing index.ts(x)
					if (a === 0) {
						// https://github.com/facebook/metro/commit/1361405ffe6f1bdef54295addfef0f30523aaab2
						if (window.modules instanceof Map) {
							window.modules = Object.fromEntries([
								...window.modules,
							]) as Record<string, unknown>;
						}

						onceIndexRequired(v);
						_requireFunc = v;
						return undefined;
					}

					return v(a);
				};
			},
		},
		__d: {
			configurable: true,
			get(this: PropertyDescriptorContext) {
				ensureModulesInitialized();
				return this.value;
			},
			set(this: PropertyDescriptorContext, v: unknown) {
				this.value = v;
			},
		},
	});
}
