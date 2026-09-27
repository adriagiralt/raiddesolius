# Raid de Solius

Telegram bot for recording climbs and awarding team points, with a public Express leaderboard. Sequelize connects both services to MySQL.

## Run locally

Use Node.js 24 with `nvm use`, then:

```sh
npm ci
cp .env.example .env
# Fill in the Telegram token and MySQL connection details.
npm start
```

`npm run dev` starts the same application through nodemon. `PORT` defaults to 3000 and `DB_PORT` to 3306. The application checks the database connection and Telegram credentials before opening the web server. Missing configuration or startup failures exit with a nonzero status. SIGINT and SIGTERM stop polling and close HTTP and database connections.

The database must already contain the event tables and data. Startup does not create or migrate tables. Scoring transactions require InnoDB tables. Admin Telegram IDs are configured in `services/telegram/utils/policies.js`.

## Checks

```sh
npm test
npm audit
```

The unit tests need neither MySQL nor a Telegram token. They cover SQL parameterization, HTML escaping, bonus authorization, callback validation, score failures, and startup/shutdown.

The integration test recreates tables in a disposable database named `raid_test`. Run it against a dedicated local MySQL instance only:

```sh
docker run --detach --rm --name raid-test-mysql \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -e MYSQL_DATABASE=raid_test \
  -p 127.0.0.1:3307:3306 mysql:8.4
# Wait for MySQL to report that it is ready for connections.
DB_HOST=127.0.0.1 DB_PORT=3307 DB_USER=root DB_PASSWORD= DB_NAME=raid_test npm run test:integration
docker stop raid-test-mysql
```

This checks real MySQL transactions, rollback after a failed replacement, concurrent bonus/totem claims, ranking queries, and all public API routes.

## Dependency maintenance

Direct dependencies and the lockfile were updated on 2026-09-26. Sequelize's `uuid` dependency is overridden to `^11.1.1`, which includes the [upstream security fix](https://github.com/uuidjs/uuid/releases/tag/v11.1.1) and supports this CommonJS application. The integration tests exercise Sequelize transaction IDs and queries with this override. Remove it when Sequelize adopts a patched version itself.

## Event rules still in code

Bonus IDs, points, special climbs, and admin IDs remain specific to this event. Totems now award points once globally, following the existing duplicate-check intent. Their existing flat five-point award is retained. The individual reward cases in `services/telegram/utils/totem_handler.js` are unimplemented and need agreed event rules before they can replace that flat award.

These fixes prevent new duplicate awards through the bot; they do not alter existing scoring records. Check historical duplicates separately before using an existing database's rankings as final results.
