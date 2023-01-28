import {
  Address,
  BigInt,
  ByteArray,
  Bytes,
  ethereum,
} from "@graphprotocol/graph-ts";
import {
  describe,
  test,
  newMockEvent,
  mockIpfsFile,
  clearStore,
  assert,
  logStore,
} from "matchstick-as/assembly/index";
import { ListingCreated } from "../generated/ListingManager/ListingManager";
import { StakeToken } from "../generated/StakeManager/StakeManager";
import { crypto } from "@graphprotocol/graph-ts";
import { handleBlock, handleListingCreated } from "../src/listing_mapping";
import { handleStakeToken } from "../src/staking_mapping";
describe("handleListingCreated()", () => {
  test("Should create a new Listing Entity", () => {
    const ipfsHash = "listingHash";
    const hash = "0x1234";
    const seller = "0xdadAf92A21a266D0978a8F37dff962Af1C57e284";
    const blockNumber = 1234;
    const stakeToken = createStakeToken(seller, 10000);

    handleStakeToken(stakeToken);

    mockIpfsFile(ipfsHash, "tests/ipfs/listing.json");
    const listingCreated = createListingCreatedEvent(
      hash,
      seller,
      ipfsHash,
      blockNumber,
      100,
      100,
      7,
      1
    );
    handleListingCreated(listingCreated);


    const id = Bytes.fromByteArray(
      crypto.keccak256(ByteArray.fromUTF8(hash))
    ).toHex();

    assert.fieldEquals("ActiveListing", id, "ipfsHash", ipfsHash);
    assert.fieldEquals("ActiveListing", id, "title", "Playstation 4 completo");

    logStore();

    handleBlock(createBlock(blockNumber));

    assert.notInStore('ActiveListing', id);
    logStore();

    clearStore();
  });
});

export function createBlock(number: i32): ethereum.Block {
  let mockEvent = newMockEvent();
  const block = mockEvent.block;
  block.number = BigInt.fromI32(number);
  return block;
}

export function createStakeToken(sender: string, value: i32): StakeToken {
  let mockEvent = newMockEvent();
  let newStakeToken = new StakeToken(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    mockEvent.receipt
  );
  newStakeToken.parameters = new Array();
  let senderParam = new ethereum.EventParam(
    "sender",
    ethereum.Value.fromAddress(Address.fromString(sender))
  );
  let valueParam = new ethereum.EventParam(
    "value",
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(value))
  );
  newStakeToken.parameters.push(senderParam);
  newStakeToken.parameters.push(valueParam);

  return newStakeToken;
}

export function createListingCreatedEvent(
  hash: string,
  sellerAddress: string,
  ipfsUrl: string,
  expirationBlock: i32,
  commissionPercentage: i32,
  cashbackPercentage: i32,
  warranty: i32,
  quantity: i32
): ListingCreated {
  let mockEvent = newMockEvent();
  let newListingCreated = new ListingCreated(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    mockEvent.receipt
  );
  newListingCreated.parameters = new Array();
  let hashParam = new ethereum.EventParam(
    "hash",
    ethereum.Value.fromBytes(
      Bytes.fromByteArray(crypto.keccak256(ByteArray.fromUTF8(hash)))
    )
  );
  let sellerParam = new ethereum.EventParam(
    "seller",
    ethereum.Value.fromAddress(Address.fromString(sellerAddress))
  );
  let ipfsHashParam = new ethereum.EventParam(
    "ipfs",
    ethereum.Value.fromString(ipfsUrl)
  );
  let expirationBlockParam = new ethereum.EventParam(
    "expirationBlock",
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(expirationBlock))
  );
  let commissionPercentageParam = new ethereum.EventParam(
    "commissionPercentage",
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(commissionPercentage))
  );
  let cashbackPercentageParam = new ethereum.EventParam(
    "cashbackPercentage",
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(cashbackPercentage))
  );
  let warrantyParam = new ethereum.EventParam(
    "warranty",
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(warranty))
  );
  let quantityParam = new ethereum.EventParam(
    "quantity",
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(quantity))
  );
  newListingCreated.parameters.push(hashParam);
  newListingCreated.parameters.push(sellerParam);
  newListingCreated.parameters.push(ipfsHashParam);
  newListingCreated.parameters.push(expirationBlockParam);
  newListingCreated.parameters.push(commissionPercentageParam);
  newListingCreated.parameters.push(cashbackPercentageParam);
  newListingCreated.parameters.push(warrantyParam);
  newListingCreated.parameters.push(quantityParam);

  return newListingCreated;
}
