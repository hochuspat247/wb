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

    CREATE TABLE IF NOT EXISTS demo_generation (
      id TEXT PRIMARY KEY NOT NULL,
      guestId TEXT NOT NULL,
      userId TEXT REFERENCES user(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'done',
      payload TEXT NOT NULL,
      originalImageBase64 TEXT NOT NULL,
      originalImageMimeType TEXT NOT NULL,
      previewImageBase64 TEXT NOT NULL,
      previewImageMimeType TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS demo_generation_guest_idx ON demo_generation(guestId);
    CREATE INDEX IF NOT EXISTS demo_generation_user_idx ON demo_generation(userId);

    CREATE TABLE IF NOT EXISTS demo_generation_attempt (
      id TEXT PRIMARY KEY NOT NULL,
      identityType TEXT NOT NULL,
      identityHash TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS demo_generation_attempt_identity_idx ON demo_generation_attempt(identityType, identityHash);
    CREATE INDEX IF NOT EXISTS demo_generation_attempt_created_idx ON demo_generation_attempt(createdAt);

    CREATE TABLE IF NOT EXISTS image_generation_ticket (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      purpose TEXT NOT NULL DEFAULT 'card_image',
      usedAt INTEGER,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS image_generation_ticket_user_idx ON image_generation_ticket(userId);
    CREATE INDEX IF NOT EXISTS image_generation_ticket_used_idx ON image_generation_ticket(usedAt);
    CREATE INDEX IF NOT EXISTS image_generation_ticket_expires_idx ON image_generation_ticket(expiresAt);
  `);

  try {
    sqlite.exec(`ALTER TABLE user ADD COLUMN generationCredits INTEGER NOT NULL DEFAULT 3`);
  } catch {
    // column already exists
  }

  try {
    sqlite.exec(`ALTER TABLE user ADD COLUMN generationsUsed INTEGER NOT NULL DEFAULT 0`);
  } catch {
    // column already exists
  }

  try {
    sqlite.exec(`ALTER TABLE user ADD COLUMN videoCredits INTEGER NOT NULL DEFAULT 0`);
  } catch {
    // column already exists
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS analytics_event (
      id TEXT PRIMARY KEY NOT NULL,
      eventType TEXT NOT NULL,
      eventName TEXT NOT NULL,
      path TEXT NOT NULL,
      referrer TEXT,
      label TEXT,
      xPercent INTEGER,
      yPercent INTEGER,
      viewportWidth INTEGER,
      viewportHeight INTEGER,
      userId TEXT,
      sessionId TEXT NOT NULL,
      metadata TEXT,
      createdAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS analytics_event_path_idx ON analytics_event(path);
    CREATE INDEX IF NOT EXISTS analytics_event_type_idx ON analytics_event(eventType);
    CREATE INDEX IF NOT EXISTS analytics_event_created_idx ON analytics_event(createdAt);
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS visitor_presence (
      sessionId TEXT PRIMARY KEY NOT NULL,
      userId TEXT,
      guestId TEXT,
      path TEXT NOT NULL,
      pathLabel TEXT,
      section TEXT,
      sectionLabel TEXT,
      lastAction TEXT,
      lastActionLabel TEXT,
      referrer TEXT,
      isAuthed INTEGER NOT NULL DEFAULT 0,
      isVisible INTEGER NOT NULL DEFAULT 1,
      firstSeenAt INTEGER NOT NULL,
      lastSeenAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS visitor_presence_last_seen_idx ON visitor_presence(lastSeenAt);
    CREATE INDEX IF NOT EXISTS visitor_presence_section_idx ON visitor_presence(section);
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS payment (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      provider TEXT NOT NULL DEFAULT 'yookassa',
      status TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'RUB',
      credits INTEGER NOT NULL,
      paid INTEGER NOT NULL DEFAULT 0,
      confirmationUrl TEXT,
      idempotenceKey TEXT NOT NULL,
      creditedAt INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS payment_user_idx ON payment(userId);
    CREATE INDEX IF NOT EXISTS payment_status_idx ON payment(status);
    CREATE INDEX IF NOT EXISTS payment_credited_idx ON payment(creditedAt);
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS video_generation_order (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      sourceGenerationId TEXT NOT NULL,
      sourceImageUrl TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'genapi',
      model TEXT NOT NULL DEFAULT 'veo-3-1-fast',
      status TEXT NOT NULL DEFAULT 'payment_pending',
      duration TEXT NOT NULL,
      aspectRatio TEXT NOT NULL,
      quality TEXT NOT NULL,
      motionStyle TEXT NOT NULL,
      prompt TEXT NOT NULL,
      amountRub INTEGER,
      paymentId TEXT,
      externalTaskId TEXT,
      originalVideoUrl TEXT,
      error TEXT,
      paidAt INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS video_generation_order_user_idx ON video_generation_order(userId);
    CREATE INDEX IF NOT EXISTS video_generation_order_source_idx ON video_generation_order(sourceGenerationId);
    CREATE INDEX IF NOT EXISTS video_generation_order_status_idx ON video_generation_order(status);
  `);

  try {
    sqlite.exec(`ALTER TABLE video_generation_order ADD COLUMN generateAudio INTEGER NOT NULL DEFAULT 0`);
  } catch {
    // column already exists
  }

  try {
    sqlite.exec(`ALTER TABLE demo_generation ADD COLUMN clientIpHash TEXT`);
  } catch {
    // column already exists
  }

  try {
    sqlite.exec(`CREATE INDEX IF NOT EXISTS demo_generation_ip_hash_idx ON demo_generation(clientIpHash)`);
  } catch {
    // index already exists
  }

  sqlite.exec(`DELETE FROM demo_generation_attempt`);

  sqlite.exec(`
    UPDATE user
    SET emailVerified = CAST(strftime('%s','now') AS INTEGER) * 1000
    WHERE email LIKE '%@oauth.marketcard.local' AND emailVerified IS NULL
  `);
}
