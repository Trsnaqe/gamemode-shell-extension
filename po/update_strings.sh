#!/bin/sh
SCRIPTDIR=`dirname $0`
xgettext  --from-code=UTF-8 -k_ -kN_  -o gamemode-shell-extension.pot "$SCRIPTDIR"/../*.js "$SCRIPTDIR"/../settings/*.xml

for fn in *.po; do
	msgmerge -U "$fn" gamemode-shell-extension.pot
done
