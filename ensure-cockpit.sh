#!/bin/bash
# usage:
#   ensure-cockpit.sh
#
# This script ensures that cockpit it installed and setup

DRY_RUN=false
LOCAL=/usr/local
SUDO=$(test ${EUID} -ne 0 && which sudo)

$SUDO apt-get install -y cockpit

# Change the port to 443/80 and restart

$SUDO sed -i 's/9090/443/g' /lib/systemd/system/cockpit.socket
$SUDO sed -i '/ListenStream=80/d' /lib/systemd/system/cockpit.socket
$SUDO sed -i '/ListenStream=443/a ListenStream=80' /lib/systemd/system/cockpit.socket 
$SUDO systemctl daemon-reload
$SUDO systemctl restart cockpit.socket

