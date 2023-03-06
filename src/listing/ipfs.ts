import {
  Bytes,
  ipfs,
  json,
  JSONValue,
  JSONValueKind,
  TypedMap,
} from "@graphprotocol/graph-ts";
import { Listing } from "../../generated/schema";

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

  const version = obj.mustGet("version").toI64();

  switch (version) {
    case 1:
      parseIpfsListingV1(obj, entity);
      break;
    default:
      throw new Error("Unsupported IPFS listing version");
  }
}

function parseIpfsListingV1(
  obj: TypedMap<string, JSONValue>,
  entity: Listing
): void {
  entity.title = obj.mustGet("title").toString();
  entity.description = obj.mustGet("description").toString();
  entity.price = obj.mustGet("price").toBigInt();
  entity.token = Bytes.fromHexString(
    obj
      .mustGet("token")
      .toString()
      .toString()
  );

  entity.tags = getArray(obj, "tags");
  entity.tagSearch = entity.tags.toString();

  entity.category = obj.mustGet("category").toString();
  entity.media = getArray(obj, "media");

  entity.save();
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
