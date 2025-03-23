/**
 * App Registry Module
 * Responsible for registering and managing the main application function
 */

export type AppFunction = () => Promise<void>;

let globalApp: AppFunction;

/**
 * Register the main application function to be executed by Fastcord
 * @param app The application function to register
 */
export function registerApp(app: AppFunction): void {
    globalApp = app;
}

/**
 * Get the registered application function
 * @returns The registered application function
 * @throws Error if no application has been registered
 */
export function getRegisteredApp(): AppFunction {
    if (!globalApp) {
        throw new Error("App not registered");
    }
    return globalApp;
}