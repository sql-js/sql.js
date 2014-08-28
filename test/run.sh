#!/usr/bin/env bash

passed=0
total=0
for f in $(dirname $0)/test_*.js
do
	total=$((total+1))
	echo -ne "Testing $f...\t"
	node "$f" > /tmp/sqljstest
	if [ $? = 0 ]
	then
		echo "Passed."
		passed=$((passed+1))
	else
		echo -e "\033[31mFail!\e[0m"
		cat /tmp/sqljstest
	fi
done

if [ $passed = $total ]
then
	echo -e "\033[32mAll $total tests passed\e[0m"
	exit 0
else
	echo -e "\033[31mWarning\e[0m : $passed tests passed out of $total"
	exit 1
fi
