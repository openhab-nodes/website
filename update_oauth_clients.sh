#!/bin/sh
wget https://raw.githubusercontent.com/openhab-nodes/cloud-auth/master/oauth_clients.json -O assets/js/ui-oauth/oauth_clients.json
wget https://raw.githubusercontent.com/openhab-nodes/cloud-auth/master/oauth_scopes.json -O assets/js/ui-oauth/oauth_scopes.json
wget https://raw.githubusercontent.com/openhab-nodes/addons-registry/master/addon-permissions.json -O static/run/permissions.json
