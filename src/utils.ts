import { BaseContract, EventLog, JsonRpcProvider, Log, ethers } from 'ethers';
import { COINGECKO_API_URL, COINGECKO_LYX_ID, COINGECKO_CURRENCY, RPC_PROVIDER, UNISWAPV2PAIR_ADDRESS, SLOTSIN7DAYS, SLYX_ADDRESS, WLYX_ADDRESS, CONSENSUS_API_URL } from './constants';
import uniswapV2PairABI from "./contracts/uniswapV2PairABI.json"
import sLYXABI from "./contracts/sLYXABI.json"
import Weth10ABI from "./contracts/Weth10ABI"

function connectToBlockchain():JsonRpcProvider {
  try {
    let provider = new JsonRpcProvider(RPC_PROVIDER);
    console.log("Successfully instantiated blockchain provider")
    return provider;
  } catch (error) {
    console.log("Unable to create Blockchain provider")
    throw new Error((error as any).message)
  }
}


function getPairContract(provider:JsonRpcProvider):BaseContract {
  return new ethers.BaseContract(UNISWAPV2PAIR_ADDRESS,
    uniswapV2PairABI.abi,
    provider
  );
}

function getSLYXContract(provider:JsonRpcProvider):BaseContract {
  return new ethers.BaseContract(SLYX_ADDRESS,
    sLYXABI.abi,
    provider
  );
}

function getWLYXContract(provider:JsonRpcProvider):BaseContract {
  return new ethers.BaseContract(WLYX_ADDRESS,
    Weth10ABI,
    provider
  );
}



export const fetchSLYXPrice = async(externalRequest?:boolean):Promise<number> => {
  if (!externalRequest) {
    console.warn("DEV MODE: Mock price is being set to 8")
    return 8
  }
  try { 
    return fetch(`${COINGECKO_API_URL}/simple/price?ids=${COINGECKO_LYX_ID}&vs_currencies=${COINGECKO_CURRENCY}`)
      .then(response => response.json())
      .then((data) => { 
        console.log(data);
        console.log("LYX price: " + data[COINGECKO_LYX_ID][COINGECKO_CURRENCY])
        return data[COINGECKO_LYX_ID][COINGECKO_CURRENCY];
      })
  } catch (error:any) {
    console.log(error)
    return 7.2
  }
}

export const fetchTVL = async() => {
  // THIS IS A SIMPLIFICATION OF THE TVL
  // To calculate the real TVL, one would have to consider the amounts
  // of both LYX and sLYX, convert to a common currency like dollar,
  // and sum the two.
  const provider = connectToBlockchain();
  const pairSLYX:bigint = await (getSLYXContract(provider) as any).balanceOf(getPairContract(provider).getAddress());
  const pairLYX:bigint = await (getWLYXContract(provider) as any).balanceOf(getPairContract(provider).getAddress());
  console.log("Total liquidity in the pool: " + ethers.formatUnits(pairSLYX + pairLYX, "ether") + " (sLYX + LYX)");
  return pairSLYX + pairLYX;
}


export const fetchSevenDayVolume = async():Promise<bigint> => {
  const provider = connectToBlockchain();
  var now:number;
  provider.getBlockNumber().then((result:number) => now = result);

  const pairContract = getPairContract(provider);
  
  var sevenDayVolume = BigInt(0);
  const trades = await pairContract.queryFilter("Swap(address,uint,uint,uint,uint,address)")
  console.log("Found "+trades.length+" total events.");
  let i = 0;
  trades.forEach((log: Log | EventLog) => {
    if (log.blockNumber > now - SLOTSIN7DAYS) {
        i++;
        sevenDayVolume += (log as EventLog).args[1]+(log as EventLog).args[2]; //either sLYX or LYX
    }
  })
  console.log(i + "events were counted for the sevenDayVolume")
  return sevenDayVolume;
}


export const sLYXToDollar = (sLYXAmount:bigint, price:number):number => {
  let result:number = Number(ethers.formatEther( ((sLYXAmount) * (BigInt(price*100000))) / (BigInt(100000))));
  return result;
}


export const calculateStakingRewards = function({
    slotTimeInSec = 12,
    slotsInEpoch = 32,
    baseRewardFactor = 64,
    totalAtStake = 1_000_000, // LYX
    averageNetworkPctOnline = 0.95,
    vaildatorUptime = 0.99,
    validatorDeposit = 32, // LYX
    effectiveBalanceIncrement = 1_000_000_000, // gwei
    weightDenominator = 64,
    proposerWeight = 8,
  }) {
    // Calculate number of epochs per year
    const avgSecInYear = 31556908.8; // 60 * 60 * 24 * 365.242
    const epochPerYear = avgSecInYear / (slotTimeInSec * slotsInEpoch);
    const baseRewardPerIncrement =
      (effectiveBalanceIncrement * baseRewardFactor) / (totalAtStake * 10e8) ** 0.5;
    // Calculate base reward for full validator (in gwei)
    const baseGweiRewardFullValidator =
      ((validatorDeposit * 10e8) / effectiveBalanceIncrement) * baseRewardPerIncrement;
    // Calculate offline per-validator penalty per epoch (in gwei)
    // Note: Inactivity penalty is not included in this simple calculation
    const offlineEpochGweiPentalty =
      baseGweiRewardFullValidator * ((weightDenominator - proposerWeight) / weightDenominator);
    
    // Calculate online per-validator reward per epoch (in gwei)
    const onlineEpochGweiReward = baseGweiRewardFullValidator * averageNetworkPctOnline;
    // Calculate net yearly staking reward (in gwei)
    const reward = onlineEpochGweiReward * vaildatorUptime;
    const penalty = offlineEpochGweiPentalty * (1 - vaildatorUptime);
    const netRewardPerYear = epochPerYear * (reward - penalty);
 
    // Return net yearly staking reward percentage
    return netRewardPerYear / 10e8 / validatorDeposit;
}


export const fetchTotalStaked = async() => {
  try {
    const response = await fetch(`${CONSENSUS_API_URL}/api/v1/epoch/latest`)
    const result = await response.json()
    return result.data.validatorscount * 32
  } catch (error) {
    console.log(error)
  }
};