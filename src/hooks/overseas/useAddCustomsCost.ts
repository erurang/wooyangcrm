import useSWRMutation from "swr/mutation";
import { ShippingMethodType, CustomsCostFormData } from "@/types/overseas";

async function addCustomsCost(
  url: string,
  { arg }: { arg: CustomsCostFormData }
) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...arg,
      air_freight: arg.air_freight === "" ? 0 : arg.air_freight,
      sea_freight: arg.sea_freight === "" ? 0 : arg.sea_freight,
      customs_duty: arg.customs_duty === "" ? 0 : arg.customs_duty,
      port_charges: arg.port_charges === "" ? 0 : arg.port_charges,
      domestic_transport: arg.domestic_transport === "" ? 0 : arg.domestic_transport,
      express_freight: arg.express_freight === "" ? 0 : arg.express_freight,
      vat: arg.vat === "" ? 0 : arg.vat,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "통관비용 추가에 실패했습니다.");
  }

  return res.json();
}

export function useAddCustomsCost() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/api/customs-costs",
    addCustomsCost
  );

  return {
    addCustomsCost: trigger,
    isAdding: isMutating,
    error,
  };
}
