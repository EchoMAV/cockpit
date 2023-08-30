#!/bin/bash
LOG=/tmp/temperature.csv
PERIOD=10
THERMAL=/sys/devices/virtual/thermal/
n=0
echo "Logging to $LOG, $PERIOD sec period"
echo -n "date/time," >> $LOG
for d in $THERMAL/thermal_zone* ; do
	echo -n "zone$n," | tee -a $LOG
	n=$(($n + 1))
done
echo "" | tee -a $LOG

while true ; do
	echo -n "$(date --iso-8601=seconds)," >> $LOG
	for d in $THERMAL/thermal_zone* ; do
		x=$(cat $d/temp)
		echo -n "$x," | tee -a $LOG
	done
	echo "" | tee -a $LOG
	sleep $PERIOD
done
