import {
  BurnLockedStake,
  LockStake,
  StakeToken,
  UnlockStake,
  UnstakeToken,
} from "../generated/StakeManager/StakeManager";

import {
  ActiveListing,
  InactiveListing,
  Seller,
} from "../generated/schema";
import { BigInt, log, store } from "@graphprotocol/graph-ts";
import { getMinimumStake } from "./utils";

export function handleStakeToken(event: StakeToken): void {
  let entity = Seller.load(event.params.sender.toHex());
  if (entity == null) {
    entity = new Seller(event.params.sender.toHex());
    entity.balance = BigInt.zero();
    entity.lockedTokens = BigInt.zero();
    entity.activeListings = [];
    entity.inactiveListings = [];
  }
  let balance = entity.balance.plus(event.params.value);
  entity.balance = balance;
  entity.save();
  updateSellerListings(entity.id);
}

export function handleUnstakeToken(event: UnstakeToken): void {
  let entity = Seller.load(event.params.sender.toHex());
  if (entity == null) {
    return;
  }
  let balance = entity.balance.minus(event.params.value);
  entity.balance = balance;
  entity.save();

  updateSellerListings(entity.id);
}

export function handleLockStake(event: LockStake): void {
  let entity = Seller.load(event.params.sender.toHex());
  if (entity == null) {
    return;
  }
  entity.lockedTokens = entity.lockedTokens.plus(event.params.value);
  entity.save();

  updateSellerListings(entity.id);
}

export function handleUnlockStake(event: UnlockStake): void {
  let entity = Seller.load(event.params.sender.toHex());
  if (entity == null) {
    return;
  }
  entity.lockedTokens = entity.lockedTokens.minus(event.params.value);
  entity.save();

  updateSellerListings(entity.id);
}

export function handleBurnLockedStake(event: BurnLockedStake): void {
  let entity = Seller.load(event.params.sender.toHex());
  if (entity == null) {
    return;
  }
  let balance = entity.balance.minus(event.params.value);
  entity.lockedTokens = entity.lockedTokens.minus(event.params.value);
  entity.balance = balance;
  entity.save();

  updateSellerListings(entity.id);
}

function updateSellerListings(sellerAddress: string): void {
  let seller = Seller.load(sellerAddress);
  if (seller == null) return;
  const validStake = seller.balance.minus(seller.lockedTokens);
  const minimumStake = getMinimumStake();
  if (validStake.ge(minimumStake)) {
    for (let listingId in seller.activeListings) {
      const activeListing = ActiveListing.load(listingId);
      if (activeListing == null) continue;
      if (activeListing.sellerStake != validStake)
        activeListing.sellerStake = validStake;
      activeListing.save();
    }
    for (let listingId in seller.inactiveListings) {
      const inactiveListing = InactiveListing.load(listingId);
      if (inactiveListing == null) continue;
      if (inactiveListing.sellerStake != validStake)
        inactiveListing.sellerStake = validStake;
      const activeListing = changetype<ActiveListing>(inactiveListing);
      store.remove("InactiveListing", listingId);
      activeListing.save();
    }
  } else {
    for (let listingId in seller.activeListings) {
      const activeListing = ActiveListing.load(listingId);
      if (activeListing == null) continue;
      const inactiveListing = changetype<InactiveListing>(activeListing);
      store.remove("ActiveListing", listingId);
      inactiveListing.save();
    }
  }
}