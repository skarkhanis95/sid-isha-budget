import { calculateAccountBalances, AccountBalanceSummary } from "./balance-service";

export interface TransferRecommendation {
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  recommendedAmount: number;
  reason: string;
}

export async function generateTransferRecommendations(monthId?: string): Promise<TransferRecommendation[]> {
  const accountBalances = await calculateAccountBalances(monthId);

  // Accounts with negative projected balances (deficits)
  const deficitAccounts = accountBalances
    .filter((acc) => acc.projectedBalance < 0)
    .sort((a, b) => a.projectedBalance - b.projectedBalance);

  // Accounts with surplus projected balances (surplus > 0)
  const surplusAccounts = accountBalances
    .filter((acc) => acc.projectedBalance > 0)
    .sort((a, b) => b.projectedBalance - a.projectedBalance);

  const recommendations: TransferRecommendation[] = [];

  // Copy available surpluses
  const surplusPool = surplusAccounts.map((acc) => ({
    ...acc,
    availableSurplus: acc.projectedBalance,
  }));

  for (const deficitAcc of deficitAccounts) {
    let required = Math.abs(deficitAcc.projectedBalance);

    for (const source of surplusPool) {
      if (required <= 0) break;
      if (source.availableSurplus <= 0) continue;

      const transferAmount = Math.min(required, source.availableSurplus);

      if (transferAmount > 0) {
        recommendations.push({
          fromAccountId: source.accountId,
          fromAccountName: source.accountName,
          toAccountId: deficitAcc.accountId,
          toAccountName: deficitAcc.accountName,
          recommendedAmount: Math.round(transferAmount * 100) / 100,
          reason: `Cover projected shortfall of ₹${Math.abs(deficitAcc.projectedBalance).toLocaleString()} in ${deficitAcc.accountName}`,
        });

        source.availableSurplus -= transferAmount;
        required -= transferAmount;
      }
    }
  }

  return recommendations;
}
