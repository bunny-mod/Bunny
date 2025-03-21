# Fastcord
A mod for Discord's mobile apps, a fork of [Vendetta](https://github.com/vendetta-mod/Vendetta/).

## Installing

### Android

- **Root** with Xposed - [FastcordXposed](https://github.com/fastcord/FastcordXposed/releases/latest)
- **Non-root** - [FastcordManager](https://github.com/fastcord/FastcordManager/releases/latest)

### iOS
- [**FastcordTweak**](https://github.com/fastcord/FastcordTweak) - Get prebuilt rootful and rootless `.deb` files or the prepatched `.ipa `

## Building
1. Install a Fastcord loader with loader config support (any mentioned in the [Installing](#installing) section).
1. Go to Settings > General and enable Developer Settings.
1. Clone the repo:
    ```
    git clone https://github.com/fastcord/Fastcord
    ```
1. Install dependencies:
    ```
    pnpm i
    ```
1. Build Fastcord's code:
    ```
    pnpm build
    ```
1. In the newly created `dist` directory, run a HTTP server. I recommend [http-server](https://www.npmjs.com/package/http-server).
1. Go to Settings > Developer enabled earlier. Enable `Load from custom url` and input the IP address and port of the server (e.g. `http://192.168.1.236:4040/fastcord.js`) in the new input box labelled `Fastcord URL`.
1. Restart Discord. Upon reload, you should notice that your device will download Fastcord's bundled code from your server, rather than GitHub.
1. Make your changes, rebuild, reload, go wild!

Alternatively, you can directly *serve* the bundled code by running `pnpm serve`. `fastcord.js` will be served on your local address under the port 4040. You will then insert `http://<local ip address>:4040/fastcord.js` as a custom url and reload. Whenever you restart your mobile client, the script will rebuild the bundle as your client fetches it.
