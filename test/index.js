const fs = require('fs');
const { promisify } = require('util');
const rmrf = promisify(require('rimraf'));
const config = require('../lib');

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

async function clean() {
  await rmrf('.tmp');
  await mkdir('.tmp');
}
describe('settings', function () {
  it('should read basic settings', async function () {
    await clean();
    await writeFile('.tmp/settings.json', '{ "a": "foo" }');
    await config.load('./.tmp/settings.json');
    config.settings.a.should.equal('foo');
  });

  it('should apply environment specific settings', async () => {
    await clean();
    await writeFile('.tmp/settings.json', '{"a": "foo", "b": "star"}');
    await writeFile('.tmp/prod-settings.json', '{ "a": "bar" }');
    await writeFile('.tmp/stg-settings.json', '{ "a": "car" }');

    await config.load('.tmp/settings.json', { envName: 'prod' });

    config.settings.a.should.equal('bar');
    config.settings.b.should.equal('star');
  });

  it('should replace secrets', async () => {
    await clean();
    await writeFile('.tmp/settings.json', `{
 "a": "not-a-secret",
 "b": "{just-secret}",
 "c": "{multiple-secret-1}.{multiple-secret-2}",
 "d": "{ secret-with-ws   }",
 "e": "{ { value-with-braces} }",
 "f": {
   "g": "{nested-secret}"
 }
}`);

    await writeFile('.tmp/secrets.json', `{
  "just-secret": "a",
  "multiple-secret-1": "b",
  "multiple-secret-2": "c",
  "secret-with-ws": "d",
  "value-with-braces": "e",
  "nested-secret": "f"
}`);
    await config.load('.tmp/settings.json', { secretsFile: '.tmp/secrets.json' });

    config.settings.a.should.equal('not-a-secret');
    config.settings.b.should.equal('a');
    config.settings.c.should.equal('b.c');
    config.settings.d.should.equal('d');
    config.settings.e.should.equal('{ e }');
    config.settings.f.g.should.equal('f');
  });
});
