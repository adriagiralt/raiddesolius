# Raid de Solius

Telegram bot for recording climbs and awarding team points, with a public Express leaderboard. Sequelize connects both services to MySQL.

## Run locally

### Preview the current website with fixtures

Use Node.js 24 with `nvm use`, then:

```sh
npm ci
npm run preview
```

Open http://127.0.0.1:3000. This serves the competition display with fictional,
fixed competition data. It needs no `.env`, database, or Telegram token and
does not connect to those services. It listens only on this machine.
If that port is busy, use `PORT=3001 npm run preview`. Stop it with Ctrl+C.

The snapshot includes eight teams, six climbing pinnacles, a bonus, two finished
teams, tied scores, and a team with no climbs. The latter appears in the active
teams, but not the ranking, matching the current live query.
The activity timestamps are fixed on 27 September 2026. Refreshing every
20 seconds reloads the same snapshot.

Edit `services/web/fixtures.js` to change the sample data. The preview restarts
when those files change; refresh the browser afterward. Rankings, activity,
and active teams are derived from the same records.

### Competition monitor / TV

The page displays the top eight teams, five latest records, five most climbed
pinnacles, and up to six active team names together. Participation totals include
all teams; an overflow count indicates additional active teams. Equal point totals
share a ranking position. Pinnacle counts are labelled as records, matching the
existing API rather than claiming they count distinct teams.

Use **Pantalla completa** in the footer for the event display. The layout is
designed for landscape monitors, with no scrolling or view switching. Fonts
are served locally so the display does not depend on a font service.

All five data feeds refresh every 20 seconds without reloading the page.
Requests time out after 10 seconds and cannot overlap. If a feed fails, the
previous complete snapshot stays on screen with a warning and its last successful
update time. The next refresh retries automatically. The clock and activity times
use the Europe/Madrid timezone. In fixture mode, refreshes return the same fixed
snapshot; the normal MySQL-backed server shows updates recorded by the Telegram bot.

### Run with MySQL and Telegram

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
