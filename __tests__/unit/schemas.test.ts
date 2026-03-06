import { describe, it, expect } from "vitest";
import {
  idSchema,
  monthSchema,
  nameSchema,
  shortNameSchema,
  positiveAmountSchema,
  nonNegativeAmountSchema,
  hexColorSchema,
  isoDateSchema,
  expenseTypeSchema,
  incomeSourceSchema,
  orderedIdsSchema,
  dayOfMonthSchema,
  currencySchema,
  reminderOffsetsSchema,
} from "@/lib/schemas/common";
import {
  CreateExpenseSchema,
  AddSavingsContributionSchema,
  TransferSavingsSchema,
  CreateAdhocExpenseSchema,
} from "@/lib/schemas/expense";
import {
  CreateIncomeSchema,
  CreateAdhocIncomeSchema,
} from "@/lib/schemas/income";
import { CreateDebtSchema, MakeExtraPaymentSchema } from "@/lib/schemas/debt";
import { AddDebtTransactionSchema } from "@/lib/schemas/debt-transaction";
import { AddExpenseTransactionSchema } from "@/lib/schemas/expense-transaction";
import { CreateSectionSchema } from "@/lib/schemas/section";
import { CreateCardSchema } from "@/lib/schemas/card";
import { UpdateSettingsSchema } from "@/lib/schemas/settings";
import { CompleteOnboardingSchema } from "@/lib/schemas/onboarding";
import { PushSendSchema, PushSubscribeSchema } from "@/lib/schemas/push";
import { ValidationError, validateInput } from "@/lib/schemas/validate";

// ─── Common primitives ─────────────────────────────────────────────────────

describe("Common schemas", () => {
  describe("idSchema", () => {
    it("accepts valid UUID", () => {
      expect(
        idSchema.safeParse("550e8400-e29b-41d4-a716-446655440000").success,
      ).toBe(true);
    });
    it("rejects non-UUID string", () => {
      expect(idSchema.safeParse("not-a-uuid").success).toBe(false);
    });
    it("rejects empty string", () => {
      expect(idSchema.safeParse("").success).toBe(false);
    });
  });

  describe("monthSchema", () => {
    it("accepts valid month", () => {
      expect(monthSchema.safeParse("2026-03").success).toBe(true);
      expect(monthSchema.safeParse("2026-12").success).toBe(true);
    });
    it("rejects invalid month number", () => {
      expect(monthSchema.safeParse("2026-13").success).toBe(false);
      expect(monthSchema.safeParse("2026-00").success).toBe(false);
    });
    it("rejects unpadded month", () => {
      expect(monthSchema.safeParse("2026-2").success).toBe(false);
    });
  });

  describe("nameSchema", () => {
    it("accepts valid name", () => {
      expect(nameSchema.safeParse("Loyer").success).toBe(true);
    });
    it("rejects empty string", () => {
      expect(nameSchema.safeParse("").success).toBe(false);
    });
    it("rejects string over 255 chars", () => {
      expect(nameSchema.safeParse("a".repeat(256)).success).toBe(false);
    });
    it("trims whitespace", () => {
      const result = nameSchema.safeParse("  Loyer  ");
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe("Loyer");
    });
    it("rejects whitespace-only string after trim", () => {
      expect(nameSchema.safeParse("   ").success).toBe(false);
    });
  });

  describe("positiveAmountSchema", () => {
    it("accepts positive numbers", () => {
      expect(positiveAmountSchema.safeParse(100).success).toBe(true);
      expect(positiveAmountSchema.safeParse(0.01).success).toBe(true);
    });
    it("rejects zero", () => {
      expect(positiveAmountSchema.safeParse(0).success).toBe(false);
    });
    it("rejects negative numbers", () => {
      expect(positiveAmountSchema.safeParse(-1).success).toBe(false);
    });
  });

  describe("nonNegativeAmountSchema", () => {
    it("accepts zero", () => {
      expect(nonNegativeAmountSchema.safeParse(0).success).toBe(true);
    });
    it("accepts positive numbers", () => {
      expect(nonNegativeAmountSchema.safeParse(100).success).toBe(true);
    });
    it("rejects negative numbers", () => {
      expect(nonNegativeAmountSchema.safeParse(-1).success).toBe(false);
    });
  });

  describe("hexColorSchema", () => {
    it("accepts valid hex color", () => {
      expect(hexColorSchema.safeParse("#FF5733").success).toBe(true);
      expect(hexColorSchema.safeParse("#000000").success).toBe(true);
    });
    it("rejects invalid hex color", () => {
      expect(hexColorSchema.safeParse("FF5733").success).toBe(false);
      expect(hexColorSchema.safeParse("#FFF").success).toBe(false);
      expect(hexColorSchema.safeParse("#GGGGGG").success).toBe(false);
    });
  });

  describe("expenseTypeSchema", () => {
    it("accepts valid enum values", () => {
      expect(expenseTypeSchema.safeParse("RECURRING").success).toBe(true);
      expect(expenseTypeSchema.safeParse("ONE_TIME").success).toBe(true);
      expect(expenseTypeSchema.safeParse("PLANNED").success).toBe(true);
    });
    it("rejects invalid enum values", () => {
      expect(expenseTypeSchema.safeParse("INVALID").success).toBe(false);
      expect(expenseTypeSchema.safeParse("recurring").success).toBe(false);
    });
  });

  describe("orderedIdsSchema", () => {
    it("accepts non-empty array of UUIDs", () => {
      expect(
        orderedIdsSchema.safeParse(["550e8400-e29b-41d4-a716-446655440000"])
          .success,
      ).toBe(true);
    });
    it("rejects empty array", () => {
      expect(orderedIdsSchema.safeParse([]).success).toBe(false);
    });
    it("rejects array with invalid UUIDs", () => {
      expect(orderedIdsSchema.safeParse(["not-uuid"]).success).toBe(false);
    });
  });

  describe("dayOfMonthSchema", () => {
    it("accepts 1-31", () => {
      expect(dayOfMonthSchema.safeParse(1).success).toBe(true);
      expect(dayOfMonthSchema.safeParse(31).success).toBe(true);
    });
    it("rejects 0 and 32", () => {
      expect(dayOfMonthSchema.safeParse(0).success).toBe(false);
      expect(dayOfMonthSchema.safeParse(32).success).toBe(false);
    });
  });
});

// ─── Domain schemas ─────────────────────────────────────────────────────────

describe("Expense schemas", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";

  describe("CreateExpenseSchema", () => {
    it("accepts valid RECURRING expense", () => {
      const result = CreateExpenseSchema.safeParse({
        name: "Loyer",
        amount: 1200,
        type: "RECURRING",
        recurrence_frequency: "MONTHLY",
        recurrence_day: 1,
      });
      expect(result.success).toBe(true);
    });

    it("accepts PLANNED expense with amount=0", () => {
      const result = CreateExpenseSchema.safeParse({
        name: "Vacances",
        amount: 0,
        type: "PLANNED",
        target_amount: 5000,
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative amount", () => {
      const result = CreateExpenseSchema.safeParse({
        name: "Test",
        amount: -100,
        type: "RECURRING",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const result = CreateExpenseSchema.safeParse({
        name: "",
        amount: 100,
        type: "RECURRING",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid expense type", () => {
      const result = CreateExpenseSchema.safeParse({
        name: "Test",
        amount: 100,
        type: "INVALID",
      });
      expect(result.success).toBe(false);
    });

    it("accepts optional boolean fields", () => {
      const result = CreateExpenseSchema.safeParse({
        name: "Internet",
        amount: 80,
        type: "RECURRING",
        auto_debit: true,
        spread_monthly: false,
        notify_push: true,
        notify_email: false,
        notify_sms: false,
        notes: "Videotron",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("AddSavingsContributionSchema", () => {
    it("accepts positive amount", () => {
      const result = AddSavingsContributionSchema.safeParse({
        expenseId: validUUID,
        amount: 50,
      });
      expect(result.success).toBe(true);
    });

    it("accepts negative amount (correction)", () => {
      const result = AddSavingsContributionSchema.safeParse({
        expenseId: validUUID,
        amount: -50,
      });
      expect(result.success).toBe(true);
    });

    it("rejects zero amount", () => {
      const result = AddSavingsContributionSchema.safeParse({
        expenseId: validUUID,
        amount: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("CreateAdhocExpenseSchema", () => {
    it("accepts valid adhoc expense", () => {
      const result = CreateAdhocExpenseSchema.safeParse({
        name: "Imprevue",
        amount: 50,
        sectionId: validUUID,
        month: "2026-03",
      });
      expect(result.success).toBe(true);
    });

    it("rejects zero amount (adhoc must be positive)", () => {
      const result = CreateAdhocExpenseSchema.safeParse({
        name: "Test",
        amount: 0,
        sectionId: validUUID,
        month: "2026-03",
      });
      expect(result.success).toBe(false);
    });

    it("defaults alreadyPaid to false", () => {
      const result = CreateAdhocExpenseSchema.safeParse({
        name: "Test",
        amount: 50,
        sectionId: validUUID,
        month: "2026-03",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.alreadyPaid).toBe(false);
    });
  });
});

describe("ExpenseTransaction schemas", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";

  describe("AddExpenseTransactionSchema", () => {
    it("accepts valid transaction with note", () => {
      const result = AddExpenseTransactionSchema.safeParse({
        monthlyExpenseId: validUUID,
        amount: 87.5,
        note: "Metro",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid transaction without note", () => {
      const result = AddExpenseTransactionSchema.safeParse({
        monthlyExpenseId: validUUID,
        amount: 25,
      });
      expect(result.success).toBe(true);
    });

    it("accepts null note", () => {
      const result = AddExpenseTransactionSchema.safeParse({
        monthlyExpenseId: validUUID,
        amount: 10,
        note: null,
      });
      expect(result.success).toBe(true);
    });

    it("rejects zero amount", () => {
      const result = AddExpenseTransactionSchema.safeParse({
        monthlyExpenseId: validUUID,
        amount: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative amount", () => {
      const result = AddExpenseTransactionSchema.safeParse({
        monthlyExpenseId: validUUID,
        amount: -50,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid UUID", () => {
      const result = AddExpenseTransactionSchema.safeParse({
        monthlyExpenseId: "not-a-uuid",
        amount: 50,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing monthlyExpenseId", () => {
      const result = AddExpenseTransactionSchema.safeParse({
        amount: 50,
      });
      expect(result.success).toBe(false);
    });

    it("rejects note over 500 chars", () => {
      const result = AddExpenseTransactionSchema.safeParse({
        monthlyExpenseId: validUUID,
        amount: 50,
        note: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Income schemas", () => {
  describe("CreateIncomeSchema", () => {
    it("accepts valid income", () => {
      const result = CreateIncomeSchema.safeParse({
        name: "Salaire",
        source: "EMPLOYMENT",
        amount: 4200,
        estimated_amount: null,
        frequency: "BIWEEKLY",
      });
      expect(result.success).toBe(true);
    });

    it("accepts VARIABLE income with null amount", () => {
      const result = CreateIncomeSchema.safeParse({
        name: "Freelance",
        source: "BUSINESS",
        amount: null,
        estimated_amount: 500,
        frequency: "VARIABLE",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid source", () => {
      const result = CreateIncomeSchema.safeParse({
        name: "Test",
        source: "INVALID",
        amount: 100,
        estimated_amount: null,
        frequency: "MONTHLY",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("CreateAdhocIncomeSchema", () => {
    it("validates month format", () => {
      const result = CreateAdhocIncomeSchema.safeParse({
        name: "Bonus",
        amount: 1000,
        source: "EMPLOYMENT",
        month: "2026-3",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Debt schemas", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";

  describe("CreateDebtSchema", () => {
    it("accepts valid debt", () => {
      const result = CreateDebtSchema.safeParse({
        name: "Pret auto",
        original_amount: 25000,
        remaining_balance: 18000,
        interest_rate: 4.5,
        payment_amount: 450,
        payment_frequency: "MONTHLY",
      });
      expect(result.success).toBe(true);
    });

    it("rejects interest rate over 100", () => {
      const result = CreateDebtSchema.safeParse({
        name: "Test",
        original_amount: 1000,
        remaining_balance: 1000,
        interest_rate: 150,
        payment_amount: 100,
        payment_frequency: "MONTHLY",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("MakeExtraPaymentSchema", () => {
    it("rejects zero payment", () => {
      const result = MakeExtraPaymentSchema.safeParse({
        id: validUUID,
        amount: 0,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Section schemas", () => {
  describe("CreateSectionSchema", () => {
    it("accepts valid section", () => {
      const result = CreateSectionSchema.safeParse({
        name: "Logement",
        icon: "🏠",
        color: "#3D3BF3",
      });
      expect(result.success).toBe(true);
    });

    it("rejects name over 100 chars", () => {
      const result = CreateSectionSchema.safeParse({
        name: "a".repeat(101),
        icon: "🏠",
        color: "#3D3BF3",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Card schemas", () => {
  describe("CreateCardSchema", () => {
    it("accepts valid card", () => {
      const result = CreateCardSchema.safeParse({
        name: "Visa",
        last_four: "4242",
        bank: "Desjardins",
        color: "#6366F1",
      });
      expect(result.success).toBe(true);
    });

    it("rejects last_four with letters", () => {
      const result = CreateCardSchema.safeParse({
        name: "Visa",
        last_four: "42AB",
      });
      expect(result.success).toBe(false);
    });

    it("rejects last_four with wrong length", () => {
      const result = CreateCardSchema.safeParse({
        name: "Visa",
        last_four: "123",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Push schemas", () => {
  describe("PushSendSchema", () => {
    it("accepts valid push payload", () => {
      const result = PushSendSchema.safeParse({
        body: "Rappel de paiement",
        url: "/depenses",
      });
      expect(result.success).toBe(true);
    });

    it("rejects absolute URL (security)", () => {
      const result = PushSendSchema.safeParse({
        body: "Test",
        url: "https://evil.com",
      });
      expect(result.success).toBe(false);
    });

    it("defaults url to /", () => {
      const result = PushSendSchema.safeParse({
        body: "Test",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.url).toBe("/");
    });

    it("rejects empty body", () => {
      const result = PushSendSchema.safeParse({
        body: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("PushSubscribeSchema", () => {
    it("accepts valid HTTPS endpoint", () => {
      const result = PushSubscribeSchema.safeParse({
        endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
        keys: {
          p256dh: "BNcRdreALRFXTkOOUHK...",
          auth: "tBHItJI5svbpC7htWn...",
        },
      });
      expect(result.success).toBe(true);
    });

    it("rejects HTTP endpoint", () => {
      const result = PushSubscribeSchema.safeParse({
        endpoint: "http://evil.com/push",
        keys: { p256dh: "abc", auth: "def" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing keys", () => {
      const result = PushSubscribeSchema.safeParse({
        endpoint: "https://push.example.com",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Settings schemas", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";

  describe("UpdateSettingsSchema", () => {
    it("accepts valid settings update", () => {
      const result = UpdateSettingsSchema.safeParse({
        id: validUUID,
        data: {
          email: "test@example.com",
          notify_push: true,
          default_currency: "CAD",
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts null email (unset)", () => {
      const result = UpdateSettingsSchema.safeParse({
        id: validUUID,
        data: { email: null },
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = UpdateSettingsSchema.safeParse({
        id: validUUID,
        data: { email: "not-an-email" },
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Onboarding schemas", () => {
  describe("CompleteOnboardingSchema", () => {
    it("accepts valid onboarding data", () => {
      const result = CompleteOnboardingSchema.safeParse({
        monthlyRevenue: 4200,
        frequency: "biweekly",
        categories: ["logement", "epicerie"],
        objective: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts zero revenue", () => {
      const result = CompleteOnboardingSchema.safeParse({
        monthlyRevenue: 0,
        frequency: "monthly",
        categories: [],
        objective: null,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid frequency", () => {
      const result = CompleteOnboardingSchema.safeParse({
        monthlyRevenue: 4200,
        frequency: "daily",
        categories: [],
        objective: null,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("DebtTransaction schemas", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";

  describe("AddDebtTransactionSchema", () => {
    it("accepts valid payment", () => {
      const result = AddDebtTransactionSchema.safeParse({
        debtId: validUUID,
        type: "PAYMENT",
        amount: 450,
        month: "2026-03",
      });
      expect(result.success).toBe(true);
    });

    it("defaults source to MANUAL", () => {
      const result = AddDebtTransactionSchema.safeParse({
        debtId: validUUID,
        type: "CHARGE",
        amount: 100,
        month: "2026-03",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.source).toBe("MANUAL");
    });

    it("rejects invalid transaction type", () => {
      const result = AddDebtTransactionSchema.safeParse({
        debtId: validUUID,
        type: "REFUND",
        amount: 100,
        month: "2026-03",
      });
      expect(result.success).toBe(false);
    });
  });
});

// ─── validateInput helper ───────────────────────────────────────────────────

describe("validateInput", () => {
  it("returns validated data on success", () => {
    const result = validateInput(positiveAmountSchema, 42);
    expect(result).toBe(42);
  });

  it("throws ValidationError on failure", () => {
    expect(() => validateInput(positiveAmountSchema, -1)).toThrow(
      ValidationError,
    );
  });

  it("ValidationError has structured fieldErrors", () => {
    try {
      validateInput(CreateExpenseSchema, {
        name: "",
        amount: -1,
        type: "INVALID",
      });
      expect.fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).fieldErrors).toBeDefined();
      expect((e as ValidationError).name).toBe("ValidationError");
    }
  });
});
