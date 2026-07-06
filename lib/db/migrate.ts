import type Database from "better-sqlite3";

export function migrate(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER,
      image TEXT,
      passwordHash TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS account (
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      providerAccountId TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      PRIMARY KEY (provider, providerAccountId)
    );

    CREATE TABLE IF NOT EXISTS session (
      sessionToken TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      expires INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verificationToken (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL,
      expires INTEGER NOT NULL,
      PRIMARY KEY (identifier, token)
    );

    CREATE TABLE IF NOT EXISTS product_card (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      payload TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS product_card_user_idx ON product_card(userId);
  `);
}
