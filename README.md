# GameMode GNOME Shell Extension

## Overview

This GNOME Shell extension provides a convenient indicator for Feral's GameMode. The extension displays the status of GameMode, the number of active clients, and a list of these clients.


## Features

- **GameMode Status Indicator**: Easily see if GameMode is enabled or disabled.
- **Active Clients Count**: Displays the number of active clients using GameMode.
- **Client List**: Lists all active clients and their process names.
- **Notification Settings**: Configure notifications for when GameMode is enabled or disabled.

## Screenshots

![Extension Enabled](https://i.imgur.com/SjFEuwi.png)

*Figure 1: GameMode is enabled and showing active clients.*

![Extension Disabled](https://i.imgur.com/simnnAn.png)

*Figure 2: GameMode is disabled.*

![Extension Enabled Notification](https://i.imgur.com/ejQXPYh.png)

*Figure 3: GameMode enabled notification.*

![Extension Settings Menu](https://i.imgur.com/dgSVH1v.png)

*Figure 4: GameMode Settings Menu.*


# Installation

## Install Feral GameMode:
  If GameMode is not installed you will not be able to use the extension, to install GameMode please refer to:
  [Feral GameMode Docs](https://github.com/FeralInteractive/gamemode?tab=readme-ov-file#build-and-install-gamemode)

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/trsnaqe/gamemode-shell-extension
    cd gamemodeshellextension
    ```

2. **Automatically Install Extension**:
    ```bash
    ./makezip.sh install
    ```
## Manual Installation

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/yourusername/gamemodeshellextension.git
    cd gamemodeshellextension
    ```

2. **Build and Package the Extension**:
    ```bash
    ./makezip.sh build
    ```
3. **Move and Extract Zip into Extensions**:
    ```bash
    unzip gamemodeshellextension.zip -d ~/.local/share/gnome-shell/extensions/gamemodeshellextension@trsnaqe.com/

    ```
 4. **Install and Compile the Schema**:
  in settings folder run:
  ```
sudo install -Dm644 settings/org.gnome.shell.extensions.gamemodeshellextension.gschema.xml /usr/share/glib-2.0/schemas/org.gnome.shell.extensions.gamemodeshellextension.gschema.xml
sudo glib-compile-schemas /usr/share/glib-2.0/schemas
  ```

 5. **Enable Extension**:
    ```bash
    gnome-extensions enable gamemodeshellextension@trsnaqe.com

    ```
**Note**: If makezip.sh does not work, you may need to give it executable permissions:

```bash
chmod +x ./makezip.sh
```

## Makezip script
The makezip.sh script simplifies the build and installation process of the extension. It includes the following commands:

- **build**: Builds the extansion into a zip                                                                                                                        .
- **install**: Builds the extension, installs it, installs the schema, and activates the extension.
- **remove**: Removes the build files.
- **purge**: Removes everything related to the extension.

## Usage

Once installed, the extension will appear in the GNOME Shell top panel.

- **Icon**: The icon indicates whether GameMode is currently active.
- **Menu**: Click on the icon to open the menu, which displays the current status of GameMode, the number of active clients, and a list of these clients.
- **Notifications**: Toggle notifications for when GameMode is enabled or disabled via the settings menu.

## Configuration

The extension includes settings to control notification preferences:

1. **GameMode Enabled Notification**: Shows a notification when GameMode is turned on.
2. **GameMode Disabled Notification**: Shows a notification when GameMode is turned off.

These settings can be accessed from the extension's menu.

## Development

This extension was developed as a weekend project to learn more about DBus integration and GNOME Shell extension development.

### Code Structure

- **extension.js**: Main extension logic.
- **client.js**: Handles DBus communication with GameMode.
- **stylesheet.css**: Custom styles for the extension.
- **metadata.json**: Metadata for the extension.
- **settings/org.gnome.shell.extensions.gamemodeshellextension.gschema.xml**: Settings schema.

### Dependencies

- **GNOME Shell**: The GNOME desktop environment.
- **Feral's GameMode**: A Linux tool to optimize the system for gaming.

## Contributing

Contributions are welcome! If you have suggestions or improvements, feel free to open an issue or submit a pull request.

## License

This project is licensed under the LGPL-2.1 License.

## Acknowledgements

Special thanks to Feral Interactive for developing GameMode and the GNOME community for their excellent documentation and support.

## Contact

For any questions or suggestions, please open an issue on the [GitHub repository](https://github.com/trsnaqe/gamemode-shell-extension).

---


