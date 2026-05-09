# pi-telegram-session-sync

Telegram DM bridge for pi with session summary sync and TUI mirroring.

Fork of [`badlogic/pi-telegram`](https://github.com/badlogic/pi-telegram). This version keeps the upstream DM bridge behavior and adds session-aware connect summaries, TUI prompt/reply mirroring, Telegram-side disconnect, and new-connection ownership.

## Install

From git:

```bash
pi install git:github.com/zerray/pi-telegram-session-sync
```

Or for a single run:

```bash
pi -e git:github.com/zerray/pi-telegram-session-sync
```

## Configure

### Telegram

1. Open [@BotFather](https://t.me/BotFather)
2. Run `/newbot`
3. Pick a name and username
4. Copy the bot token

### pi

Start pi, then run:

```bash
/telegram-setup
```

Paste the bot token when prompted.

The extension stores config in:

```text
~/.pi/agent/telegram.json
```

## Connect a pi session

Connect the current pi session:

```bash
/telegram-connect
```

Manual connect always pushes a Telegram summary containing:

- current session message count
- latest conversation on the current branch
- aggregated tool calls, e.g. `3 times tool called`

Automatic network reconnects do not send this summary.

If another pi session is already connected to the bot, the new connection takes ownership and the old polling client stops after Telegram returns a `getUpdates` conflict.

To stop polling in the current session:

```bash
/telegram-disconnect
```

Check status:

```bash
/telegram-status
```

## Pair your Telegram account

After token setup and `/telegram-connect`:

1. Open the DM with your bot in Telegram
2. Send `/start`

The first DM user becomes the allowed Telegram user for the bridge. The extension only accepts messages from that user.

## Usage

Chat with your bot in Telegram DMs.

### Send text

Send any message in the bot DM. It is forwarded into pi with a `[telegram]` prefix.

### Mirror TUI messages

Prompts typed in the pi TUI are mirrored to Telegram, and the assistant reply for that turn is streamed back to Telegram.

### Send images and files

Send images, albums, or files in the DM.

The extension:
- downloads them to `~/.pi/agent/tmp/telegram`
- includes local file paths in the prompt
- forwards inbound images as image inputs to pi

### Ask for files back

If you ask pi for a file or generated artifact, pi should call the `telegram_attach` tool. The extension then sends those files with the next Telegram reply.

Examples:
- `summarize this image`
- `read this README and summarize it`
- `write me a markdown file with the plan and send it back`
- `generate a shell script and attach it`

### Stop a run

In Telegram, send:

```text
stop
```

or:

```text
/stop
```

That aborts the active pi turn.

### Disconnect from Telegram

In Telegram, send:

```text
/disconnect
```

or:

```text
/telegram-disconnect
```

That stops polling in the connected pi session. Reconnect from pi with `/telegram-connect`.

### Queue follow-ups

If you send more Telegram messages while pi is busy, they are queued and processed in order.

## Streaming

The extension streams assistant text previews back to Telegram while pi is generating.

This fork disables Telegram draft streaming and uses normal `sendMessage` plus `editMessageText` previews.

## Notes

- Replies are sent as normal Telegram messages, not quote-replies
- Long replies are split below Telegram's 4096 character limit
- Outbound files are sent via `telegram_attach`

## License

MIT
