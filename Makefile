default: build

test:
	npm run eslint
	npm test

build:
	npm test
