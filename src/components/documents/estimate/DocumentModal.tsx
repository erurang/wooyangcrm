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
      printWindow.document.open();
      printWindow.document.write(`
        <html>
          <head>
            <title>견적서</title>
          </head>
          <body style="margin: 0; font-family: Arial, sans-serif; font-size : 12px;">
            <div style="background-color: white; padding: 24px; border-radius: 8px; width: 66%; max-width: 960px; margin: auto;">
              <div style="display: flex; justify-content: center; position: relative;">
                <h1 style="font-weight: bold; font-size: 32px;">견&nbsp;&nbsp;&nbsp;&nbsp;적&nbsp;&nbsp;&nbsp;&nbsp;서</h1>
                <div style="position: absolute; left: 0; bottom: -16px; display: flex; justify-content: flex-end;">
                  <div style="position: relative;">
                    <h1 style="font-size: 16px;">2025년 1월 9일</h1>
                  </div>
                </div>
                <div style="position: absolute; right: 0; bottom: -16px; display: flex; justify-content: flex-end;">
                  <div style="position: relative;">
                    <p style="font-size: 16px;">${document.document_number}</p>
                  </div>
                </div>
                <div style="position: absolute; bottom: -20px; border-bottom: 2px solid black; width: 100%;"></div>
                <div style="position: absolute; bottom: -24px; border-bottom: 2px solid black; width: 100%;"></div>
              </div>
              <div style="margin-top: 40px;"></div>
              <div style="display: grid; grid-template-columns: 2fr 3fr; gap: 24px; margin-top: 48px;">
                <div style="font-weight: bold; padding-right: 64px;">
                  <div style="position: relative; margin-bottom: 8px;">
                    <p>회사명 : ${document.content.company_name}</p>
                    <div style="position: absolute; bottom: -4px; border-bottom: 1px dotted black; width: 100%;"></div>
                  </div>
                  <div style="position: relative; margin-bottom: 8px;">
                    <p>담당자명 : ${document.contact}</p>
                    <div style="position: absolute; bottom: -4px; border-bottom: 1px dotted black; width: 100%;"></div>
                  </div>
                  <div style="position: relative; margin-bottom: 8px;">
                    <p>TEL : ${company_phone || "없음"}</p>
                    <div style="position: absolute; bottom: -4px; border-bottom: 1px dotted black; width: 100%;"></div>
                  </div>
                  <div style="position: relative; margin-bottom: 8px;">
                    <p>FAX : ${company_fax || "없음"}</p>
                    <div style="position: absolute; bottom: -4px; border-bottom: 1px dotted black; width: 100%;"></div>
                  </div>
                  <div style="position: relative; margin-bottom: 8px;">
                    <p>유효기간 : ${document.content.valid_until}</p>
                    <div style="position: absolute; bottom: -4px; border-bottom: 1px dotted black; width: 100%;"></div>
                  </div>
                  <div style="position: relative; margin-bottom: 8px;">
                    <p>납품일 : ${document.content.delivery_term}</p>
                    <div style="position: absolute; bottom: -4px; border-bottom: 1px dotted black; width: 100%;"></div>
                  </div>
                  <div style="position: relative; margin-bottom: 8px;">
                    <p>결제방식 : ${document.content.payment_method}</p>
                    <div style="position: absolute; bottom: -4px; border-bottom: 1px dotted black; width: 100%;"></div>
                  </div>
                  <div style="position: relative; margin-bottom: 8px;">
                    <p>납품장소 : ${document.content.delivery_place}</p>
                    <div style="position: absolute; bottom: -4px; border-bottom: 1px dotted black; width: 100%;"></div>
                  </div>
                  <div style="margin-top: 48px; position: relative;">
                    <p>견적자 : ${
                      users.find((user: any) => user.id === document.user_id)
                        .name
                    }</p>
                    <div style="position: absolute; bottom: -4px; border-bottom: 1px solid black; width: 100%;"></div>
                  </div>
                  <p style="margin-top: 16px;">아래와 같이 견적합니다.</p>
                </div>
                <div style="margin-left: 48px;">
                  <div style="display: flex; align-items: center; gap: 24px;">
                    <img src="/images/logo.gif" style="width: 55px; height: 55px;" alt="logo" />
                    <span style="font-weight: bold; font-size: 20px;">우 양 신 소 재</span>
                    <img src="/images/dojang.gif" style="width: 55px; height: 55px;" alt="logo" />
                  </div>
                  <div style="margin-top: 16px; font-weight: bold;">
                    <p>본사 : 대구광역시 북구 유통단지로 8길 21</p>
                    <p>TEL : (053)383-5287</p>
                    <p>FAX : (053)383-5283</p>
                  </div>
                  <div style="margin-top: 16px; font-weight: bold;">
                    <p>공장 : 구미시 산동면 첨단기업3로 81</p>
                    <p>TEL : (054)476-3100</p>
                    <p>FAX : (054)476-3104</p>
                  </div>
                  <div style="margin-top: 16px; font-weight: bold;">
                    <p>홈페이지 : www.iwooyang.com</p>
                    <p>전자우편 : info@iwooyang.com</p>
                  </div>
                </div>
                
              </div>
              <table style="width: 100%; border-collapse: collapse; margin-top: 24px; text-align: center;">
              <thead>
                <tr style="border: 2px solid black;">
                  <th style="padding: 8px; border-right: 1px solid black; text-align: center;">
                    합계(VAT별도) : 金원整 (₩
                    ${document.content.total_amount.toLocaleString()})
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 8px; border: 2px solid black;">
                    <div style="display: grid; grid-template-columns: 1fr 2fr; text-align: start;">
                      <div style="border-right: 1px solid black; padding-right: 8px;">
                        <p>산업용섬유(불연,도전,고강도) 사업부</p>
                        <p>고기능 플렉시블호스 사업부</p>
                        <p>플라스틱 및 복합소재 사업부</p>
                        <p>특수벨트 및 풀리 사업부</p>
                        <p>기술자문 및 연구개발전문</p>
                      </div>
                      <div style="padding-left: 8px;">
                        <p>특기사항</p>
                        <p>
                          Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                          Eaque unde architecto tenetur officia libero voluptates,
                          esse error sapiente quidem!
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
            <script>
              window.print();
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
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
          <div className="col-span-2 space-y-2 ml-12">
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
