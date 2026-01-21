import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/chat/upload - 채팅 파일 업로드
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;
    const roomId = formData.get("roomId") as string | null;

    if (!file || !userId || !roomId) {
      return NextResponse.json(
        { error: "file, userId, roomId가 필요합니다." },
        { status: 400 }
      );
    }

    // 참여자인지 확인
    const { data: participation, error: partError } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .is("left_at", null)
      .single();

    if (partError || !participation) {
      return NextResponse.json(
        { error: "대화방에 참여하고 있지 않습니다." },
        { status: 403 }
      );
    }

    // 파일 크기 제한 (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "파일 크기는 100MB를 초과할 수 없습니다." },
        { status: 400 }
      );
    }

    // 허용된 파일 타입
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "지원하지 않는 파일 형식입니다." },
        { status: 400 }
      );
    }

    // 파일명 생성
    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `chat/${roomId}/${uniqueFileName}`;

    // Supabase Storage에 업로드
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("chat_files")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage 업로드 실패:", uploadError);
      throw uploadError;
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from("chat_files")
      .getPublicUrl(filePath);

    // 썸네일 URL (이미지인 경우)
    let thumbnailUrl = null;
    if (file.type.startsWith("image/")) {
      const { data: thumbData } = supabase.storage
        .from("chat_files")
        .getPublicUrl(filePath, {
          transform: {
            width: 200,
            height: 200,
            resize: "contain",
          },
        });
      thumbnailUrl = thumbData.publicUrl;
    }

    // DB에 파일 정보 저장 (message_id는 나중에 업데이트)
    const fileId = uuidv4();
    const { data: chatFile, error: dbError } = await supabase
      .from("chat_files")
      .insert({
        id: fileId,
        message_id: null, // 메시지 전송 시 연결
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        thumbnail_url: thumbnailUrl,
      })
      .select()
      .single();

    if (dbError) {
      // 업로드된 파일 삭제
      await supabase.storage.from("chat_files").remove([filePath]);
      throw dbError;
    }

    // 메시지 타입 결정
    const messageType = file.type.startsWith("image/") ? "image" : "file";

    return NextResponse.json({
      file: chatFile,
      message_type: messageType,
    }, { status: 201 });
  } catch (error) {
    console.error("파일 업로드 실패:", error);
    return NextResponse.json(
      { error: "파일 업로드에 실패했습니다." },
      { status: 500 }
    );
  }
}
