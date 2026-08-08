import { NextRequest, NextResponse } from "next/server";
import { createInquiry, getInquiries } from "@/lib/data/dataProvider";
import { sendEmail, inquiryConfirmationEmail } from "@/lib/email";
import { logActivity } from "@/lib/activityLog";
import { requireStaff } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email and message are required" },
        { status: 400 }
      );
    }

    const inquiry = await createInquiry({
      propertyId: propertyId || null,
      name,
      email,
      phone: phone || null,
      message,
    });

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: "Your Inquiry Has Been Received - Xerxes",
      html: inquiryConfirmationEmail(name, "Property Inquiry"),
    });

    await logActivity({
      action: "create",
      entity: "inquiry",
      entityId: inquiry.id,
      details: `New inquiry from ${name} (${email})`,
    });

    return NextResponse.json({ success: true, inquiry });
  } catch (error) {
    console.error("Failed to create inquiry:", error);
    return NextResponse.json(
      { error: "Failed to create inquiry" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const list = await getInquiries();
    return NextResponse.json({ inquiries: list });
  } catch (error) {
    console.error("Failed to fetch inquiries:", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}
