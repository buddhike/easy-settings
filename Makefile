default: build

test:
	npm run eslint
	npm test

build:
	npm install
	npm test

patch: build
	npm version patch
	git push origin --tags

minor: build
	npm version minor
	git push origin --tags

major: build
	npm version major
	git push origin --tags
