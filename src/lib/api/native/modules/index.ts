import { RNModules } from "./types";

const nmp = window.nativeModuleProxy;

export const MMKVManager = nmp.MMKVManager as RNModules.MMKVManager;
export const FileManager = (nmp.NativeFileModule ?? nmp.RTNFileManager ?? nmp.DCDFileManager) as RNModules.FileManager;
export const ClientInfoManager = nmp.NativeClientInfoModule ?? nmp.RTNClientInfoManager ?? nmp.InfoDictionaryManager;
export const DeviceManager = nmp.NativeDeviceModule ?? nmp.RTNDeviceManager ?? nmp.DCDDeviceManager;
export const { BundleUpdaterManager } = nmp;
export const ThemeManager = nmp.NativeThemeModule ?? nmp.RTNThemeManager ?? nmp.DCDTheme;
