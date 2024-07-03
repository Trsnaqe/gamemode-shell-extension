project('gamemode-extension',
    version: '1.0',
    meson_version: '>= 0.46.0',
    license: 'LGPL-2.1'
)

# Project metadata
uuid = 'gamemodeshellextension@trsnaqe.com'
gettext_domain = meson.project_name()

# Import gnome module
gnome = import('gnome')

# Directories
datadir = get_option('datadir')
prefix = get_option('prefix')
extensiondir = join_paths(datadir, 'gnome-shell', 'extensions', uuid)
schemadir = join_paths(datadir, 'glib-2.0', 'schemas')

# Source files
sources = [
  'client.js',
  'extension.js',
  'stylesheet.css',
  'metadata.json',
  'prefs.js'
]

# Schema file
schema_file = 'settings/org.gnome.shell.extensions.gamemodeshellextension.gschema.xml'

# Install source files
install_data(
    sources,
    install_dir: extensiondir
)

# Install schema
install_data(
    schema_file,
    install_dir: schemadir
)

# Compile schema
meson.add_install_script(
  'scripts/compile-schema.sh',
  join_paths(prefix, schemadir)
)

# Build completion message
message('Project version: @0@'.format(meson.project_version()))
