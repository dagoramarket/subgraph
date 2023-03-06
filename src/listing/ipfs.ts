import {
  BigInt,
  Bytes,
  ipfs,
  json,
  JSONValue,
  JSONValueKind,
  log,
  TypedMap,
} from "@graphprotocol/graph-ts";
import { Category, Listing, ListingCategory } from "../../generated/schema";

export function parseIpfsListing(entity: Listing): void {
  let data = ipfs.cat(entity.ipfsHash);

  if (!data) {
    throw new Error("Failed to fetch IPFS listing");
  }

  let result = json.try_fromBytes(data);

  if (!result.isOk || !isObject(result.value)) {
    throw new Error("Failed to parse IPFS listing to JSON");
  }

  let obj = result.value.toObject();

  const version = obj
    .mustGet("version")
    .toBigInt()
    .toI32();

  switch (version) {
    case 2:
      parseIpfsListingV2(obj, entity);
      break;
    default:
      throw new Error("Unsupported IPFS listing version");
  }
}

function parseIpfsListingV2(
  obj: TypedMap<string, JSONValue>,
  entity: Listing
): void {
  entity.title = obj.mustGet("title").toString();
  entity.description = obj.mustGet("description").toString();
  entity.price = BigInt.fromString(obj.mustGet("price").toString());
  entity.token = Bytes.fromHexString(
    obj
      .mustGet("token")
      .toString()
      .toString()
  );

  entity.tags = getArray(obj, "tags");
  entity.tagSearch = entity.tags.toString();

  const categories = getArray(obj, "categories");
  createCategoryRelation(categories, entity);
  entity.media = getArray(obj, "media");

  entity.save();
}

function createCategoryRelation(
  categories: Array<string>,
  listing: Listing
): void {
  for (let i = 0; i < categories.length; i++) {
    const category = createCategoryIfNotExists(categories[i]);

    const id = listing.id.concat(category.id);
    let categoryEntity = ListingCategory.load(id);
    if (categoryEntity == null) {
      categoryEntity = new ListingCategory(id);
    }

    categoryEntity.category = category.id;
    categoryEntity.listing = listing.id;
    categoryEntity.seller = listing.seller;
    categoryEntity.save();
  }
}

function createCategoryIfNotExists(category: string): Category {
  let categoryEntity = Category.load(category);
  if (categoryEntity == null) {
    categoryEntity = new Category(category);
    categoryEntity.save();
  }
  return categoryEntity;
}

function getArray(
  jsonData: TypedMap<string, JSONValue>,
  key: string
): Array<string> {
  let value = jsonData.mustGet(key);
  if (value.kind !== JSONValueKind.ARRAY) {
    throw new Error("Expected array");
  }
  let toStringMap: Array<string> = value.toArray().map<string>((value) => {
    return value.toString();
  });
  return toStringMap;
}

function isObject(jsonData: JSONValue): boolean {
  return jsonData.kind === JSONValueKind.OBJECT;
}
