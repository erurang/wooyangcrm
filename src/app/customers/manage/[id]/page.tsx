"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// 타입 정의
interface Contact {
  id?: number;
  contact_name: string;
  phone: string;
  email: string;
}

export default function CompanyDetailPage() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [fax, setFax] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setnotes] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [newContact, setNewContact] = useState<Contact>({
    contact_name: "",
    phone: "",
    email: "",
  });

  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        // 회사 정보 가져오기
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", id)
          .single();

        if (companyError) {
          console.error("회사 정보 가져오기 실패:", companyError);
          return;
        }

        setName(companyData.name);
        setAddress(companyData.address);
        setPhone(companyData.phone);
        setFax(companyData.fax);
        setEmail(companyData.email);
        setnotes(companyData.notes);
      } catch (error) {
        console.error("데이터 로드 중 에러:", error);
      }
    };

    fetchData();
  }, [id]);

  const handleSave = async () => {
    try {
      if (!name) {
        alert("거래처명은 필수입니다.");
        return;
      }

      // 회사 정보 저장
      if (id) {
        const { error } = await supabase
          .from("companies")
          .update({ name, address, phone, fax, email, notes })
          .eq("id", id);

        if (error) throw new Error("회사 정보 수정 실패");
      } else {
        const { data, error } = await supabase
          .from("companies")
          .insert({ name, address, phone, fax, email, notes })
          .select("id")
          .single();

        if (error) throw new Error("회사 추가 실패");
        router.push(`/customers/manage/${data.id}`);
      }

      // 담당자 정보 저장
      for (const contact of contacts) {
        if (!contact.id) {
          await supabase.from("contacts").insert({
            contact_name: contact.contact_name,
            phone: contact.phone,
            email: contact.email,
            company_id: id,
          });
        }
      }

      alert("저장되었습니다.");
      router.push("/customers"); // 저장 후 /customers로 이동
    } catch (error: any) {
      console.error("저장 실패:", error.message);
    }
  };

  const handleCancel = () => {
    router.push("/customers");
  };

  const handleAddContact = () => {
    if (!newContact.contact_name || !newContact.phone || !newContact.email) {
      alert("담당자명, 전화번호, 이메일은 필수입니다.");
      return;
    }

    setContacts([...contacts, newContact]);
    setNewContact({ contact_name: "", phone: "", email: "" });
  };

  const handleDeleteContact = (index: number) => {
    const updatedContacts = contacts.filter((_, i) => i !== index);
    setContacts(updatedContacts);
  };

  return (
    <div>
      <h1>거래처 상세 보기</h1>

      {/* 회사 정보 입력 */}
      <section>
        <div>
          <label>거래처명</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="거래처명을 입력하세요"
          />
        </div>
        <div>
          <label>주소</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="주소를 입력하세요"
          />
        </div>
        <div>
          <label>전화번호</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="전화번호를 입력하세요"
          />
        </div>
        <div>
          <label>팩스</label>
          <input
            value={fax}
            onChange={(e) => setFax(e.target.value)}
            placeholder="팩스 번호를 입력하세요"
          />
        </div>
        <div>
          <label>이메일</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
          />
        </div>
        <div>
          <label>메모</label>
          <textarea
            value={notes}
            onChange={(e) => setnotes(e.target.value)}
            placeholder="메모를 입력하세요"
          />
        </div>
      </section>

      {/* 담당자 테이블 */}
      {/* <h2>담당자</h2>
      <table>
        <thead>
          <tr>
            <th>담당자</th>
            <th>전화번호</th>
            <th>이메일</th>
            <th>삭제</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact, index) => (
            <tr key={index}>
              <td>{contact.contact_name}</td>
              <td>{contact.phone}</td>
              <td>{contact.email}</td>
              <td>
                <button onClick={() => handleDeleteContact(index)}>삭제</button>
              </td>
            </tr>
          ))}
          <tr>
            <td>
              <input
                value={newContact.contact_name}
                onChange={(e) =>
                  setNewContact({ ...newContact, contact_name: e.target.value })
                }
                placeholder="담당자명"
              />
            </td>
            <td>
              <input
                value={newContact.phone}
                onChange={(e) =>
                  setNewContact({ ...newContact, phone: e.target.value })
                }
                placeholder="전화번호"
              />
            </td>
            <td>
              <input
                value={newContact.email}
                onChange={(e) =>
                  setNewContact({ ...newContact, email: e.target.value })
                }
                placeholder="이메일"
              />
            </td>
            <td>
              <button onClick={handleAddContact}>추가</button>
            </td>
          </tr>
        </tbody>
      </table> */}

      <div>
        <button onClick={handleCancel}>취소</button>
        <button onClick={handleSave}>저장</button>
      </div>
    </div>
  );
}
