export interface Namespace {
  origin: string;
  local: string;
  fk: string;
  render?: (row: any) => any;
}

export // Define our namespaces
const namespaces: Namespace[] = [
  // ability, generation, item, item_pocket, language, location, pokemon_specie
  // region, stat, type, version, pokemon_color
  { origin: "abilities", local: "ability_names", fk: "ability_id" },
  {
    origin: "berry_firmnesses",
    local: "berry_firmness_names",
    fk: "firmness_id",
  },
  { origin: "generations", local: "generation_names", fk: "generation_id" },
  { origin: "items", local: "item_names", fk: "item_id" },
  { origin: "item_pockets", local: "item_pocket_names", fk: "item_pocket_id" },
  { origin: "languages", local: "language_names", fk: "language_id" },
  { origin: "locations", local: "location_names", fk: "location_id" },
  {
    origin: "pokemon_species",
    local: "pokemon_species_names",
    fk: "pokemon_species_id",
  },
  { origin: "regions", local: "region_names", fk: "region_id" },
  { origin: "stats", local: "stat_names", fk: "stat_id" },
  { origin: "types", local: "type_names", fk: "type_id" },
  { origin: "versions", local: "version_names", fk: "version_id" },
  {
    origin: "pokemon_colors",
    local: "pokemon_color_names",
    fk: "pokemon_color_id",
  },
  { origin: "egg_groups", local: "egg_group_prose", fk: "egg_group_id" },
  {
    origin: "evolution_triggers",
    local: "evolution_trigger_prose",
    fk: "evolution_trigger_id",
  },
  {
    origin: "pokedexes",
    local: "pokedex_prose",
    fk: "pokedex_id",
    render: (row) => {
      return {
        name: row.name,
        description: row.description,
      };
    },
  },
];
