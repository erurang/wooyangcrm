"use client";

interface Company {
  name: string;
  business_number: string;
  address: string;
  phone: string;
  fax: string;
  email: string;
  parcel: string;
}

interface CompanyBasicInfoFormProps {
  company: Company;
  onChange: (field: keyof Company, value: string) => void;
}

export default function CompanyBasicInfoForm({
  company,
  onChange,
}: CompanyBasicInfoFormProps) {
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          거래처명 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={company.name || ""}
          onChange={(e) => onChange("name", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="거래처명 입력"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          사업자 번호
        </label>
        <input
          type="text"
          value={company.business_number || ""}
          onChange={(e) => onChange("business_number", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="000-00-00000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이메일
        </label>
        <input
          type="email"
          value={company.email || ""}
          onChange={(e) => onChange("email", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="company@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          주소
        </label>
        <input
          type="text"
          value={company.address || ""}
          onChange={(e) => onChange("address", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="주소 입력"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          전화번호
        </label>
        <input
          type="text"
          value={company.phone || ""}
          onChange={(e) => onChange("phone", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="000-0000-0000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          팩스
        </label>
        <input
          type="text"
          value={company.fax || ""}
          onChange={(e) => onChange("fax", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="000-0000-0000"
        />
      </div>

      <div className="md:col-span-2 lg:col-span-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          택배/화물
        </label>
        <input
          type="text"
          value={company.parcel || ""}
          onChange={(e) => onChange("parcel", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="경동화물, 대신화물, 로젠택배, 직송 등"
        />
      </div>
    </div>
  );
}
