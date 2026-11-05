# Kids Arcade switchboard (multiplayer)

A tiny Cloudflare Worker that lets phones play together. Phones that tap the same
3-picture room code are put in the same room, and each phone's game messages
(where my car is, start the race...) are passed to the others.

**Privacy:** no accounts, no names, no logs, nothing saved. A room exists only in
memory while phones are connected. (Cloudflare does see each phone's internet
address while passing messages along, like any website does.)

## Put it online (once)

You need Node.js (nodejs.org) and a free Cloudflare account.

```
cd server
npx wrangler login      # opens the browser: click Allow
npx wrangler deploy     # prints the address, e.g. https://kids-arcade.NAME.workers.dev
```

Then put that address in `arcade/net.js` (`const SERVER = 'wss://kids-arcade.NAME.workers.dev'`,
with `wss://` instead of `https://`). The Friends button appears in Mini RC Racers' Free Play.

## Try it on your computer

```
npx wrangler dev        # a local copy at ws://localhost:8787
```

`tests/test_friends.py` starts a local copy by itself and races two "phones".

## Cost

The free plan is plenty for a family. If a daily limit were ever reached, new games
would just fail to connect until the next day; it never bills you on the free plan.
