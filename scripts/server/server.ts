import chalk from "chalk";
import { readFile } from "fs/promises";
import http from "http";
import os from "os";
import url from "url";
import type { Server } from "http";
import type { FastcordConfig } from "../config";
import { Builder, printBuildSuccess } from "../build/builder";

export class FastcordServer {
  private config: FastcordConfig;
  private server: Server | null = null;
  private builder: Builder;

  constructor(config: FastcordConfig) {
    this.config = config;
    this.builder = new Builder(config);
  }

  private async findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
    const checkPort = (port: number): Promise<boolean> => {
      return new Promise((resolve) => {
        const testServer = http.createServer();
        testServer.unref();

        const onError = (err: NodeJS.ErrnoException) => {
          testServer.close();
          resolve(false);
        };

        testServer.once('error', onError);
        testServer.once('listening', () => {
          testServer.close(() => resolve(true));
        });

        try {
          testServer.listen(port, '127.0.0.1');
        } catch {
          resolve(false);
        }
      });
    };

    for (let port = startPort; port < startPort + maxAttempts; port++) {
      console.log(chalk.dim(`  ⚡ Checking port availability ${port}...`));
      const available = await checkPort(port);
      if (available) {
        console.log(chalk.green.bold(`  ✓ Port ${port} is available`));
        return port;
      }
    }

    throw new Error(`Unable to find an available port in range ${startPort}-${startPort + maxAttempts - 1}`);
  }

  async start(): Promise<Server> {
    let { port, host, bundlePath } = this.config.server;

    try {
      port = await this.findAvailablePort(port);
      this.config.server.port = port;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find available port: ${message}`);
    }

    return new Promise<Server>((resolve, reject) => {
      if (!this.server) {
        this.server = http.createServer(async (req, res) => {
          const { pathname } = url.parse(req.url || "", true);

          if (pathname === bundlePath) {
            try {
              console.log(chalk.yellow(`\n📦 Building bundle...`));
              const buildResult = await this.builder.build();
              printBuildSuccess(buildResult);

              res.writeHead(200, { "Content-Type": "application/javascript" });
              if (!buildResult.config.outfile) {
                throw new Error("No outfile specified in build result");
              }

              res.end(await readFile(buildResult.config.outfile, "utf-8"));
            } catch (error) {
              console.error(chalk.red("\n❌ Error building bundle:"), error);
              res.writeHead(500);
              res.end("Error building bundle");
            }
          } else {
            res.writeHead(404);
            res.end("Not Found");
          }
        });
      }

      this.server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use. Try using a different port with the --port option.`));
        } else {
          reject(new Error(`Failed to start server: ${err.message}`));
        }
      });

      this.server.listen(port, host, () => {
        this.printServerInfo();
        resolve(this.server!);
      });
    });
  }

  private printServerInfo(): void {
    if (!this.server) return;

    const address = this.server.address();
    if (!address || typeof address === "string") return;

    const { port } = address;
    const bundlePath = this.config.server.bundlePath;

    console.log(chalk.cyan("\n🚀 Ready! Access points:"));

    const networkInterfaces = os.networkInterfaces();
    for (const netInterfaces of Object.values(networkInterfaces)) {
      for (const details of netInterfaces || []) {
        if (details.family === "IPv4") {
          const url = `http://${details.address}:${port}${bundlePath}`;
          if (details.address === "127.0.0.1") {
            console.log(chalk.gray("  ➜  Local:   ") + chalk.cyan(url));
          } else {
            console.log(chalk.gray("  ➜  Network: ") + chalk.cyan(url));
          }
        }
      }
    }
    console.log();
  }

  getAddress(): { port: number; host: string; bundlePath: string } | null {
    if (!this.server) return null;

    const address = this.server.address();
    if (!address || typeof address === "string") return null;

    return {
      port: address.port,
      host: address.address,
      bundlePath: this.config.server.bundlePath
    };
  }

  async stop(): Promise<void> {
    if (!this.server) return;

    return new Promise<void>((resolve) => {
      this.server!.close(() => {
        console.log(chalk.yellow("\n👋 Shutting down Fastcord server..."));
        this.server = null;
        resolve();
      });
    });
  }
}
