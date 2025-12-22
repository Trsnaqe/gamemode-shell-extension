#!/bin/sh
SCRIPTDIR=`dirname $0`
xgettext  --from-code=UTF-8 -k_ -kN_  -o gamemode-shell-extension.pot "$SCRIPTDIR"/../*.js "$SCRIPTDIR"/../settings/*.xml

for pofile in *.po; do
	msgmerge --backup=off -N -U "$pofile" gamemode-shell-extension.pot
done
