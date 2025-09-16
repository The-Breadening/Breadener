import "@std/dotenv/load";

const secretKeys = [
  "clientId",
  "guildId",
  "public_key",
  "token",
  "octokitToken",
] as const;
type SecretRecord = Record<(typeof secretKeys)[number], string>;

const configKeys = ["DATABASE_PATH", "SECRETS_PATH"] as const;
type ConfigRecord = Record<(typeof configKeys)[number], string>;

export const config = configKeys.reduce<ConfigRecord>((prev, current) => {
  const env = Deno.env.get(current);
  if (!env) {
    throw new Error(
      `Please configure your dotenv correctly. Missing: ${current}`,
    );
  }

  prev[current] = env;
  return prev;
}, {} as ConfigRecord);

const base_path: URL = new URL("../", import.meta.url);
const secrets_path: URL = new URL(config.SECRETS_PATH, base_path);

let tSecrets: SecretRecord | undefined;
try {
  tSecrets = (
    await import(secrets_path.href, {
      with: { type: "json" },
    })
  ).default as SecretRecord;
} catch (e) {
  throw Error(`Failed to read secrets: '${e}'`);
}

const tSecretsKeys = Object.keys(tSecrets);
for (const key of secretKeys) {
  if (!tSecretsKeys.includes(key)) throw Error(`Missing secret: '${key}'`);
}

export const secrets = tSecrets;
