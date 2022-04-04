import {MoonbeamEvent} from '@subql/contract-processors/dist/moonbeam';
import {BigNumber} from "ethers";
import {Pool, Transaction} from "../types";

// Setup types from ABI
type EventArgs = [string, BigNumber, BigNumber] & { user: string; amount: BigNumber; pid: BigNumber; };

async function saveTransaction(event: MoonbeamEvent<EventArgs>, type: string): Promise<void> {
    let transaction = new Transaction(event.transactionHash);
    transaction.date = new Date(event.blockTimestamp);
    transaction.timestamp = BigInt(event.blockTimestamp.getTime());
    transaction.blockNumber = BigInt(event.blockNumber);
    transaction.wallet = event.args.user;
    transaction.action = type;
    transaction.amount = event.args.amount.toBigInt();
    transaction.poolId = event.args.pid.toString();
    await transaction.save();
}

export async function handleDepositEvent(event: MoonbeamEvent<EventArgs>): Promise<void> {
    const pid = event.args.pid;
    const amount = event.args.amount;

    let pool = await Pool.get(pid.toString());
    if (!pool) {
        pool = new Pool(pid.toString());
        pool.totalAmount = amount.toBigInt();
    } else {
        pool.totalAmount = pool.totalAmount + amount.toBigInt();
    }
    await pool.save();

    await saveTransaction(event, "deposit");
}

export async function handleWithdrawEvent(event: MoonbeamEvent<EventArgs>): Promise<void> {
    const pid = event.args.pid;
    const amount = event.args.amount;

    let pool = await Pool.get(pid.toString());
    pool.totalAmount = pool.totalAmount - amount.toBigInt();
    await pool.save();

    await saveTransaction(event, "withdraw");
}


