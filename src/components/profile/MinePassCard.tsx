import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AnimatedEmoji } from "@/components/emoji/AnimatedEmoji";
import { getMinePass } from "@/lib/mine-pass.functions";
import { MINE_PASS_TON } from "@/lib/mine-pass-model";
import { createTonPayment, checkTonPayment } from "@/lib/shop.functions";
import { shopErrorMessage } from "@/lib/shop-model";
import { getTonConnect } from "@/lib/ton-connect";

export function VerifiedBadge() {
  return <span aria-label="حساب موثق" title="حساب موثق بتصريح التعدين" className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-success bg-success/15 text-sm font-bold text-success">✓</span>;
}

export function MinePassCard({ initData }: { initData: string }) {
  const qc = useQueryClient();
  const fetchFn = useServerFn(getMinePass);
  const createFn = useServerFn(createTonPayment);
  const checkFn = useServerFn(checkTonPayment);
  const [busy, setBusy] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const status = useQuery({ queryKey: ["wall-mine-pass", initData], queryFn: () => fetchFn({ data: { initData } }), enabled: !!initData });
  const pass = status.data?.pass;
  const pendingId = paymentId ?? status.data?.pendingId;
  async function confirm(id: string) {
    const result = await checkFn({ data: { initData, id } });
    if (result.paid) {
      await Promise.all(["wall-mine-pass", "wall-heroes", "wall-profile", "wall-board"].map((key) => qc.invalidateQueries({ queryKey: [key] })));
      setPaymentId(null);
      toast.success("تم توثيق حسابك وتفعيل التعدين");
    }
  }
  async function check() {
    if (!pendingId) return;
    setBusy(true);
    try { await confirm(pendingId); } catch (e) { toast.error(shopErrorMessage(e)); } finally { setBusy(false); }
  }
  async function buy() {
    if (!initData) { toast("افتح اللعبة من تيليجرام لتفعيل التصريح"); return; }
    setBusy(true);
    try {
      const ui = await getTonConnect();
      if (!ui.connected) { await ui.openModal(); toast("اربط محفظتك ثم فعّل التصريح"); return; }
      const pay = await createFn({ data: { initData, pack: "mine_pass" } });
      setPaymentId(pay.id);
      await ui.sendTransaction({ validUntil: Math.floor(Date.now() / 1000) + 600, messages: [{ address: pay.address, amount: pay.amount, payload: pay.payload }] });
      toast("تم إرسال الدفعة، جارٍ تأكيدها…");
      for (let attempt = 0; attempt < 12; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        try { await confirm(pay.id); return; }
        catch (e) { if (!(e instanceof Error && e.message.includes("not_found_yet"))) throw e; }
      }
      toast("التأكيد لم يصل بعد؛ يمكنك التحقق من الدفع بدون دفع مرة أخرى");
    } catch (e) { toast.error(shopErrorMessage(e)); }
    finally { setBusy(false); void status.refetch(); }
  }
  return <section className="wallet-surface rounded-2xl p-4" aria-label="تصريح التعدين">
    <div className="flex items-center gap-3"><AnimatedEmoji name="shields" className="size-10 shrink-0 text-accent" /><div className="min-w-0 flex-1"><h2 className="flex items-center gap-2 text-lg font-extrabold"><span dir="ltr">Mine Pass</span>{pass && <VerifiedBadge />}</h2><p className="mt-1 text-xs text-foreground/80">{pass ? "حساب موثق · التعدين مفعّل" : "التعدين متوقف حتى تفعيل التصريح"}</p></div>{pass ? <span dir="ltr" className="text-sm font-bold text-accent">#{pass.number}</span> : <span dir="ltr" className="shrink-0 text-sm font-bold">{MINE_PASS_TON} TON</span>}</div>
    {!pass && <div className="mt-4 space-y-2">
      <Button className="btn-cta h-11 w-full rounded-xl" disabled={busy || (!!initData && status.isPending) || status.isError} onClick={buy}>{busy ? "جارٍ التحقق…" : "تفعيل تصريح التعدين"}</Button>
      {pendingId && <Button variant="outline" className="w-full" disabled={busy} onClick={check}>تحقق من دفعة سابقة</Button>}
      {status.isError && <Button variant="outline" className="w-full" onClick={() => void status.refetch()}>إعادة تحميل التصريح</Button>}
    </div>}
  </section>;
}