export async function onRequestGet(context) {
  const { env, data } = context;
  const db = env.DB;
  const user = data.user;

  try {
    // Select all transactions and their repayments
    const stmt = db.prepare(`
      SELECT t.id, t.type, t.amount, t.status,
             COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.transaction_id = t.id), 0) as repaid_amount
      FROM transactions t
      WHERE t.user_id = ?1
    `).bind(user.userId);
    
    const { results } = await stmt.all();

    let totalIncome = 0;
    let totalExpense = 0;
    
    let loansGivenTotal = 0;
    let loansGivenPaid = 0;
    let loansTakenTotal = 0;
    let loansTakenPaid = 0;
    
    let udharGivenTotal = 0;
    let udharGivenPaid = 0;
    let udharTakenTotal = 0;
    let udharTakenPaid = 0;

    for (const t of results) {
      const amt = t.amount;
      const repaid = t.repaid_amount;
      
      if (t.type === 'income') {
        totalIncome += amt;
      } else if (t.type === 'expense') {
        totalExpense += amt;
      } else if (t.type === 'loan_given') {
        loansGivenTotal += amt;
        loansGivenPaid += repaid;
      } else if (t.type === 'loan_taken') {
        loansTakenTotal += amt;
        loansTakenPaid += repaid;
      } else if (t.type === 'udhar_given') {
        udharGivenTotal += amt;
        udharGivenPaid += repaid;
      } else if (t.type === 'udhar_taken') {
        udharTakenTotal += amt;
        udharTakenPaid += repaid;
      }
    }

    const loansGivenOutstanding = loansGivenTotal - loansGivenPaid;
    const loansTakenOutstanding = loansTakenTotal - loansTakenPaid;
    const udharGivenOutstanding = udharGivenTotal - udharGivenPaid;
    const udharTakenOutstanding = udharTakenTotal - udharTakenPaid;

    // Inflows (Income, Initial Loan Taken, Initial Udhaar Taken, Repayments received of Loans Given, Repayments received of Udhaar Given)
    const cashInflow = totalIncome + loansTakenTotal + udharTakenTotal + loansGivenPaid + udharGivenPaid;
    // Outflows (Expenses, Initial Loan Given, Initial Udhaar Given, Repayments paid of Loans Taken, Repayments paid of Udhaar Taken)
    const cashOutflow = totalExpense + loansGivenTotal + udharGivenTotal + loansTakenPaid + udharTakenPaid;
    const currentBalance = cashInflow - cashOutflow;

    return new Response(JSON.stringify({
      success: true,
      stats: {
        totalIncome,
        totalExpense,
        currentBalance,
        loansGiven: {
          total: loansGivenTotal,
          repaid: loansGivenPaid,
          outstanding: loansGivenOutstanding
        },
        loansTaken: {
          total: loansTakenTotal,
          repaid: loansTakenPaid,
          outstanding: loansTakenOutstanding
        },
        udharGiven: {
          total: udharGivenTotal,
          repaid: udharGivenPaid,
          outstanding: udharGivenOutstanding
        },
        udharTaken: {
          total: udharTakenTotal,
          repaid: udharTakenPaid,
          outstanding: udharTakenOutstanding
        },
        toReceive: loansGivenOutstanding + udharGivenOutstanding,
        toPay: loansTakenOutstanding + udharTakenOutstanding
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
