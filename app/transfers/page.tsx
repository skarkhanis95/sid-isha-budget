import React from "react";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { generateTransferRecommendations } from "@/lib/services/transfer-planner";
import { recordTransferAction } from "@/app/actions/finance-actions";
import { ArrowRightLeft, CheckCircle2, Calendar } from "lucide-react";

export const revalidate = 0;

export default async function TransfersPage() {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [currentMonth] = await db
    .select()
    .from(schema.months)
    .where(eq(schema.months.monthKey, monthKey));

  const monthId = currentMonth ? currentMonth.id : undefined;

  const recommendations = await generateTransferRecommendations(monthId);
  const accounts = await db.select().from(schema.accounts);
  const transfersList = await db
    .select()
    .from(schema.transfers)
    .orderBy(desc(schema.transfers.transferDate));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Transfer Planner & History</h1>
        <p className="text-xs text-muted-foreground">
          Algorithmic transfer recommendations to prevent projected account shortfalls
        </p>
      </div>

      {/* Recommendations Card */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="font-bold text-base flex items-center gap-2 text-indigo-400">
          <ArrowRightLeft className="w-5 h-5" />
          Recommended Inter-Account Transfers ({recommendations.length})
        </h3>

        {recommendations.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            All bank accounts are healthy! No transfers required at this time.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-accent/30 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-lg text-indigo-400">
                    ₹{rec.recommendedAmount.toLocaleString()}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      if (monthId) {
                        await recordTransferAction({
                          monthId,
                          fromAccountId: rec.fromAccountId,
                          toAccountId: rec.toAccountId,
                          amount: rec.recommendedAmount,
                          transferDate: new Date().toISOString().split("T")[0],
                          notes: rec.reason,
                        });
                      }
                    }}
                  >
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-md"
                    >
                      Execute Transfer
                    </button>
                  </form>
                </div>

                <div className="text-xs text-foreground leading-relaxed">
                  Transfer from <strong className="text-primary">{rec.fromAccountName}</strong> to{" "}
                  <strong className="text-emerald-400">{rec.toAccountName}</strong>
                </div>

                <p className="text-[11px] text-muted-foreground">{rec.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical Transfers Log */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="font-bold text-base text-foreground">Completed Transfer History</h3>

        {transfersList.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No transfers recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">From Account</th>
                  <th className="py-3 px-4">To Account</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {transfersList.map((tr) => {
                  const fromAcc = accounts.find((a) => a.id === tr.fromAccountId)?.name || "Account";
                  const toAcc = accounts.find((a) => a.id === tr.toAccountId)?.name || "Account";

                  return (
                    <tr key={tr.id} className="hover:bg-accent/30">
                      <td className="py-3 px-4 font-medium text-foreground">{tr.transferDate}</td>
                      <td className="py-3 px-4 text-muted-foreground">{fromAcc}</td>
                      <td className="py-3 px-4 text-emerald-400 font-medium">{toAcc}</td>
                      <td className="py-3 px-4 font-bold text-foreground">₹{tr.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-muted-foreground">{tr.notes || "-"}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          {tr.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
