import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const limit = parseInt(searchParams.get("limit") || "5");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const { data: documents, error } = await supabase
      .from("documents")
      .select(`
        id,
        type,
        status,
        document_number,
        created_at,
        updated_at,
        content,
        consultations!inner(
          id,
          user_id,
          company_id,
          companies(
            id,
            name
          )
        )
      `)
      .eq("consultations.user_id", userId)
      .in("type", ["estimate", "order", "requestQuote"])
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    interface DocumentItem {
      amount?: number;
    }

    interface DocumentContent {
      items?: DocumentItem[];
    }

    interface Company {
      id: string;
      name: string;
    }

    interface Consultation {
      id: string;
      user_id: string;
      company_id: string;
      companies: Company;
    }

    interface DocumentRecord {
      id: string;
      type: string;
      status: string;
      document_number: string;
      created_at: string;
      updated_at: string;
      content: DocumentContent | null;
      consultations: Consultation;
    }

    const formattedDocuments = (documents as unknown as DocumentRecord[] || []).map((doc) => {
      const items = doc.content?.items || [];
      const totalAmount = items.reduce((sum: number, item: DocumentItem) => sum + (item.amount || 0), 0);

      return {
        id: doc.id,
        type: doc.type,
        status: doc.status,
        document_number: doc.document_number,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        total_amount: totalAmount,
        company_id: doc.consultations?.company_id,
        company_name: doc.consultations?.companies?.name,
        consultation_id: doc.consultations?.id,
      };
    });

    return NextResponse.json({ documents: formattedDocuments });
  } catch (error) {
    console.error("Recent documents error:", error);
    return NextResponse.json({ error: "Failed to fetch recent documents" }, { status: 500 });
  }
}
