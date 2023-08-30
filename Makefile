# Cockpit Makefile
# EchoMAV, LLC
# This makefile installs and configures cockpit

SHELL := /bin/bash
SUDO := $(shell test $${EUID} -ne 0 && echo "sudo")
# https://stackoverflow.com/questions/41302443/in-makefile-know-if-gnu-make-is-in-dry-run
DRY_RUN := $(if $(findstring n,$(firstword -$(MAKEFLAGS))),--dry-run)
DATE := $(shell date +%Y-%m-%d_%H%M)

.EXPORT_ALL_VARIABLES:

LOCAL=/usr/local
LOCAL_SCRIPTS=temperature.sh
LIBSYSTEMD=/lib/systemd/system
PLATFORM ?= NVID
SERVICES=temperature.service
SYSCFG=/usr/local/echopilot/conf

.PHONY = clean debug dependencies disable enable git-cache install
.PHONY = postinstall provision provision-cameras provision-video
.PHONY = show-config test uninstall upgrade

default:
	@echo "Please choose an action:"
	@echo ""
	@echo "  postinstall: Do this once on a new clean system (may setup internet)"
	@echo "  upgrade: Do this once on a new clean system after postinstall (requires internet)"
	@echo "  dependencies: ensure all needed software is installed (requires internet)"
	@echo "  install: update programs and system scripts"
	@echo "  provision: interactively define the needed configurations"
	@echo ""

dependencies:
	@./ensure-cockpit.sh
	@$(SUDO) apt-get -y install nano

disable:
	# https://lunar.computer/posts/nvidia-jetson-nano-headless/
	@for c in stop disable ; do $(SUDO) systemctl $$c gdm3 ; done
	$(SUDO) systemctl set-default multi-user.target

enable:
	# https://lunar.computer/posts/nvidia-jetson-nano-headless/
	$(SUDO) systemctl set-default graphical.target
	@for c in enable start ; do $(SUDO) systemctl $$c gdm3 ; done

git-cache:
	git config --global credential.helper "cache --timeout=5400"

install: dependencies
	@$(SUDO) rm -rf /usr/share/cockpit/general/ 
	@$(SUDO) mkdir /usr/share/cockpit/general/
	@$(SUDO) cp -rf ui/general/* /usr/share/cockpit/general/
	@$(SUDO) cp -rf ui/branding-ubuntu/* /usr/share/cockpit/branding/ubuntu/
	@$(SUDO) cp -rf ui/static/* /usr/share/cockpit/static/	
	@$(SUDO) cp -rf ui/base1/* /usr/share/cockpit/base1/
	@[ -d $(LOCAL)/echopilot ] || $(SUDO) mkdir $(LOCAL)/echopilot
	@$(SUDO) install -Dm755 cockpitScript.sh $(LOCAL)/echopilot/.	
	@for s in $(LOCAL_SCRIPTS) ; do $(SUDO) install -Dm755 $${s} $(LOCAL)/echopilot/$${s} ; done
	@for c in stop disable ; do $(SUDO) systemctl $${c} $(SERVICES) ; done ; true
	@for s in $(SERVICES) ; do $(SUDO) install -Dm644 $${s%.*}.service $(LIBSYSTEMD)/$${s%.*}.service ; done
	@if [ ! -z "$(SERVICES)" ] ; then $(SUDO) systemctl daemon-reload ; fi
	@for s in $(SERVICES) ; do $(SUDO) systemctl enable $${s%.*} ; done


uninstall:
	-@gstd -k
	-( cd $(LOCAL)/echopilot && $(SUDO) rm $(LOCAL_SCRIPTS) )
	@-for c in stop disable ; do $(SUDO) systemctl $${c} $(SERVICES) ; done
	@for s in $(SERVICES) ; do $(SUDO) rm $(LIBSYSTEMD)/$${s%.*}.service ; done
	@if [ ! -z "$(SERVICES)" ] ; then $(SUDO) systemctl daemon-reload ; fi
	
upgrade:
	$(SUDO) apt-get update
	$(SUDO) apt-get upgrade
