import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId"); // 유저 ID 가져오기

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("id, item_id, item_type, created_at,name")
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Error fetching favorites: ${error.message}`);
    }

    return NextResponse.json({ favorites: data });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId"); // 유저 ID
    const itemId = searchParams.get("itemId"); // 즐겨찾기할 항목 ID
    const itemType = searchParams.get("type"); // 항목 타입
    const name = searchParams.get("name"); // 항목 타입

    if (!userId || !itemId || !itemType || !name) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("favorites")
      .insert([
        { user_id: userId, item_id: itemId, item_type: itemType, name },
      ]);

    if (error) {
      throw new Error(`Error adding favorite: ${error.message}`);
    }

    return NextResponse.json({ message: "Favorite added successfully", data });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const itemId = searchParams.get("companyId");

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: "Missing userId or itemId" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("item_id", itemId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "즐겨찾기 삭제 완료" });
  } catch (error) {
    console.error("Error deleting favorite:", error);
    return NextResponse.json(
      { error: "즐겨찾기 삭제 중 오류 발생" },
      { status: 500 }
    );
  }
}
