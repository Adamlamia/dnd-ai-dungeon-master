/**
 * Neon-backed Storage (Phase 1)
 *
 * Replaces the former in-memory Map storage. Keeps the EXACT same exported
 * interface (campaignStorage / characterStorage / sessionStorage with
 * save/get/getAll/delete, plus sessionStorage.getByCampaignId) so the service
 * layer and API routes work unchanged.
 *
 * Data now persists in Neon serverless Postgres across cold starts and
 * redeploys. Nested/variable-shape fields are stored as JSONB; timestamps are
 * written as ISO strings cast to timestamptz and read back as JS Date objects
 * to match the domain types.
 *
 * owner_id is written as NULL for the solo MVP; the multiplayer/auth path
 * (Phase 5) will populate it and enable RLS.
 */

import { getDb } from '@/lib/db';
import { Campaign, Character, Session } from '@/types';

// ------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------

/** JSON.stringify a value for a jsonb column, or SQL NULL if undefined/null. */
function jsonb(value: unknown): string | null {
  return value === undefined || value === null ? null : JSON.stringify(value);
}

/** Coerce a timestamptz value from Postgres into a JS Date. */
function toDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(value as string | number);
}

/** ISO string for a Date-ish domain value, defaulting to now. */
function toIso(value: Date | string | undefined | null): string {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

// ------------------------------------------------------------------
// campaigns
// ------------------------------------------------------------------

interface CampaignRow {
  id: string;
  name: string;
  description: string;
  theme: string;
  level_range: { min: number; max: number };
  tone: Campaign['tone'];
  status: Campaign['status'];
  prepared_materials: Campaign['preparedMaterials'] | null;
  created_at: string;
  updated_at: string;
}

function rowToCampaign(r: CampaignRow): Campaign {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    theme: r.theme,
    levelRange: r.level_range ?? { min: 1, max: 1 },
    tone: r.tone,
    status: r.status,
    preparedMaterials: r.prepared_materials ?? undefined,
    createdAt: toDate(r.created_at),
    updatedAt: toDate(r.updated_at),
  };
}

export const campaignStorage = {
  async save(campaign: Campaign): Promise<void> {
    const sql = getDb();
    await sql`
      insert into campaigns
        (id, owner_id, name, description, theme, level_range, tone, status, prepared_materials, created_at, updated_at)
      values
        (${campaign.id},
         ${null},
         ${campaign.name},
         ${campaign.description ?? ''},
         ${campaign.theme ?? ''},
         ${jsonb(campaign.levelRange ?? { min: 1, max: 1 })}::jsonb,
         ${campaign.tone ?? 'casual'},
         ${campaign.status ?? 'planning'},
         ${jsonb(campaign.preparedMaterials)}::jsonb,
         ${toIso(campaign.createdAt)}::timestamptz,
         ${toIso(campaign.updatedAt)}::timestamptz)
      on conflict (id) do update set
        name = excluded.name,
        description = excluded.description,
        theme = excluded.theme,
        level_range = excluded.level_range,
        tone = excluded.tone,
        status = excluded.status,
        prepared_materials = excluded.prepared_materials,
        updated_at = excluded.updated_at
    `;
  },

  async get(id: string): Promise<Campaign | null> {
    const sql = getDb();
    const rows = await sql`select * from campaigns where id = ${id} limit 1`;
    return rows.length ? rowToCampaign(rows[0] as unknown as CampaignRow) : null;
  },

  async getAll(): Promise<Campaign[]> {
    const sql = getDb();
    const rows = await sql`select * from campaigns order by updated_at desc`;
    return (rows as unknown as CampaignRow[]).map(rowToCampaign);
  },

  async delete(id: string): Promise<void> {
    const sql = getDb();
    await sql`delete from campaigns where id = ${id}`;
  },
};

// ------------------------------------------------------------------
// characters
// ------------------------------------------------------------------

interface CharacterRow {
  id: string;
  campaign_id: string | null;
  player_id: string;
  name: string;
  dndbeyond_id: string | null;
  dndbeyond_url: string | null;
  race: string;
  class_type: string;
  level: number;
  ability_scores: Character['abilityScores'];
  hit_points: Character['hitPoints'];
  armor_class: number;
  speed: number;
  proficiency_bonus: number;
  skills: Character['skills'];
  spells: Character['spells'] | null;
  backstory: string | null;
  personality_traits: Character['personalityTraits'] | null;
  inventory: string[];
  notes: string;
  last_updated: string;
}

function rowToCharacter(r: CharacterRow): Character {
  return {
    id: r.id,
    name: r.name,
    playerId: r.player_id,
    dndbeyondId: r.dndbeyond_id ?? undefined,
    dndbeyondUrl: r.dndbeyond_url ?? undefined,
    race: r.race,
    classType: r.class_type,
    level: r.level,
    abilityScores: r.ability_scores,
    hitPoints: r.hit_points,
    armorClass: r.armor_class,
    speed: r.speed,
    proficiencyBonus: r.proficiency_bonus,
    skills: r.skills ?? {},
    spells: r.spells ?? undefined,
    backstory: r.backstory ?? undefined,
    personalityTraits: r.personality_traits ?? undefined,
    inventory: r.inventory ?? [],
    notes: r.notes ?? '',
    lastUpdated: toDate(r.last_updated),
  };
}

export const characterStorage = {
  async save(character: Character): Promise<void> {
    const sql = getDb();
    await sql`
      insert into characters
        (id, owner_id, campaign_id, player_id, name, dndbeyond_id, dndbeyond_url, race, class_type,
         level, ability_scores, hit_points, armor_class, speed, proficiency_bonus, skills, spells,
         backstory, personality_traits, inventory, notes, last_updated)
      values
        (${character.id},
         ${null},
         ${null},
         ${character.playerId ?? ''},
         ${character.name},
         ${character.dndbeyondId ?? null},
         ${character.dndbeyondUrl ?? null},
         ${character.race ?? ''},
         ${character.classType ?? ''},
         ${character.level ?? 1},
         ${jsonb(character.abilityScores ?? {})}::jsonb,
         ${jsonb(character.hitPoints ?? { current: 0, maximum: 0, temp: 0 })}::jsonb,
         ${character.armorClass ?? 10},
         ${character.speed ?? 30},
         ${character.proficiencyBonus ?? 2},
         ${jsonb(character.skills ?? {})}::jsonb,
         ${jsonb(character.spells)}::jsonb,
         ${character.backstory ?? null},
         ${jsonb(character.personalityTraits)}::jsonb,
         ${jsonb(character.inventory ?? [])}::jsonb,
         ${character.notes ?? ''},
         ${toIso(character.lastUpdated)}::timestamptz)
      on conflict (id) do update set
        player_id = excluded.player_id,
        name = excluded.name,
        dndbeyond_id = excluded.dndbeyond_id,
        dndbeyond_url = excluded.dndbeyond_url,
        race = excluded.race,
        class_type = excluded.class_type,
        level = excluded.level,
        ability_scores = excluded.ability_scores,
        hit_points = excluded.hit_points,
        armor_class = excluded.armor_class,
        speed = excluded.speed,
        proficiency_bonus = excluded.proficiency_bonus,
        skills = excluded.skills,
        spells = excluded.spells,
        backstory = excluded.backstory,
        personality_traits = excluded.personality_traits,
        inventory = excluded.inventory,
        notes = excluded.notes,
        last_updated = excluded.last_updated
    `;
  },

  async get(id: string): Promise<Character | null> {
    const sql = getDb();
    const rows = await sql`select * from characters where id = ${id} limit 1`;
    return rows.length ? rowToCharacter(rows[0] as unknown as CharacterRow) : null;
  },

  async getAll(): Promise<Character[]> {
    const sql = getDb();
    const rows = await sql`select * from characters order by name asc`;
    return (rows as unknown as CharacterRow[]).map(rowToCharacter);
  },

  async delete(id: string): Promise<void> {
    const sql = getDb();
    await sql`delete from characters where id = ${id}`;
  },
};

// ------------------------------------------------------------------
// sessions
// ------------------------------------------------------------------

interface SessionRow {
  id: string;
  campaign_id: string;
  session_number: number;
  title: string;
  date: string;
  duration: number | null;
  status: Session['status'];
  combat_log: Session['combatLog'] | null;
  narrative_log: Session['narrativeLog'];
  dice_rolls: Session['diceRolls'];
  recap: string | null;
  next_session_hook: string | null;
}

function rowToSession(r: SessionRow): Session {
  return {
    id: r.id,
    campaignId: r.campaign_id,
    sessionNumber: r.session_number,
    title: r.title,
    date: toDate(r.date),
    duration: r.duration ?? undefined,
    status: r.status,
    narrativeLog: r.narrative_log ?? [],
    combatLog: r.combat_log ?? undefined,
    diceRolls: r.dice_rolls ?? [],
    recap: r.recap ?? undefined,
    nextSessionHook: r.next_session_hook ?? undefined,
  };
}

export const sessionStorage = {
  async save(session: Session): Promise<void> {
    const sql = getDb();
    await sql`
      insert into sessions
        (id, owner_id, campaign_id, session_number, title, date, duration, status,
         combat_log, narrative_log, dice_rolls, recap, next_session_hook)
      values
        (${session.id},
         ${null},
         ${session.campaignId},
         ${session.sessionNumber ?? 1},
         ${session.title ?? ''},
         ${toIso(session.date)}::timestamptz,
         ${session.duration ?? null},
         ${session.status ?? 'planned'},
         ${jsonb(session.combatLog)}::jsonb,
         ${jsonb(session.narrativeLog ?? [])}::jsonb,
         ${jsonb(session.diceRolls ?? [])}::jsonb,
         ${session.recap ?? null},
         ${session.nextSessionHook ?? null})
      on conflict (id) do update set
        campaign_id = excluded.campaign_id,
        session_number = excluded.session_number,
        title = excluded.title,
        date = excluded.date,
        duration = excluded.duration,
        status = excluded.status,
        combat_log = excluded.combat_log,
        narrative_log = excluded.narrative_log,
        dice_rolls = excluded.dice_rolls,
        recap = excluded.recap,
        next_session_hook = excluded.next_session_hook
    `;
  },

  async get(id: string): Promise<Session | null> {
    const sql = getDb();
    const rows = await sql`select * from sessions where id = ${id} limit 1`;
    return rows.length ? rowToSession(rows[0] as unknown as SessionRow) : null;
  },

  async getAll(): Promise<Session[]> {
    const sql = getDb();
    const rows = await sql`select * from sessions order by date desc`;
    return (rows as unknown as SessionRow[]).map(rowToSession);
  },

  async getByCampaignId(campaignId: string): Promise<Session[]> {
    const sql = getDb();
    const rows = await sql`select * from sessions where campaign_id = ${campaignId} order by date desc`;
    return (rows as unknown as SessionRow[]).map(rowToSession);
  },

  async delete(id: string): Promise<void> {
    const sql = getDb();
    await sql`delete from sessions where id = ${id}`;
  },
};
