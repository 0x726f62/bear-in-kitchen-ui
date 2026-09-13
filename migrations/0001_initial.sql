PRAGMA foreign_keys = ON;

CREATE TABLE ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE
);

CREATE TABLE ingredient_aliases (
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL UNIQUE,
  PRIMARY KEY (ingredient_id, normalized_alias)
);

CREATE TABLE recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  draft INTEGER NOT NULL DEFAULT 1 CHECK (draft IN (0, 1)),
  category TEXT NOT NULL,
  published TEXT NOT NULL,
  image_key TEXT,
  image_alt TEXT NOT NULL,
  serves INTEGER NOT NULL CHECK (serves > 0),
  minutes INTEGER NOT NULL CHECK (minutes > 0),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Snadné', 'Střední', 'Náročné'))
);

CREATE TABLE recipe_ingredients (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
  display_name TEXT NOT NULL,
  quantity REAL,
  unit TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (recipe_id, position)
);

CREATE INDEX recipe_ingredients_by_ingredient ON recipe_ingredients(ingredient_id, recipe_id);

CREATE TABLE recipe_steps (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  content TEXT NOT NULL,
  tip INTEGER NOT NULL DEFAULT 0 CHECK (tip IN (0, 1)),
  image_key TEXT,
  image_alt TEXT,
  PRIMARY KEY (recipe_id, position)
);

CREATE TABLE recipe_tags (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (recipe_id, tag)
);

CREATE INDEX recipe_tags_by_tag ON recipe_tags(tag, recipe_id);
