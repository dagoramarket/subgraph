import { BigInt } from "@graphprotocol/graph-ts";
import { Configuration } from "../../generated/schema";

export function getMinimumStake(): BigInt {
    let config = Configuration.load("0");
    if (config == null) {
      config = new Configuration("0");
      config.minimumStake = BigInt.fromI32(100000000);
      config.save();
    }
    return config.minimumStake;
  }
  