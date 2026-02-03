.PHONY: build run shell clean

# Build the Docker image
build:
	docker compose build

# Run Ubuntu container with bash
run:
	docker compose run --rm ubuntu

# Alias for run
shell: run

# Clean up Docker resources
clean:
	docker compose down -v --rmi local

# Local development commands
.PHONY: dev install link

# Install dependencies locally
install:
	npm install

# Build TypeScript
dev:
	npm run build

# Link for local testing
link: dev
	npm link
	npx opencode-atlascloud-plugin
