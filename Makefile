.PHONY: dev build test deploy seed clean

dev:
	npm run dev

db-generate:
	npm run db:generate

db-migrate:
	npm run db:migrate

db-seed:
	npm run db:seed

test:
	npm run test

test-coverage:
	npm run test:coverage

test-e2e:
	npm run test:e2e

build:
	npm run build

deploy-staging:
	./scripts/deploy.sh

deploy-prod:
	./scripts/deploy.sh --prod --with-migrations

format:
	npm run format

lint:
	npm run lint

clean:
	rm -rf .next node_modules coverage
