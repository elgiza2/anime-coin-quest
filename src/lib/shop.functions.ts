import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { commentPayload, findPack, paymentComment, toNano, TREASURY_ADDRESS } from "./shop-model";
import { authPlayer } from "./tasks.functions";

const authInput = z.object({ initData: z.string().min(10).max(4096) });

/** Creates a pending TON purchase and returns what the wallet must send. */
export const createTonPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => authInput.extend({ pack: z.string().max(20) }).parse(d))
  .handler(async ({ data }) => {
    const pack = findPack(data.pack);
    if (!pack) throw new Error("bad_pack");
    const { user, db } = await authPlayer(data.initData);
    const { data: row, error } = await db
      .from("wall_payments")
      .insert({ tg_id: user.id, pack: pack.id, amount_nano: Number(toNano(pack.ton)), coins: pack.coins })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return {
      id: row.id,
      address: TREASURY_ADDRESS,
      amount: toNano(pack.ton).toString(),
      payload: commentPayload(paymentComment(row.id)),
    };
  });

type TcTx = {
  hash: string;
  in_msg?: { value?: string; message_content?: { decoded?: { comment?: string } | null } };
};

/** Looks for the payment on-chain (by its comment) and credits coins once. */
export const checkTonPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => authInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { user, db } = await authPlayer(data.initData);
    const { data: p, error } = await db.from("wall_payments").select("*").eq("id", data.id).eq("tg_id", user.id).single();
    if (error || !p) throw new Error("no_payment");
    if (p.status === "paid") return { coins: 0, paid: true };

    const url = `https://toncenter.com/api/v3/transactions?account=${TREASURY_ADDRESS}&limit=100&sort=desc`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      console.error(`toncenter ${res.status}: ${await res.text()}`);
      throw new Error("not_found_yet");
    }
    const json = (await res.json()) as { transactions?: TcTx[] };
    const comment = paymentComment(p.id);
    const tx = (json.transactions ?? []).find(
      (t) => t.in_msg?.message_content?.decoded?.comment === comment && BigInt(t.in_msg?.value ?? "0") >= BigInt(p.amount_nano),
    );
    if (!tx) throw new Error("not_found_yet");
    const { data: coins, error: e2 } = await db.rpc("wall_confirm_payment", { _id: p.id, _tx: tx.hash } as never);
    if (e2) throw new Error(e2.message);
    return { coins: Number(coins), paid: true };
  });

export const claimAdReward = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => authInput.parse(d))
  .handler(async ({ data }) => {
    const { user, db } = await authPlayer(data.initData);
    const { data: amt, error } = await db.rpc("wall_ad_reward", { _tg: user.id } as never);
    if (error) throw new Error(error.message);
    return { amount: Number(amt) };
  });
