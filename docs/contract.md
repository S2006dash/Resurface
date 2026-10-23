# Artha API Contract
**Base:** `/api/artha` (all require session login except `/health`)

## Routes

| Method | Route | Owner | Input | Output |
|--------|-------|-------|-------|--------|
| POST | `/upload` | A | file or `{text, doc_type}` | `{doc_type, provider, rows, checks}` — nothing saved |
| POST | `/confirm` | A+B | `{doc_type, provider, rows}` | `{doc_id, rows_saved}` |
| GET | `/overview` | B | — | net_worth, cash_flow, categories, bills_due |
| GET | `/transactions` | B | query params | `{transactions, count}` |
| GET | `/insights` | B | — | `{findings, count}` |
| GET | `/goals` | B | — | `{goals}` |
| POST | `/goals` | B | `{name, target_amount, deadline}` | `{goal_id}` |
| POST | `/goals/simulate` | B | `{goal_id, what_ifs}` | odds, projections |
| POST | `/coach` | A+B | `{metric, language}` | `{explanation}` |
| GET | `/health` | D | — | `{status: "ok"}` |

## Categories (everyone uses exactly this list)
Food, Groceries, Transport, Shopping, Bills, Rent, EMI, Subscriptions,
Health, Education, Entertainment, Investments, Income, Transfers, Other

## /upload response shape
```json
{
  "doc_type": "upi_screenshot",
  "provider": "gemini",
  "rows": [
    {
      "row_id": 1,
      "date": "2026-10-20",
      "merchant": "Swiggy",
      "amount": 420.00,
      "direction": "debit",
      "category": "Food",
      "confidence": 0.93,
      "flags": []
    }
  ],
  "checks": { "reconciles": null, "duplicates": 0, "bad_dates": 0, "bad_amounts": 0 }
}
```

## /insights finding shape
```json
{
  "id": 1,
  "type": "recurring_subscription",
  "title": "Potentially unused subscription: FitLife Gym",
  "reason": "Charged ₹999 every month for 3 months.",
  "proof_row_ids": [5, 16, 29],
  "action": "Review whether you still use this service.",
  "data": {}
}
```

## Wording rule
Say **"possible duplicate"** and **"potentially unused subscription"**.
Never say "fraud" or "forgotten" as fact.

## Double-count rule
SecureBank `transaction_history` rows → category `Transfers`, excluded from spend totals.
Salary and daily spend live in `ledger_entries`.
