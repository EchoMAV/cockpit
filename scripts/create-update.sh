#!/bin/bash

# Use this script to create a .mender file to drop into cockpit
dest_dir=""
filename=""
version=""
machine="jetson-nano-devkit"

mkdir -p update-artifacts/

help() {
    bn= `basename $0`
    echo " Usage: $bn <options> "
    echo 
    echo " options: "
    echo " -h           display the Help Message"
    echo " -n           update package name, README should have available names"
    echo 
    echo " Example: $bn create-update.sh -n h31-proxy"
    echo
    echo
}

create_h31_proxy_update() {

    dest_dir="/usr/local/h31/h31proxy/"
    filename="bin/h31proxy.net"
    version="1.0"
    artifactname="$filename-$version"
    outputpath="update-artifacts/h31proxy.mender"

    ./scripts/single-file-artifact-gen \
        -n ${artifactname} \
        -t ${machine} \
        -d ${dest_dir} \
        -o ${outputpath} \
        ${filename}
}

moreoptions=1
while [ "$moreoptions" = 1 -a $# -gt 0 ]; do
    case $1 in
        -n) shift ; UPDATE_NAME=${1} ;;
        -h) help ; exit 3 ;;
        *) help ; exit 3 ;;
    esac
    [ "$moreoptions" = 0 ] && [ $# -gt 1 ] && help && exit 1
    [ "$moreoptions" = 1 ] && shift
done

if [ $UPDATE_NAME == "h31proxy" ]
    then
        create_h31_proxy_update
fi
