#!/bin/bash

v=1.0.0

docker build \
  -f Dockerfile \
  -t ghcr.io/theundo/gogobot:$v \
  -t ghcr.io/theundo/gogobot:latest \
  .
