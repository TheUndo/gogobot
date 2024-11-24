#!/bin/bash

v=1.0.0

docker build \
  -f Dockerfile \
  -t ghcr.io/TheUndo/gogobot:$v \
  -t ghcr.io/TheUndo/gogobot:latest \
  .
