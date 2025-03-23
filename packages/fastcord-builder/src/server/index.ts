import { getConfig } from "../config";
import { FastcordServer } from "./server";
import { CLI } from "./cli";

export async function startFastcordServer() {
  try {
    const config = getConfig();
    
    const serverInstance = new FastcordServer(config);
    const server = await serverInstance.start();
    
    const cli = new CLI(config);
    cli.setServer(server);
    cli.initialize();
    
    process.on("uncaughtException", (error) => {
      console.error("Uncaught error:", error);
    });
    
    process.on("SIGINT", () => {
      cli.exit();
    });
    
    return { server, cli };
  } catch (error) {
    console.error("Error starting Fastcord server:", error);
    process.exit(1);
  }
}