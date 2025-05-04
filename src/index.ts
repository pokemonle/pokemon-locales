import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Namespace {
  origin: string;
  local: string;
  fk: string;
}

interface Language {
  [key: string]: number;
}

interface OriginRow {
  id: string;
  identifier: string;
  [key: string]: string;
}

interface LocalRow {
  [key: string]: string;
  name: string;
  local_language_id: string;
}

interface ProcessedData {
  id: string;
  identifier: string;
  name: string | null;
}

const loadCSV = <T>(filename: string): Promise<T[]> => {
  const filePath = path.join(__dirname, "..", "data", `${filename}.csv`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File ${filePath} does not exist.`);
  }

  return new Promise<T[]>((resolve, reject) => {
    const results: T[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data: T) => results.push(data))
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error: Error) => {
        reject(error);
      });
  });
};

// Define our namespaces
const namespaces: Namespace[] = [
  // ability, generation, item, item_pocket, language, location, pokemon_specie
  // region, stat, type, version, pokemon_color
  { origin: "abilities", local: "ability_names", fk: "ability_id" },
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
];

const languages: Language = {
  ja: 1,
  kr: 3,
  "zh-Hant": 4,
  fr: 5,
  de: 6,
  es: 7,
  it: 8,
  en: 9,
  cs: 10,
  "zh-Hans": 12,
};

/**
 * Generate data by joining origin and localization tables
 * @param origin - Origin table name
 * @param local - Local table name
 * @param fk - Foreign key name
 * @param lang - Language ID
 * @returns Promise resolving to processed data
 */
async function generateData(
  origin: string,
  local: string,
  fk: string,
  lang: number
): Promise<ProcessedData[]> {
  try {
    const originData = await loadCSV<OriginRow>(origin);
    const localData = await loadCSV<LocalRow>(local);

    return originData.map((row) => {
      const id = row.id;
      const identifier = row.identifier;
      const localRow = localData.find(
        (x) => x[fk] === id && x.local_language_id === String(lang)
      );
      const name = localRow ? localRow.name : null;

      return {
        id,
        identifier,
        name,
      };
    });
  } catch (err) {
    console.error(`Error processing ${origin} and ${local}:`, err);
    return [];
  }
}

/**
 * Ensure directory exists
 * @param dirPath - Directory path to ensure
 */
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Main function to generate all locale files
 */
export async function generateLocaleFiles(): Promise<void> {
  console.log("Starting localization file generation...");

  for (const [langCode, langId] of Object.entries(languages)) {
    console.log(`Processing language: ${langCode}`);

    for (const ns of namespaces) {
      const { origin, local, fk } = ns;

      try {
        console.log(`  Processing namespace: ${origin}`);
        const data = await generateData(origin, local, fk, langId);

        // Filter out items with null names and create a map
        const dataMap = data
          .filter((d) => d.name !== null)
          .reduce<Record<string, string>>((map, d) => {
            if (d.name !== null) {
              map[d.identifier] = d.name;
            }
            return map;
          }, {});

        // Create directory if it doesn't exist
        const localeDir = path.join(__dirname, "..", "dist", langCode);
        ensureDirectoryExists(localeDir);

        // Write JSON file
        const filePath = path.join(localeDir, `${origin}.json`);
        fs.writeFileSync(filePath, JSON.stringify(dataMap, null, 4), {
          encoding: "utf8",
        });

        console.log(`  ✓ Created ${filePath}`);
      } catch (err) {
        console.error(`  ✗ Error with ${origin}:`, err);
      }
    }
  }

  console.log("Localization generation complete!");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await generateLocaleFiles();
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
}
