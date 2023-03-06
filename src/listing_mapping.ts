import { BigInt } from "@graphprotocol/graph-ts";
import {
  ListingCancelled,
  ListingCreated,
  ListingReported,
  ListingReportResult,
  ListingUpdated,
} from "../generated/ListingManager/ListingManager";
import { Listing, Seller } from "../generated/schema";
import { parseIpfsListing } from "./listing/ipfs";

const ListingState_Active = "Active";
const ListingState_InDispute = "InDispute";
const ListingState_Cancelled = "Cancelled";
const ListingState_Malicious = "Malicious";

export function handleListingCreated(event: ListingCreated): void {
  let entity = Listing.load(event.params.hash.toHex());
  if (entity == null) {
    entity = new Listing(event.params.hash.toHex());
    entity.title = "";
    entity.description = "";
    entity.price = BigInt.fromI64(0);
    entity.tags = [];
  }
  let seller = Seller.load(event.params.seller.toHex());
  if (seller == null) {
    return;
  }

  entity.seller = seller.id;

  entity.expiresAt = event.params.expirationBlock;
  entity.quantity = event.params.quantity;

  entity.cashbackPercentage = event.params.cashbackPercentage;
  entity.commissionPercentage = event.params.commissionPercentage;
  entity.warranty = event.params.warranty;

  entity.ipfsHash = event.params.ipfs;
  entity.state = ListingState_Active;

  parseIpfsListing(entity);
}

export function handleListingCancelled(event: ListingCancelled): void {
  let entity = Listing.load(event.params.hash.toHex());
  if (entity == null) {
    return;
  }
  entity.state = ListingState_Cancelled;
}

const REPORT_CORRECT = BigInt.fromI32(1);

export function handleListingReportResult(event: ListingReportResult): void {
  let entity = Listing.load(event.params.hash.toHex());
  if (entity == null) {
    return;
  }
  if (event.params.result == REPORT_CORRECT) {
    entity.state = ListingState_Malicious;
  } else {
    entity.state = ListingState_Active;
  }
}

export function handleListingReported(event: ListingReported): void {
  let entity = Listing.load(event.params.hash.toHex());
  if (entity == null) {
    return;
  }
  entity.state = ListingState_InDispute;
}

export function handleListingUpdated(event: ListingUpdated): void {
  let entity = Listing.load(event.params.hash.toHex());
  if (entity == null) {
    return;
  }
  entity.quantity = event.params.quantity;
}
