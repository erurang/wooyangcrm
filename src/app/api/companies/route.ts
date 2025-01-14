export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // 요청에서 JSON 데이터 파싱
    const { name, address, phone, fax, email } = body;

    // 필수 데이터 확인
    if (!name || !address || !phone || !email) {
      return NextResponse.json(
        { error: "모든 필수 필드(name, address, phone, email)를 입력하세요." },
        { status: 400 }
      );
    }

    // Supabase에서 회사 추가
    const { data, error } = await supabase
      .from("companies")
      .insert([{ name, address, phone, fax, email }])
      .select("*"); // 추가된 데이터 반환

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 }); // 성공 시 생성된 데이터 반환
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
