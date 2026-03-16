import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract fields - handle both Grow/Meshulam formats
    const email =
      body.email ||
      body.Email ||
      body?.customFields?.cField1 ||
      body?.custom_fields?.cField1 ||
      "";
    const fullName =
      body.fullName ||
      body.full_name ||
      body.FullName ||
      body.name ||
      "";
    const phone =
      body.phone ||
      body.Phone ||
      body.mobile ||
      "";
    const amount = parseFloat(body.sum || body.amount || body.Sum || "0");
    const transactionId =
      body.transactionId ||
      body.asmachta ||
      body.TransactionId ||
      body.transaction_id ||
      "";
    const status = body.status || body.Status || "success";

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Missing email" },
        { status: 400 }
      );
    }

    // Only process successful payments
    if (
      status.toLowerCase() !== "success" &&
      status.toLowerCase() !== "completed"
    ) {
      return NextResponse.json({
        success: true,
        message: "Skipped non-success payment",
      });
    }

    const response = NextResponse.json({ success: true });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const normalizedEmail = email.toLowerCase().trim();

    // Check if subscriber exists
    const { data: existing } = await supabase
      .from("subscribers")
      .select("id, email")
      .eq("email", normalizedEmail)
      .single();

    const now = new Date().toISOString();
    const nextPayment = new Date();
    nextPayment.setMonth(nextPayment.getMonth() + 1);
    const nextPaymentDate = nextPayment.toISOString();

    let subscriberId: string;

    if (existing) {
      // Existing subscriber - update
      subscriberId = existing.id;
      await supabase
        .from("subscribers")
        .update({
          full_name: fullName || undefined,
          phone: phone || undefined,
          amount,
          status: "active",
          last_payment_date: now,
          next_payment_date: nextPaymentDate,
          updated_at: now,
        })
        .eq("id", existing.id);
    } else {
      // New subscriber
      const passwordToken = crypto.randomUUID();
      const { data: newSub } = await supabase
        .from("subscribers")
        .insert({
          email: normalizedEmail,
          full_name: fullName,
          phone,
          amount,
          status: "active",
          subscription_start: now,
          last_payment_date: now,
          next_payment_date: nextPaymentDate,
          password_token: passwordToken,
          created_at: now,
          updated_at: now,
        })
        .select("id")
        .single();

      subscriberId = newSub?.id || "";
    }

    // Insert payment record
    if (subscriberId) {
      await supabase.from("payments").insert({
        subscriber_id: subscriberId,
        amount,
        transaction_id: transactionId,
        status: "success",
        payment_date: now,
        created_at: now,
      });
    }

    return response;
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
