import {
  BigInt,
  Bytes,
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
import { Listing, Seller } from "../generated/schema";

export function handleListingCreated(event: ListingCreated): void {
  let entity = Listing.load(event.params.hash.toHex());
  if (entity == null) {
    entity = new Listing(event.params.hash.toHex());
    entity.title = "";
    entity.description = "";
    entity.price = BigInt.fromI64(0);
    entity.sellerStake = BigInt.fromI64(0);
    entity.allowed_tokens = [];
    entity.categories = [];
    entity.tags = [];
  }
  let seller = Seller.load(event.params.seller.toHex());
  if (seller == null) {
    return;
  }
  entity.seller = seller.id;
  entity.sellerStake = seller.balance;

  entity.expiration = event.params.expiration;
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
        if (obj.isSet("allowed_tokens")) {
          let allowed_tokens = obj.get("allowed_tokens");
          if (allowed_tokens && !allowed_tokens.isNull()) {
            let rawArray = allowed_tokens.toArray();
            let tokens: Array<Bytes> = rawArray.map<Bytes>((value) => {
              return Bytes.fromByteArray(Bytes.fromHexString(value.toString()));
            });

            entity.allowed_tokens = tokens;
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
        if (obj.isSet("categories")) {
          let categories = obj.get("categories");
          if (categories && !categories.isNull()) {
            let rawArray = categories.toArray();
            let categoriesArray: Array<string> = rawArray.map<string>(
              (value) => {
                return value.toString();
              }
            );

            entity.categories = categoriesArray;
          }
        }
        if (obj.isSet("images")) {
          let images = obj.get("images");
          if (images && !images.isNull()) {
            let rawArray = images.toArray();
            let imagesArray: Array<string> = rawArray.map<string>((value) => {
              return value.toString();
            });

            entity.images = imagesArray;
          }
        }
      }
      
      entity.save();
      let listingArray = seller.listings;
      listingArray.push(entity.id);
      seller.listings = listingArray;
      seller.save();
      
    }
  }
}

function isObject(jsonData: JSONValue): boolean {
  return jsonData.kind === JSONValueKind.OBJECT;
}

export function handleListingCancelled(event: ListingCancelled): void {}

export function handleListingReportResult(event: ListingReportResult): void {}

export function handleListingReported(event: ListingReported): void {}

export function handleListingUpdated(event: ListingUpdated): void {}
