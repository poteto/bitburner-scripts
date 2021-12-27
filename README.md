# bitburner-scripts

A collection of personal scripts for the [Bitburner](https://github.com/danielyxie/bitburner) incremental game.

## Usage

The source of truth for these scripts is this GitHub repo.

### Installation
To first sync them to your game, copy and paste the contents of `sync-scripts.js` into bitburner's `home` server. Next run the following to upsert all the latest scripts on `main`:

```sh
run sync-scripts.js
```

### Development
Bitburner type declarations are synced from the official repo, but scripts are authored in JS with JSDoc comments for types to avoid the need for a build step. During development it may be helpful to watch for changes and sync in progress changes:

```sh
run sync-scripts.js --branch=mybranch --watch=true
```

## License

MIT