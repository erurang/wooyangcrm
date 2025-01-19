// components/DocumentModal.tsx
import Image from "next/image";
import React from "react";

interface DocumentModalProps {
  document: any; // 문서 전체를 prop으로 받음
  onClose: () => void; // 모달을 닫을 때 호출되는 함수
  users: any;
  company_fax: string;
  company_phone: string;
}

const DocumentModal: React.FC<DocumentModalProps> = ({
  document,
  onClose,
  users,
  company_fax,
  company_phone,
}) => {
  console.log("document", document);
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>견적서 프린트</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
              }
              .container {
                width: 100%;
                max-width: 1000px;
                margin: 0 auto;
                padding: 20px;
              }
              .header, .footer {
                text-align: center;
              }
              .header h1 {
                font-size: 30px;
                font-weight: bold;
              }
              .section-title {
                font-weight: bold;
              }
              .table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              .table th, .table td {
                border: 1px solid black;
                padding: 8px;
                text-align: center;
              }
              .table th {
                background-color: #f0f0f0;
              }
              .border-bottom {
                border-bottom: 2px solid black;
              }
              .border-dotted {
                border-bottom: 1px dotted black;
              }
              .column {
                margin-bottom: 20px;
              }
              .flex {
                display: flex;
                justify-content: space-between;
              }
              .text-right {
                text-align: right;
              }
              .footer p {
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>견적서</h1>
                <div class="flex">
                  <div class="section-title">견적일자: 2025년 1월 9일</div>
                  <div class="section-title">견적번호: ${
                    document.document_number
                  }</div>
                </div>
                <div class="border-bottom"></div>
              </div>
  
              <div class="flex mt-10">
                <div class="column">
                  <div class="section-title">회사명: ${
                    document.content.company_name
                  }</div>
                  <div class="section-title">담당자명: ${document.contact}</div>
                  <div class="section-title">TEL: ${
                    document.content.phone || "없음"
                  }</div>
                  <div class="section-title">FAX: ${
                    document.content.fax || "없음"
                  }</div>
                  <div class="section-title">유효기간: ${
                    document.content.valid_until
                  }</div>
                  <div class="section-title">납품일: ${
                    document.content.delivery_term
                  }</div>
                  <div class="section-title">결제방식: ${
                    document.content.payment_method
                  }</div>
                  <div class="section-title">납품장소: ${
                    document.content.delivery_place
                  }</div>
                </div>
  
                <div class="column">
                  <div class="section-title">견적자: users</div>
                </div>
              </div>
  
              <div class="border-bottom"></div>
              <p>아래와 같이 견적합니다.</p>
  
              <div class="table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>품명</th>
                    <th>규격</th>
                    <th>수량</th>
                    <th>단가</th>
                    <th>금액</th>
                  </tr>
                </thead>
                <tbody>
                  ${document.content.items
                    .map(
                      (item: any, index: number) => `
                        <tr>
                          <td>${index + 1}</td>
                          <td>${item.name}</td>
                          <td>${item.spec}</td>
                          <td>${item.quantity} ${item.unit}</td>
                          <td>${item.unit_price.toLocaleString()}</td>
                          <td>${item.amount.toLocaleString()}</td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </div>
  
              <div class="table">
                <thead>
                  <tr>
                    <th>합계(VAT별도) : ₩${document.content.total_amount.toLocaleString()}</th>
                  </tr>
                </thead>
              </div>
  
              <div class="footer">
                <p>특기사항: Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-md w-2/3 max-w-6xl">
        <div className="flex justify-center relative">
          <h1 className="font-bold text-4xl">
            견{"  "}적{"  "}서
          </h1>
          <div className="flex justify-end absolute left-0 -bottom-4">
            <div className="relative">
              <h1>2025년 1월 9일</h1>
            </div>
          </div>
          <div className="flex justify-end absolute right-0 -bottom-4">
            <div className="relative">
              <p>{document.document_number}</p>
            </div>
          </div>
          <div className="absolute -bottom-5 border-b-2 border-black w-full"></div>
          <div className="absolute -bottom-6 border-b-2 border-black w-full"></div>
        </div>
        <div className="mt-10"></div>
        {/* <div className="flex justify-end">
          <div className="relative">
            <h1>견적일자 : 2025년 1월 9일</h1>
            <div className="absolute -bottom-2 border-b-[1px] border-black w-full"></div>
          </div>
        </div> */}

        <div className="grid grid-cols-5 mt-12 ">
          <div className="col-span-2 space-y-2 pr-16 font-semibold">
            {/* <div className="relative">
              <p>견적번호 : {document.document_number}</p>
              <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
            </div> */}
            <div className="relative">
              <p>회사명 : {document.content.company_name}</p>
              <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
            </div>
            <div className="relative">
              <p>담당자명 : {document.contact}</p>
              <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
            </div>
            <div className="relative">
              <p> TEL : {company_phone || "없음"} </p>
              <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
            </div>
            <div className="relative">
              <p>FAX : {company_fax || "없음"}</p>
              <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
            </div>
            <div className="relative">
              <p>유효기간 : {document.content.valid_until}</p>
              <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
            </div>
            <div className="relative">
              <p>납품일 : {document.content.delivery_term}</p>
              <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
            </div>
            <div className="relative">
              <p>결제방식 : {document.content.payment_method}</p>
              <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
            </div>
            <div className="relative">
              <p>납품장소 : {document.content.delivery_place}</p>
              <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
            </div>
            <div className="mt-12 relative">
              <p>
                견적자 :{" "}
                {users.find((user: any) => user.id === document.user_id).name}
              </p>
              <div className="absolute -bottom-1 border-b-[1px] border-black w-full"></div>
            </div>
            <p>아래와 같이 견적합니다.</p>
          </div>
          <div className="col-span-3 space-y-2 ml-12">
            <div className="flex items-center space-x-6">
              <Image
                src={"/images/logo.gif"}
                width="55"
                height="55"
                alt="logo"
              />
              <span className="font-bold text-xl">우 양 신 소 재</span>
              <Image
                src={"/images/dojang.gif"}
                width="55"
                height="55"
                alt="logo"
              />
            </div>
            <div className="flex space-x-4 font-semibold">
              <div>
                <p>본사 :</p>
              </div>
              <div>
                <p>대구광역시 북구 유통단지로 8길 21</p>
                <p>TEL : (053)383-5287</p>
                <p>FAX : (053)383-5283</p>
              </div>
            </div>
            <div className="flex space-x-4 font-semibold">
              <div>
                <p>공장 :</p>
              </div>
              <div>
                <p>구미시 산동면 첨단기업3로 81</p>
                <p>TEL : (054)476-3100</p>
                <p>FAX : (054)476-3104</p>
              </div>
            </div>
            <div className="space-y-2 font-semibold">
              <p>홈페이지 : www.iwooyang.com</p>
              <p>전자우편 : info@iwooyang.com</p>
            </div>
          </div>
        </div>
        <div>
          <table className="min-w-full table-auto border-collapse text-center mt-6">
            <thead>
              <tr className="bg-gray-100 text-left border-black border-2">
                <th className="px-4 py-2 border-black border-r-[1px] text-center">
                  No
                </th>
                <th className="px-4 py-2 border-black border-r-[1px] text-center  w-5/12">
                  품명
                </th>
                <th className="px-4 py-2 border-black border-r-[1px] text-center w-1/12">
                  규격
                </th>
                <th className="px-4 py-2 border-black border-r-[1px] text-center w-1/12">
                  수량
                </th>
                <th className="px-4 py-2 border-black border-r-[1px] text-center">
                  단가
                </th>
                <th className="px-4 py-2 border-black border-r-[1px] text-center">
                  금액
                </th>
              </tr>
            </thead>
            <tbody className="border-black border-2">
              {document.content.items?.map((item: any, index: any) => (
                <tr
                  className="hover:bg-gray-50 border-b-[1px] border-black"
                  key={index}
                >
                  <td className="px-4 py-2 border-black border-r-[1px]">
                    {index + 1}
                  </td>
                  <td className="px-4 py-2 border-black border-r-[1px]">
                    {item.name}
                  </td>
                  <td className="px-4 py-2 border-black border-r-[1px]">
                    {item.spec}
                  </td>
                  <td className="px-4 py-2 border-black border-r-[1px]">
                    {item.quantity}
                    {item.unit}
                  </td>
                  <td className="px-4 py-2 border-black border-r-[1px]">
                    {item.unit_price.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 border-black border-r-[1px]">
                    {item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="min-w-full table-auto border-collapse text-center mt-6">
            <thead>
              <tr className="text-left border-black border-2">
                <th className="px-4 py-2 border-black border-r-[1px] text-center">
                  합계(VAT별도) : 金원整 (₩
                  {document.content.total_amount.toLocaleString()})
                </th>
              </tr>
            </thead>
            <tbody className="border-black border-2">
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-2 border-black border-r-[1px]">
                  <div className="grid grid-cols-3">
                    <div className="border-r-[1px] border-black pr-4 col-span-1 text-xs text-start px-2">
                      <p>산업용섬유(불연,도전,고강도) 사업부</p>
                      <p>고기능 플렉시블호스 사업부</p>
                      <p>플라스틱 및 복합소재 사업부</p>
                      <p>특수벨트 및 풀리 사업부</p>
                      <p>기술자문 및 연구개발전문</p>
                    </div>
                    <div className="col-span-2 text-xs text-start px-2">
                      <div>
                        <p>특기사항</p>
                        <p>
                          Lorem, ipsum dolor sit amet consectetur adipisicing
                          elit. Eaque unde architecto tenetur officia libero
                          voluptates, esse error sapiente quidem! Dignissimos,
                          tempore repellendus. Quod architecto cupiditate minima
                          a fugit corrupti culpa!
                        </p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex justify-end space-x-4 mt-4">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm"
          >
            닫기
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm"
          >
            프린트
          </button>
        </div>
      </div>
      {/* dnl */}
    </div>
  );
};

export default DocumentModal;
