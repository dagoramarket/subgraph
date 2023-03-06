import {
  BurnLockedStake,
  LockStake,
  StakeToken,
  UnlockStake,
  UnstakeToken,
} from "../generated/StakeManager/StakeManager";

import { Seller } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleStakeToken(event: StakeToken): void {
  let entity = Seller.load(event.params.sender.toHex());
  if (entity == null) {
    entity = new Seller(event.params.sender.toHex());
    entity.balance = BigInt.zero();
    entity.lockedTokens = BigInt.zero();
  }
  let balance = entity.balance.plus(event.params.value);
  entity.balance = balance;
  entity.save();
}

export function handleUnstakeToken(event: UnstakeToken): void {
  let entity = Seller.load(event.params.sender.toHex());
  if (entity == null) {
    return;
  }
  let balance = entity.balance.minus(event.params.value);
  entity.balance = balance;
  entity.save();
}

export function handleLockStake(event: LockStake): void {
  let entity = Seller.load(event.params.sender.toHex());
  if (entity == null) {
    return;
  }
  entity.lockedTokens = entity.lockedTokens.plus(event.params.value);
  entity.save();
}

export function handleUnlockStake(event: UnlockStake): void {
  let entity = Seller.load(event.params.sender.toHex());
  if (entity == null) {
    return;
  }
  entity.lockedTokens = entity.lockedTokens.minus(event.params.value);
  entity.save();
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
}
