import { Expense, Balance, Payment } from "./types";

/**
 * Beräknar balanser för alla användare baserat på utlägg och betalningar.
 */
export function calculateBalances(
    expenses: Expense[],
    payments: Payment[],
    users: { id: string, name: string }[]
): Balance[] {
    const balances: Record<string, number> = {};

    users.forEach(u => balances[u.id] = 0);

    // Lägg till utlägg
    expenses.forEach(expense => {
        balances[expense.payerId] += expense.amount;
        expense.splits.forEach(split => {
            balances[split.userId] -= split.amount;
        });
    });

    // Justera för betalningar som redan gjorts
    payments.forEach(payment => {
        if (payment.status === "Slutförd") {
            balances[payment.from_user_id] += payment.amount;
            balances[payment.to_user_id] -= payment.amount;
        }
    });

    return users.map(u => ({
        userId: u.id,
        userName: u.name,
        amount: balances[u.id] || 0
    }));
}

/**
 * Förenklar skulder (Vem betalar vem)
 */
export function simplifyDebts(balances: Balance[]) {
    const creditors = balances.filter(b => b.amount > 0).sort((a, b) => b.amount - a.amount);
    const debtors = balances.filter(b => b.amount < 0).sort((a, b) => a.amount - b.amount);

    const transactions: { from: string, to: string, amount: number }[] = [];

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const amount = Math.min(-debtors[i].amount, creditors[j].amount);

        if (amount > 0.01) {
            transactions.push({
                from: debtors[i].userName,
                to: creditors[j].userName,
                amount: Math.round(amount * 100) / 100
            });
        }

        debtors[i].amount += amount;
        creditors[j].amount -= amount;

        if (Math.abs(debtors[i].amount) < 0.01) i++;
        if (Math.abs(creditors[j].amount) < 0.01) j++;
    }

    return transactions;
}
