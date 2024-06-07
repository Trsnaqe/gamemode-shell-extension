#!/bin/bash

set -e

# Directories
srcdir=$(dirname "$0")
srcdir=$(cd "$srcdir" && pwd)
builddir=$(mktemp -d)
installdir=$(mktemp -d)
zipdir="$srcdir/zip-files"
schemadir="/usr/share/glib-2.0/schemas"
uuid='gamemodeshellextension@trsnaqe.com'
zipname='gamemodeshellextension@trsnaqe.com.shell-extension.zip'

# Function to build and package the extension
build_and_package() {
    # Meson setup and install
    meson setup --prefix="$installdir" "$srcdir" "$builddir"
    meson install -C "$builddir"

    # Prepare for packaging
    extensiondir="$installdir/share/gnome-shell/extensions/${uuid}"
    mkdir -p "$zipdir"

    sources=(client.js extension.js stylesheet.css metadata.json)

    # Copy schema to the extension directory
    cp "$srcdir/settings/org.gnome.shell.extensions.gamemodeshellextension.gschema.xml" "$extensiondir/"

    # Package the extension
    gnome-extensions pack ${sources[@]/#/--extra-source=} --schema="org.gnome.shell.extensions.gamemodeshellextension.gschema.xml" --out-dir="$zipdir" "$extensiondir"

    echo "Build and packaging completed successfully."
    
    # Install the schema
    sudo install -Dm644 "$srcdir/settings/org.gnome.shell.extensions.gamemodeshellextension.gschema.xml" "$schemadir/org.gnome.shell.extensions.gamemodeshellextension.gschema.xml"
    
    # Compile the schemas
    sudo glib-compile-schemas "$schemadir"
    
    echo "Schema installed and compiled successfully."
}

# Function to check if the schema is installed
is_schema_installed() {
    gsettings list-schemas | grep -q 'org.gnome.shell.extensions.gamemodeshellextension'
}

# Function to install the extension
install_extension() {
    extensionhome="${HOME}/.local/share/gnome-shell/extensions"
    targetdir="${extensionhome}/${uuid}"

    # Create the target directory if it doesn't exist
    mkdir -p "${targetdir}"

    # Unzip to the target
    unzip -o "${zipdir}/${zipname}" -d "${targetdir}"

    echo "Extension installed to ${targetdir}"

    # Check if the schema is installed
    if is_schema_installed; then
        echo "Schema is installed."
    else
        echo "Schema is not installed."
        exit 1
    fi

    # Enable the extension
    gnome-extensions enable "$uuid"

    echo "Extension enabled."
}

# Function to remove build files
remove_build_files() {
    rm -rf "$builddir"
    rm -rf "$installdir"
    rm -rf "$zipdir"
    echo "Build files removed successfully."
}

# Function to remove the installed schema
remove_schema() {
    schema_file="$schemadir/org.gnome.shell.extensions.gamemodeshellextension.gschema.xml"
    if [ -f "$schema_file" ]; then
        sudo rm "$schema_file"
        sudo glib-compile-schemas "$schemadir"
        echo "Schema removed and schemas recompiled successfully."
    else
        echo "Schema file not found: $schema_file"
    fi
}

# Function to remove the installed extension
remove_extension() {
    extensionhome="${HOME}/.local/share/gnome-shell/extensions"
    targetdir="${extensionhome}/${uuid}"
    if [ -d "$targetdir" ]; then
        rm -rf "$targetdir"
        echo "Extension removed from ${targetdir}"
    else
        echo "Extension directory not found: $targetdir"
    fi
}

# Check for arguments
case "$1" in
    build)
        build_and_package
        ;;
    install)
        build_and_package
        install_extension
        ;;
    remove)
        remove_build_files
        ;;
    purge)
        remove_build_files
        remove_schema
        remove_extension
        ;;
    *)
        echo "Usage: $0 {build|install|remove|purge}"
        exit 1
        ;;
esac
