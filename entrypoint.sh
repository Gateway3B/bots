#!/bin/bash

case $app in
    poller)
        node dist/apps/poller/main
        ;;
    ticker)
        node dist/apps/ticker/main
        ;;
    responder)
        node dist/apps/responder/main
        ;;
    craber)
        node dist/apps/craber/main
        ;;
    notion)
        node dist/apps/notion/main
        ;;
esac

sleep infinity