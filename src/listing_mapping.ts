import {
  BigInt,
  Bytes,
  Entity,
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
import {
  ActiveListing,
  Block,
  CanceledListing,
  ExpiredListing,
  InactiveListing,
  Seller,
} from "../generated/schema";
import { store } from "@graphprotocol/graph-ts";
import { getMinimumStake } from "./utils";
import { handleIpfsListing } from "./utils/ipfs";

export function handleBlock(block: ethereum.Block): void {
  let b = Block.load(block.number.toString());
  if (b == null) return;

  for (let i = 0; i < b.expiresAtListings.length; i++) {
    const listingId = b.expiresAtListings[i];
    const listing = ActiveListing.load(listingId);
    const expired = changetype<ExpiredListing>(listing);
    store.remove("ActiveListing", listingId);
    expired.save();
  }
  store.remove("Block", block.number.toString());
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
  entity.sellerStake = seller.balance.minus(seller.lockedTokens);

  entity.expirationBlock = event.params.expirationBlock.toString();
  entity.quantity = event.params.quantity;

  entity.cashbackPercentage = event.params.cashbackPercentage;
  entity.commissionPercentage = event.params.commissionPercentage;
  entity.warranty = event.params.warranty;

  entity.ipfsHash = event.params.ipfs;

  let ipfsImpl = handleIpfsListing(entity.ipfsHash);
  if (ipfsImpl) {
    entity.title = ipfsImpl.title;
    entity.description = ipfsImpl.description;
    entity.price = ipfsImpl.price;
    entity.allowedTokens = ipfsImpl.allowedTokens;
    entity.defaultToken = ipfsImpl.defaultToken;
    entity.tags = ipfsImpl.tags;
    entity.category = ipfsImpl.category;
    entity.media = ipfsImpl.media;
    entity.expirationBlock
  }
  if (entity.sellerStake.ge(getMinimumStake())) {
    const inactiveListing = changetype<InactiveListing>(entity);
    inactiveListing.save();
  } else {
    if (event.block.number.toI32() < event.params.expirationBlock.toI32()) {
      entity.save();

      let block = Block.load(entity.expirationBlock.toString());
      if (block == null) {
        block = new Block(entity.expirationBlock.toString());
        block.expiresAtListings = [];
      }
      const expiresAtListings = block.expiresAtListings;
      expiresAtListings.push(entity.id);
      block.expiresAtListings = expiresAtListings;
      block.save();
    } else {
      const expiredListing = changetype<ExpiredListing>(entity);
      expiredListing.save();
    }
  }
}

export function handleListingCancelled(event: ListingCancelled): void {
  let entity: Entity | null = ActiveListing.load(event.params.hash.toHex());
  let dataType = "ActiveListing";
  if (entity == null) {
    entity = InactiveListing.load(event.params.hash.toHex());
    dataType = "InactiveListing";
  }
  if (entity == null) return;
  const canceledListing = changetype<CanceledListing>(entity);
  canceledListing.save();
  store.remove(dataType, event.params.hash.toHex());
}

export function handleListingReportResult(event: ListingReportResult): void {}

export function handleListingReported(event: ListingReported): void {}

export function handleListingUpdated(event: ListingUpdated): void {}
