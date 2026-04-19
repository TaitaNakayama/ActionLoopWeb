-- ============================================================
-- TrickDB Seed Data — Canonical Tricks & Aliases
-- ============================================================

-- Helper: normalize function (lowercase, trim, collapse spaces, strip punctuation)
create or replace function public.normalize_name(input text)
returns text as $$
begin
  return regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(trim(input)),
        '[-_]', ' ', 'g'
      ),
      '[^a-z0-9 ]', '', 'g'
    ),
    '\s+', ' ', 'g'
  );
end;
$$ language plpgsql immutable;

-- Helper: slugify function
create or replace function public.slugify(input text)
returns text as $$
begin
  return regexp_replace(
    regexp_replace(
      lower(trim(input)),
      '[^a-z0-9]+', '-', 'g'
    ),
    '^-|-$', '', 'g'
  );
end;
$$ language plpgsql immutable;

-- ============================================================
-- Tricks
-- ============================================================

insert into public.tricks (name, normalized_name, slug) values
  -- Kicks
  ('Tornado Kick', 'tornado kick', 'tornado-kick'),
  ('540 Kick', '540 kick', '540-kick'),
  ('720 Kick', '720 kick', '720-kick'),
  ('900 Kick', '900 kick', '900-kick'),
  ('Cheat 720', 'cheat 720', 'cheat-720'),
  ('Cheat 900', 'cheat 900', 'cheat-900'),
  ('Hook Kick', 'hook kick', 'hook-kick'),
  ('Round Kick', 'round kick', 'round-kick'),
  ('Crescent Kick', 'crescent kick', 'crescent-kick'),
  ('Wheel Kick', 'wheel kick', 'wheel-kick'),
  ('Axe Kick', 'axe kick', 'axe-kick'),
  ('Butterfly Kick', 'butterfly kick', 'butterfly-kick'),
  ('Butterfly Twist', 'butterfly twist', 'butterfly-twist'),
  ('Jackknife', 'jackknife', 'jackknife'),
  ('Swing 360', 'swing 360', 'swing-360'),
  ('Pop 360', 'pop 360', 'pop-360'),

  -- Flips
  ('Backflip', 'backflip', 'backflip'),
  ('Frontflip', 'frontflip', 'frontflip'),
  ('Sideflip', 'sideflip', 'sideflip'),
  ('Gainer', 'gainer', 'gainer'),
  ('Gainer Flash', 'gainer flash', 'gainer-flash'),
  ('Webster', 'webster', 'webster'),
  ('Loser', 'loser', 'loser'),
  ('Raiz', 'raiz', 'raiz'),
  ('Aerial', 'aerial', 'aerial'),
  ('Cartwheel', 'cartwheel', 'cartwheel'),
  ('Roundoff', 'roundoff', 'roundoff'),
  ('Back Handspring', 'back handspring', 'back-handspring'),
  ('Front Handspring', 'front handspring', 'front-handspring'),
  ('Macaco', 'macaco', 'macaco'),

  -- Twists
  ('Full Twist', 'full twist', 'full-twist'),
  ('Double Full', 'double full', 'double-full'),
  ('Triple Full', 'triple full', 'triple-full'),
  ('Cork', 'cork', 'cork'),
  ('Double Cork', 'double cork', 'double-cork'),
  ('Triple Cork', 'triple cork', 'triple-cork'),
  ('Gainer Full', 'gainer full', 'gainer-full'),
  ('Gainer Double Full', 'gainer double full', 'gainer-double-full'),
  ('Arabian', 'arabian', 'arabian'),
  ('Arabian Double Full', 'arabian double full', 'arabian-double-full'),

  -- Advanced
  ('Snapuswipe', 'snapuswipe', 'snapuswipe'),
  ('Cheat Gainer', 'cheat gainer', 'cheat-gainer'),
  ('Wrap Full', 'wrap full', 'wrap-full'),
  ('Gyroknife', 'gyroknife', 'gyroknife'),
  ('Boxcutter', 'boxcutter', 'boxcutter'),
  ('Masterswipe', 'masterswipe', 'masterswipe'),
  ('Envergado', 'envergado', 'envergado'),
  ('TD Raiz', 'td raiz', 'td-raiz'),

  -- Groundwork
  ('Kip Up', 'kip up', 'kip-up'),
  ('Windmill', 'windmill', 'windmill'),
  ('Swipe', 'swipe', 'swipe'),
  ('Thomas Flair', 'thomas flair', 'thomas-flair'),
  ('Headspin', 'headspin', 'headspin')
on conflict (slug) do nothing;

-- ============================================================
-- Aliases
-- ============================================================

insert into public.trick_aliases (trick_id, alias, normalized_alias)
select t.id, a.alias, a.normalized_alias
from (values
  -- 540 Kick aliases
  ('540-kick', '540', '540'),
  ('540-kick', 'Five-Forty', 'five forty'),

  -- 720 Kick aliases
  ('720-kick', '720', '720'),
  ('720-kick', 'Seven-Twenty', 'seven twenty'),

  -- 900 Kick aliases
  ('900-kick', '900', '900'),

  -- Butterfly Kick aliases
  ('butterfly-kick', 'B-Kick', 'b kick'),
  ('butterfly-kick', 'BKick', 'bkick'),

  -- Butterfly Twist aliases
  ('butterfly-twist', 'B-Twist', 'b twist'),
  ('butterfly-twist', 'BTwist', 'btwist'),

  -- Cork aliases
  ('cork', 'Corkscrew', 'corkscrew'),

  -- Double Cork aliases
  ('double-cork', 'Dub Cork', 'dub cork'),
  ('double-cork', 'Double Corkscrew', 'double corkscrew'),

  -- Triple Cork aliases
  ('triple-cork', 'Trip Cork', 'trip cork'),
  ('triple-cork', 'Triple Corkscrew', 'triple corkscrew'),

  -- Full Twist aliases
  ('full-twist', 'Full', 'full'),
  ('full-twist', 'Back Full', 'back full'),

  -- Double Full aliases
  ('double-full', 'Dub Full', 'dub full'),
  ('double-full', 'Double', 'double'),

  -- Triple Full aliases
  ('triple-full', 'Trip Full', 'trip full'),
  ('triple-full', 'Triple', 'triple'),

  -- Backflip aliases
  ('backflip', 'Back Tuck', 'back tuck'),
  ('backflip', 'Backtuck', 'backtuck'),
  ('backflip', 'Standing Back', 'standing back'),

  -- Frontflip aliases
  ('frontflip', 'Front Tuck', 'front tuck'),
  ('frontflip', 'Fronttuck', 'fronttuck'),

  -- Sideflip aliases
  ('sideflip', 'Side Tuck', 'side tuck'),

  -- Gainer aliases
  ('gainer', 'Gainer Tuck', 'gainer tuck'),
  ('gainer', 'Gainer Back', 'gainer back'),

  -- Aerial aliases
  ('aerial', 'No-Handed Cartwheel', 'no handed cartwheel'),
  ('aerial', 'Free Cartwheel', 'free cartwheel'),
  ('aerial', 'Au Sem Mao', 'au sem mao'),

  -- Raiz aliases
  ('raiz', 'Raíz', 'raiz'),

  -- Macaco aliases
  ('macaco', 'Macaco Em Pe', 'macaco em pe'),
  ('macaco', 'Back Walkover', 'back walkover'),

  -- Tornado Kick aliases
  ('tornado-kick', 'Tornado', 'tornado'),
  ('tornado-kick', '360 Round Kick', '360 round kick'),
  ('tornado-kick', '360 Kick', '360 kick'),

  -- Gainer Flash aliases
  ('gainer-flash', 'Flash Kick', 'flash kick'),
  ('gainer-flash', 'Flash', 'flash'),

  -- Kip Up aliases
  ('kip-up', 'Kip-Up', 'kip up'),
  ('kip-up', 'Kipup', 'kipup'),

  -- Swipe aliases
  ('swipe', 'Valdez', 'valdez'),

  -- Cheat 720 aliases
  ('cheat-720', 'C720', 'c720'),

  -- Cheat 900 aliases
  ('cheat-900', 'C900', 'c900'),

  -- Pop 360 aliases
  ('pop-360', 'Pop 3', 'pop 3'),

  -- Swing 360 aliases
  ('swing-360', 'Swing 3', 'swing 3'),

  -- Hook Kick aliases
  ('hook-kick', 'Hooking Kick', 'hooking kick'),

  -- Arabian aliases
  ('arabian', 'Arab', 'arab'),
  ('arabian', 'Half-In', 'half in'),

  -- Webster aliases
  ('webster', 'Front Gainer', 'front gainer'),

  -- Roundoff aliases
  ('roundoff', 'Round Off', 'round off'),

  -- Masterswipe aliases
  ('masterswipe', 'Master Swipe', 'master swipe'),

  -- TD Raiz aliases
  ('td-raiz', 'Touchdown Raiz', 'touchdown raiz')
) as a(trick_slug, alias, normalized_alias)
join public.tricks t on t.slug = a.trick_slug
on conflict (normalized_alias) do nothing;
