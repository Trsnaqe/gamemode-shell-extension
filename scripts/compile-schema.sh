#!/bin/sh

SCHEMADIR="${1:-/usr/share/glib-2.0/schemas}"

if [ -z "$DESTDIR" ]; then
    TARGETDIR="${SCHEMADIR}"
else
    TARGETDIR="${DESTDIR}/${SCHEMADIR}"
fi

glib-compile-schemas "${TARGETDIR}"
ls -l "${TARGETDIR}/gschemas.compiled"
echo "Compiled schema."
