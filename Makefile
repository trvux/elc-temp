# Load env variables from .env.local
include .env.local
.PHONY: dev build rsdev rsbuild

dev:
	bun run dev

build:
	bun run build

rsdev:
	rm -rf .next && bun dev

rsbuild:
	rm -rf .next && bun build
