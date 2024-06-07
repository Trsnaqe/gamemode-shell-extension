#!/bin/bash

set -e

# Directories
srcdir=$(dirname "$0")
srcdir=$(cd "$srcdir" && pwd)
schemadir="/usr/share/glib-2.0/schemas"

# Project specific variables
uuid='gamemodeshellextension@trsnaqe.com'

# Install the schema
sudo install -Dm644 "$srcdir/settings/org.gnome.shell.extensions.gamemodeshellextension.gschema.xml" "$schemadir/org.gnome.shell.extensions.gamemodeshellextension.gschema.xml"

# Compile the schemas
sudo glib-compile-schemas "$schemadir"

echo "Schema installed and compiled successfully."
