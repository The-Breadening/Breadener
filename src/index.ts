import {
  Client,
  GatewayIntentBits,
  REST,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from "discord.js";
import { slashCommands } from "./collectCommands.ts";
import { BotEvent } from "./types.ts";
import { coolBanner } from "./utils.ts";

const requiredKeys = [
  "DATABASE_PATH",
  "CLIENTID",
  "GUILDID",
  "TOKEN",
] as const;

for (const key of requiredKeys) {
  if (!Deno.env.get(key)) throw new Error(`\x1b[34mMissing .env variable ${key}\x1b[0m`);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// This type name is fucking brilliant
const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
for (const slashCommand of slashCommands) {
  commands.push(slashCommand.data.toJSON());
}

console.log(`Started refreshing ${commands.length} application (/) commands`);

// Construct and prepare an instance of the REST module
await new REST().setToken(Deno.env.get("TOKEN")!).put(
  Routes.applicationCommands(Deno.env.get("CLIENTID")!),
  { body: commands },
).catch(console.error);

console.log(`Successfully reloaded application (/) commands.`);

const eventFiles = Deno
  .readDirSync("src/events")
  .filter((file) => file.name.endsWith(".ts"));

for (const eventFile of eventFiles) {
  const module = await import(`./events/${eventFile.name}`) as object;

  for (const [name, entry] of Object.entries(module)) {
    if (!(entry instanceof BotEvent)) {
      console.warn(
        `[WARNING] The export ${name} in module ${eventFile.name} doesn't really look like an event..`,
      );
    } else if (entry.once) {
      client.once(entry.type, entry.execute);
    } else {
      client.on(entry.type, entry.execute);
    }
  }
}

client.login(Deno.env.get("TOKEN"));
console.log(coolBanner);
