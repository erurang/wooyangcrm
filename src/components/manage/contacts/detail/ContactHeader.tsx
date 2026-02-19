"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Building,
  Phone,
  Mail,
  Download,
} from "lucide-react";

interface ContactHeaderProps {
  contactData: {
    contact_name: string;
    level?: string;
    company_id: string;
    company_name: string;
    department?: string;
    mobile?: string;
    email?: string;
  };
}

export default function ContactHeader({ contactData }: ContactHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-sky-600" />
            <h1 className="text-2xl font-bold text-slate-800">
              {contactData.contact_name}
              <span className="ml-2 text-lg font-normal text-slate-500">
                {contactData.level || ""}
              </span>
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-400" />
              <Link
                href={`/consultations/${contactData.company_id}`}
                className="text-sky-600 hover:text-sky-800 hover:underline"
              >
                {contactData.company_name}
              </Link>
              <span className="text-slate-400">|</span>
              <span>{contactData.department || "부서 정보 없음"}</span>
            </div>

            <div className="flex items-center gap-4">
              {contactData.mobile && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{contactData.mobile}</span>
                </div>
              )}

              {contactData.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{contactData.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
          >
            뒤로 가기
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            <span>내보내기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
