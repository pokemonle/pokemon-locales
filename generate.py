import os
import csv
import json
from contextlib import contextmanager


@contextmanager
def load_csv(filename: str):
    file_path = os.path.join(os.path.dirname(__file__), "data", f"{filename}.csv")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File {file_path} does not exist.")

    with open(file_path, mode="r") as f:
        yield csv.DictReader(f)


namespaces = [
    # abiility, generation, item, item_pocket, language, location, pokemon_specie
    # region, stat, type, version
    {"origin": "abilities", "local": "ability_names", "fk": "ability_id"},
    {"origin": "generations", "local": "generation_names", "fk": "generation_id"},
    {"origin": "items", "local": "item_names", "fk": "item_id"},
    {"origin": "item_pockets", "local": "item_pocket_names", "fk": "item_pocket_id"},
    {"origin": "languages", "local": "language_names", "fk": "language_id"},
    {"origin": "locations", "local": "location_names", "fk": "location_id"},
    {"origin": "pokemon_species", "local": "pokemon_species_names", "fk": "pokemon_species_id"},
    {"origin": "regions", "local": "region_names", "fk": "region_id"},
    {"origin": "stats", "local": "stat_names", "fk": "stat_id"},
    {"origin": "types", "local": "type_names", "fk": "type_id"},
    {"origin": "versions", "local": "version_names", "fk": "version_id"}
]

languages = {
    "ja": 1,
    "kr": 3,
    "zh-Hant": 4,
    "fr": 5,
    "de": 6,
    "es": 7,
    "it": 8,
    "en": 9,
    "cs": 10,
    "zh-Hans": 12
}


def generate_csv(origin: str, local: str, fk: str, lang: int):
    with load_csv(origin) as o, load_csv(local) as n:
        for row in o:
            id = row["id"]
            identifier = row["identifier"]
            name = next((x["name"] for x in n if x[fk] == id and x["local_language_id"] == str(lang)), None)

            yield {
                "id": id,
                "identifier": identifier,
                "name": name
            }


if __name__ == "__main__":
    for k, v in languages.items():
        for ns in namespaces:
            origin = ns["origin"]
            local = ns["local"]
            fk = ns["fk"]

            datas = generate_csv(origin, local, fk, v)

            dataMap = {d["identifier"]: d["name"] for d in datas if d["name"] is not None}

            with open(os.path.join(os.path.dirname(__file__), "locales", k, f"{origin}.json"), mode="w") as f:
                # write dataMap json to file
                jsonData = json.dumps(dataMap, ensure_ascii=False, indent=4)
                f.write(jsonData)
