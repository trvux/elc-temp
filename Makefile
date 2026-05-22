# Load env variables from .env.local
include .env.local
.PHONY: gen login dev build rsdev rsbuild

# Extract project ID from URL (e.g., https://[ID].supabase.co)
PROJECT_ID=$(shell echo $(NEXT_PUBLIC_SUPABASE_URL) | sed -e 's|https://||' -e 's|\.supabase\.co||')


gen:
	@echo "Generating types for project: $(PROJECT_ID)..."
	SUPABASE_ACCESS_TOKEN=$(SUPABASE_ACCESS_TOKEN) npx supabase gen types typescript --project-id $(PROJECT_ID) > database.types.ts
	@echo "Done! Check database.types.ts"


login:
	npx supabase login


dev:
	pnpm run dev


build:
	pnpm run build

rsdev:
	rm -rf .next && pnpm dev

rsbuild:
	rm -rf .next && pnpm build
