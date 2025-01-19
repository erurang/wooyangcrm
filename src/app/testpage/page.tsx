"use client";

import Image from "next/image";

export default function HomePage() {
  return (
    <div>
      <div className="flex justify-center relative">
        <h1 className="font-bold text-4xl">
          견{"  "}적{"  "}서
        </h1>
        <div className="absolute -bottom-5 border-b-2 border-black w-full"></div>
        <div className="absolute -bottom-6 border-b-2 border-black w-full"></div>
      </div>
      <div className="mt-10"></div>
      <div className="flex justify-end relative">
        <div>
          <h1>견적일자 : 2025년 1월 9일</h1>
          <div className="absolute -bottom-2 border-b-[1px] border-black w-full"></div>
        </div>
      </div>

      <div className="grid grid-cols-5 mt-12 ">
        <div className="col-span-2 space-y-2 pr-16 font-semibold">
          <div className="relative">
            <p>견적번호 : {document.document_number}</p>
            <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
          </div>
          <div className="relative">
            <p>회사명 : {document.content.company_name}</p>
            <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
          </div>
          <div className="relative">
            <p>담당자명 : {document.contact}</p>
            <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
          </div>
          <div className="relative">
            <p> TEL : {document.content.phone || "없음"} </p>
            <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
          </div>
          <div className="relative">
            <p>FAX : {document.content.fax || "없음"}</p>
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
            <p>견적자 : users</p>
            <div className="absolute -bottom-1 border-b-[1px] border-black w-full"></div>
          </div>
          <p>아래와 같이 견적합니다.</p>
        </div>
        <div className="col-span-3 space-y-2 ml-12">
          <div className="flex items-center space-x-6">
            <Image src={"/images/logo.gif"} width="55" height="55" alt="logo" />
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
            {document.contentType.items.map((item: any, index: any) => (
              <tr className="hover:bg-gray-50">
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
                합계(VAT별도) : 금원금 (W51,100,000)
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
                        tempore repellendus. Quod architecto cupiditate minima a
                        fugit corrupti culpa!
                      </p>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
