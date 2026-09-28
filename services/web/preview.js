const { createWebApp } = require('./index');
const fixtures = require('./fixtures');

// Deliberately does not load .env, MySQL, or Telegram. Bind only to this machine.
const port = process.env.PORT || '3000';
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  console.error('PORT must be an integer between 1 and 65535');
  process.exitCode = 1;
} else {
  const server = createWebApp(fixtures).listen(Number(port), '127.0.0.1', () => {
    console.log(`Fixture preview: http://127.0.0.1:${server.address().port}`);
    console.log('Fictional, fixed data. MySQL and Telegram are not connected.');
  });
  server.once('error', error => {
    console.error(`Could not start fixture preview: ${error.message}`);
    process.exitCode = 1;
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => server.close());
  }
}
