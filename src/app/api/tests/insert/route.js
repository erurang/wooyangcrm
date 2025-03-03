// import data from "../company_details.json";
// import { supabase } from "../../../../lib/supabaseClient";
// import dayjs from "dayjs";
// import readline from "readline";

// // 🔍 전화번호 정규식
// const phoneRegex = /(010[-.\s]?\d{3,4}[-.\s]?\d{4})/;

// // 🔍 직급 리스트 (긴 직급 먼저 정렬)
// const TITLES = [
//   "책임연구원",
//   "수석연구원",
//   "선임연구원",
//   "전임연구원",
//   "사무국장",
//   "연구소장",
//   "생산팀장",
//   "개발팀장",
//   "대표이사",
//   "연구원",
//   "계자장",
//   "계장]",
//   "매니저",
//   "회계사",
//   "공장장",
//   "부회장",
//   "부사장",
//   "본부장",
//   "센터장",
//   "위원",
//   "계장",
//   "탐정",
//   "계정",
//   "ㄴ?",
//   "ㅂ",
//   "(??",
//   "소장",
//   "개발",
//   "이사",
//   "전무",
//   "상무",
//   "부장",
//   "차장",
//   "광장",
//   "전임",
//   "과장",
//   "팀장",
//   "실장",
//   "대리",
//   "주임",
//   "사장",
//   "대표",
//   "교수",
//   "생산",
//   "고문",
//   "회장",
//   "영업",
//   "구매",
//   "자재",
//   "총무",
//   "공무",
//   "연구",
//   "반장",
//   "책임",
//   "수석",
//   "선임",
//   "선임&",
//   ",오우현",
//   "사원",
//   "?",
// ].sort((a, b) => b.length - a.length); // 긴 직급부터 검색

// // 🔍 부서 리스트
// const DEPARTMENTS = [
//   "연구소",
//   "개발팀",
//   "기획팀",
//   "영업팀",
//   "마케팅팀",
//   "인사팀",
//   "총무팀",
//   "재무팀",
//   "전략기획팀",
//   "디자인팀",
//   "CS팀",
//   "생산팀",
//   "품질관리팀",
//   "기술지원팀",
//   "경영지원팀",
//   "사업부",
// ];

// // 📌 전화번호 추출 함수
// function extractMobile(text) {
//   const match = text.match(phoneRegex);
//   return match ? match[1] : "";
// }

// // 📌 이메일 정리 함수
// function cleanEmail(email) {
//   return email.includes("@") &&
//     !email.includes("웹하드") &&
//     !email.includes("ID:")
//     ? email
//     : "";
// }

// // 📌 이름 & 직급 분리
// function splitNameAndTitle(name) {
//   name = name.replace(/님/g, "").trim(); // '님' 제거
//   for (const title of TITLES) {
//     if (name.includes(title)) {
//       return { name: name.replace(title, "").trim(), level: title };
//     }
//   }
//   return { name: name.trim(), level: "" };
// }

// // 📌 부서 정보 추출
// function extractDepartment(text) {
//   for (const dept of DEPARTMENTS) {
//     if (text.includes(dept)) {
//       return text;
//     }
//   }
//   return "";
// }

// // 📌 연락처 데이터 정리
// function cleanContactData(contact) {
//   let { name, mobile, department, position, email } = contact;

//   if (!mobile) {
//     mobile =
//       extractMobile(department) ||
//       extractMobile(position) ||
//       extractMobile(email);
//   }

//   email = cleanEmail(email);
//   const { name: cleanedName, level } = splitNameAndTitle(name);
//   const cleanedDepartment =
//     extractDepartment(department) || extractDepartment(position);

//   return {
//     contact_name: cleanedName,
//     mobile: mobile || null,
//     department: cleanedDepartment || null,
//     level: level || position || null,
//     email: email || null,
//   };
// }
// // 📌 콘솔 입력 설정
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// export async function POST(request) {
//   try {
//     const companyKeys = Object.keys(data);

//     for (let index = 0; index < companyKeys.length; index++) {
//       const companyCode = Object.keys(data)[index];
//       const companyDetails = data[companyCode];

//       let { data: existingCompany } = await supabase
//         .from("companies")
//         .select("id")
//         .eq("name", companyDetails.companyName)
//         .maybeSingle();

//       let companyId = existingCompany?.id;

//       if (!existingCompany) {
//         const { data: company } = await supabase
//           .from("companies")
//           .insert([
//             {
//               name: companyDetails.companyName,
//               address: companyDetails.address,
//             },
//           ])
//           .select("id")
//           .single();
//         companyId = company?.id;
//       }

//       // ✅ 연락처 (`contactDetails`) 먼저 추가
//       const sanitizedContacts = (companyDetails.contactDetails || [])
//         .map(cleanContactData)
//         .filter((c) => c.contact_name);

//       const { data: existingContacts } = await supabase
//         .from("contacts")
//         .select("id, contact_name")
//         .eq("company_id", companyId);

//       // 🔹 기존 연락처 맵 생성 (키: `이름`)
//       const existingContactsMap = new Map(
//         existingContacts.map((c) => [c.contact_name, c.id])
//       );

//       // 🔹 `contactDetails`를 contacts 테이블에 추가
//       for (const contact of sanitizedContacts) {
//         const contactKey = contact.contact_name; // 🔹 이름만 중복 체크
//         if (!existingContactsMap.has(contactKey)) {
//           const { data: newContact } = await supabase
//             .from("contacts")
//             .insert([{ ...contact, company_id: companyId }])
//             .select("id")
//             .single();
//           if (newContact) {
//             existingContactsMap.set(contactKey, newContact.id);
//           }
//         }
//       }

//       // ✅ 상담(`consultations.consultee`)을 처리하며 누락된 연락처 추가
//       for (const consultation of companyDetails.consultations || []) {
//         let consulteeName = consultation.consultee?.trim() || "미확인"; // ✅ 기본값 추가
//         let consultantName = consultation.consultant?.trim();

//         if (!consultantName) continue; // ✅ consultant가 없으면 건너뜀

//         console.log(`📝 Processing consultation...`);

//         let userId = null;

//         // 🔹 이름과 직급 자동 분리
//         const { name, level } = splitNameAndTitle(consultation.consultee); // 🔹 직급(level) 제외
//         const contactKey = name; // 🔹 이름만 비교

//         let contactId = existingContactsMap.get(contactKey);

//         // ❌ `contacts` 테이블에 `consultee`가 없으면 추가
//         if (!contactId) {
//           console.log(
//             `➕ Adding new contact for consultee: ${consultation.consultee}`
//           );

//           // 🔹 새 연락처 데이터 생성
//           const newContactData = {
//             contact_name: name,
//             level: level || null,
//             department: null,
//             mobile: null,
//             email: null,
//             company_id: companyId,
//           };

//           // 🔹 새 연락처 삽입
//           const { data: newContact } = await supabase
//             .from("contacts")
//             .insert([newContactData])
//             .select("id")
//             .single();

//           if (newContact) {
//             contactId = newContact.id;
//             existingContactsMap.set(contactKey, contactId);
//           }
//         }

//         // 🔍 상담자(consultant) 정보 조회
//         if (consultation.consultant) {
//           let cleanName = consultation.consultant
//             .replace(
//               /대표|이사|부장|차장|과장|대리|주임|프로|실장|잉사|팀장|대표이사|선임|책임|님/g,
//               ""
//             )
//             .trim();
//           const { data: foundUser } = await supabase
//             .from("users")
//             .select("id")
//             .eq("name", cleanName)
//             .maybeSingle();
//           if (foundUser) userId = foundUser.id;
//         }

//         // ✅ 상담 내역 추가
//         const { data: insertedConsultation } = await supabase
//           .from("consultations")
//           .insert({
//             created_at: dayjs(consultation.consultationDate).format(
//               "YYYY-MM-DD"
//             ),
//             date: dayjs(consultation.consultationDate).format("YYYY-MM-DD"),
//             company_id: companyId,
//             user_id: userId,
//             content: consultation.consultationContent,
//           })
//           .select("id")
//           .single();

//         const consultationId = insertedConsultation?.id;

//         // ✅ 상담과 연락처 연결
//         if (consultationId && contactId) {
//           await supabase.from("contacts_consultations").insert([
//             {
//               consultation_id: consultationId,
//               contact_id: contactId,
//               user_id: userId,
//             },
//           ]);
//         }

//         if (consultationId && (consultation.quote || consultation.order)) {
//           let documentInsertions = [];

//           if (consultation.quote) {
//             documentInsertions.push({
//               created_at: dayjs(consultation.consultationDate).format(
//                 "YYYY-MM-DD"
//               ),

//               type: "estimate",
//               consultation_id: consultationId,
//               content: {
//                 items: consultation.quote.items.map((item, index) => ({
//                   name: item.productName,
//                   spec: item.specification,
//                   amount: item.amount,
//                   number: index + 1,
//                   quantity: item.quantity,
//                   unit_price: item.unitPrice,
//                 })),
//                 total_amount: consultation.quote.items.reduce(
//                   (sum, item) => sum + item.amount,
//                   0
//                 ),
//                 company_name: consultation.quote.companyName,
//                 notes: consultation.quote.specialNote,
//                 valid_until: consultation.quote.validityPeriod,
//                 delivery_term: consultation.quote.deliveryPeriod,
//                 delivery_place: consultation.quote.deliveryPlace,
//                 payment_method: consultation.quote.paymentConditions,
//               },
//               company_id: companyId,
//               user_id: userId,
//               payment_method: consultation.quote.paymentConditions,
//               status: "backup",
//             });
//           }

//           if (consultation.order) {
//             documentInsertions.push({
//               created_at: dayjs(consultation.consultationDate).format(
//                 "YYYY-MM-DD"
//               ),

//               type: "order",
//               consultation_id: consultationId,
//               content: {
//                 items: consultation.order.items.map((item, index) => ({
//                   name: item.productName,
//                   spec: item.specification,
//                   amount: item.amount,
//                   number: index + 1,
//                   quantity: item.quantity,
//                   unit_price: item.unitPrice,
//                 })),
//                 total_amount: consultation.order.totalAmount,
//                 company_name: consultation.order.companyName,
//                 notes: consultation.order.specialNote,
//                 payment_method: consultation.order.paymentMethod,
//                 delivery_date: consultation.order.deliveryDate,
//               },
//               company_id: companyId,
//               user_id: userId,
//               payment_method: consultation.order.paymentMethod,
//               status: "backup",
//             });
//           }
//           const { data: insertedDocuments, error: documentInsertError } =
//             await supabase
//               .from("documents")
//               .insert(documentInsertions)
//               .select("id");

//           if (documentInsertError) {
//             console.error("❌ Error inserting documents:", documentInsertError);
//           } else if (
//             Array.isArray(insertedDocuments) &&
//             insertedDocuments.length > 0
//           ) {
//             for (const document of insertedDocuments) {
//               if (contactId) {
//                 await supabase.from("contacts_documents").insert([
//                   {
//                     document_id: document.id,
//                     contact_id: contactId,
//                     user_id: userId,
//                   },
//                 ]);
//               }
//             }
//           } else {
//             console.warn("⚠️ No documents inserted or received empty array.");
//           }
//         }

//         console.log(`✅ Company ${index + 1} processed!,${companyCode},`);
//       }

//       //   setTimeout(() => {
//       //     index = index + 1;
//       //   }, 2000);
//     }

//     return new Response(
//       JSON.stringify({
//         message: "Processing started. Press Enter to continue.",
//       }),
//       {
//         status: 200,
//       }
//     );
//   } catch (e) {
//     return new Response(JSON.stringify({ error: e.message }), {
//       status: 500,
//     });
//   }
// }
