import {
  BigInt,
  Bytes,
  ethereum,
  json,
  JSONValue,
  JSONValueKind,
  log,
} from "@graphprotocol/graph-ts";
import { ipfs } from "@graphprotocol/graph-ts";
import {
  ListingCancelled,
  ListingCreated,
  ListingReportResult,
  ListingReported,
  ListingUpdated,
} from "../generated/ListingManager/ListingManager";
import { ActiveListing, Block, Seller } from "../generated/schema";
import { store } from "@graphprotocol/graph-ts";

export function handleBlock(block: ethereum.Block) {
  let b = Block.load(block.number.toString());
  if (b == null) return;

  for (let i = 0; i < b.expiresAtListings.length; i++) {
    const listing = b.expiresAtListings[i];
    store.remove("ActiveListing", listing);
  }
}

export function handleListingCreated(event: ListingCreated): void {
  let entity = ActiveListing.load(event.params.hash.toHex());
  if (entity == null) {
    entity = new ActiveListing(event.params.hash.toHex());
    entity.title = "";
    entity.description = "";
    entity.price = BigInt.fromI64(0);
    entity.sellerStake = BigInt.fromI64(0);
    entity.allowedTokens = [];
    entity.category = "";
    entity.tags = [];
  }
  let seller = Seller.load(event.params.seller.toHex());
  if (seller == null) {
    return;
  }

  entity.seller = seller.id;
  entity.sellerStake = seller.balance;

  entity.expirationBlock = event.params.expirationBlock;
  entity.quantity = event.params.quantity;

  entity.cashbackPercentage = event.params.cashbackPercentage;
  entity.commissionPercentage = event.params.commissionPercentage;
  entity.warranty = event.params.warranty;

  entity.ipfsHash = event.params.ipfs;

  let data = ipfs.cat(entity.ipfsHash);
  if (data) {
    let result = json.try_fromBytes(data);
    if (result.isOk) {
      if (isObject(result.value)) {
        let obj = result.value.toObject();

        if (obj.isSet("title")) {
          let title = obj.get("title");
          if (title) {
            entity.title = title.toString();
          }
        }
        if (obj.isSet("description")) {
          let description = obj.get("description");
          if (description) {
            entity.description = description.toString();
          }
        }
        if (obj.isSet("price")) {
          let price = obj.get("price");
          if (price) {
            entity.price = BigInt.fromString(price.toString());
          }
        }
        if (obj.isSet("allowedTokens")) {
          let allowedTokens = obj.get("allowedTokens");
          if (allowedTokens && !allowedTokens.isNull()) {
            let rawArray = allowedTokens.toArray();
            let tokens: Array<Bytes> = rawArray.map<Bytes>((value) => {
              return Bytes.fromByteArray(Bytes.fromHexString(value.toString()));
            });

            entity.allowedTokens = tokens;
          }
        }
        if (obj.isSet("tags")) {
          let tags = obj.get("tags");
          if (tags && !tags.isNull()) {
            let rawArray = tags.toArray();
            let tagArray: Array<string> = rawArray.map<string>((value) => {
              return value.toString();
            });

            entity.tags = tagArray;
            entity.tagSearch = tagArray.toString();
          }
        }
        if (obj.isSet("category")) {
          let category = obj.get("category");
          if (category) {
            entity.category = category.toString();
          }
        }
        if (obj.isSet("media")) {
          let media = obj.get("media");
          if (media && !media.isNull()) {
            let rawArray = media.toArray();
            let mediaArray: Array<string> = rawArray.map<string>((value) => {
              return value.toString();
            });

            entity.media = mediaArray;
          }
        }
      }

      entity.save();
      let listingArray = seller.activeListings;
      listingArray.push(entity.id);
      seller.activeListings = listingArray;
      seller.save();
      let block = Block.load(entity.expirationBlock.toString());
      if (block == null) {
        block = new Block(entity.expirationBlock.toString());
        block.expiresAtListings = [];
      }
      const expiresAtListings = block.expiresAtListings;
      expiresAtListings.push(entity.id);
      block.expiresAtListings = expiresAtListings;
      block.save();
    }
  }
}

function isObject(jsonData: JSONValue): boolean {
  return jsonData.kind === JSONValueKind.OBJECT;
}

export function handleListingCancelled(event: ListingCancelled): void {
  store.remove("ActiveListing", event.params.hash.toHex());
}

export function handleListingReportResult(event: ListingReportResult): void {}

export function handleListingReported(event: ListingReported): void {}

export function handleListingUpdated(event: ListingUpdated): void {}
