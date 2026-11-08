import { describe, expect, it } from "vitest"
import { Payment } from "@/data/types"
import { sortPayments } from "./queries"

const base: Payment = {
  id: "pay_0000",
  merchantId: "mch_01",
  amount: 0,
  currency: "USD",
  status: "captured",
  method: "card",
  cardBrand: "visa",
  last4: "4242",
  createdAt: "2026-03-14T10:15:00.000Z",
  description: "Order",
}

describe("sortPayments", () => {
  it("orders amounts numerically, not by their digits as text", () => {
    const payments = [
      { ...base, id: "a", amount: 25000 },
      { ...base, id: "b", amount: 9000 },
      { ...base, id: "c", amount: 100000 },
    ]
    expect(sortPayments(payments, "amount", "asc").map((p) => p.id)).toEqual([
      "b",
      "a",
      "c",
    ])
    expect(sortPayments(payments, "amount", "desc").map((p) => p.id)).toEqual([
      "c",
      "a",
      "b",
    ])
  })
})
