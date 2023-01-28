import {
  BigInt,
  Bytes,
  ipfs,
  json,
  JSONValue,
  JSONValueKind,
  TypedMap,
} from "@graphprotocol/graph-ts";

export function handleIpfsListing(
  ipfsHash: string
): IpfsListingInterface | null {
  let data = ipfs.cat(ipfsHash);
  if (data) {
    let result = json.try_fromBytes(data);
    if (result.isOk) {
      if (isObject(result.value)) {
        let obj = result.value.toObject();

        const version = obj.get("version")!.toI64();
        switch (version) {
          case 1:
            return new IpfsListingV1(obj);
          default:
            return null;
        }
      }
    }
  }
  return null;
}

function isObject(jsonData: JSONValue): boolean {
  return jsonData.kind === JSONValueKind.OBJECT;
}

export interface IpfsListingInterface {
  title: string;
  description: string;
  price: BigInt;

  defaultToken: Bytes;
  allowedTokens: Array<Bytes>;
  tags: Array<string>;
  tagSearch: string;

  category: string;
  media: Array<string>;
}

export class IpfsListingV1 implements IpfsListingInterface {
  private obj: TypedMap<string, JSONValue>;

  constructor(obj: TypedMap<string, JSONValue>) {
    this.obj = obj;
  }

  get title(): string {
    return this.obj.get("title")!.toString();
  }

  get description(): string {
    return this.obj.get("description")!.toString();
  }

  get price(): BigInt {
    return BigInt.fromString(this.obj.get("price")!.toString());
  }

  get allowedTokens(): Array<Bytes> {
    const rawArray = this.obj.get("allowedTokens")!.toArray();
    return rawArray.map<Bytes>((value) => {
      return Bytes.fromByteArray(Bytes.fromHexString(value.toString()));
    });
  }

  get defaultToken(): Bytes {
    return this.allowedTokens[0];
  }

  get tags(): Array<string> {
    const rawArray = this.obj.get("tags")!.toArray();
    return rawArray.map<string>((value) => {
      return value.toString();
    });
  }

  get tagSearch(): string {
    return this.tags.toString();
  }

  get category(): string {
    return this.obj.get("category")!.toString();
  }

  get media(): Array<string> {
    const rawArray = this.obj.get("media")!.toArray();
    return rawArray.map<string>((value) => {
      return value.toString();
    });
  }
}
