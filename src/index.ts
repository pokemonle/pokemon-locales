import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { fileURLToPath } from "url";
import { namespaces } from "./namespace.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  description?: string;
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
        description: localRow ? localRow.description : undefined,
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
      const { origin, local, fk, render } = ns;

      try {
        console.log(`  Processing namespace: ${origin}`);
        const data = await generateData(origin, local, fk, langId);

        // Filter out items with null names and create a map
        const dataMap = data
          .filter((d) => d.name !== null)
          .reduce<Record<string, string>>((map, d) => {
            let result = render ? render(d) : d.name;
            if (result !== null) {
              map[d.identifier] = result;
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
