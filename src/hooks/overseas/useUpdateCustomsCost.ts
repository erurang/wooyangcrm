import useSWRMutation from "swr/mutation";
import { CustomsCostFormData } from "@/types/overseas";

interface UpdateCustomsCostArgs {
  id: string;
  data: CustomsCostFormData;
}

async function updateCustomsCost(
  url: string,
  { arg }: { arg: UpdateCustomsCostArgs }
) {
  const res = await fetch(`${url}/${arg.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...arg.data,
      air_freight: arg.data.air_freight === "" ? 0 : arg.data.air_freight,
      sea_freight: arg.data.sea_freight === "" ? 0 : arg.data.sea_freight,
      customs_duty: arg.data.customs_duty === "" ? 0 : arg.data.customs_duty,
      port_charges: arg.data.port_charges === "" ? 0 : arg.data.port_charges,
      domestic_transport: arg.data.domestic_transport === "" ? 0 : arg.data.domestic_transport,
      express_freight: arg.data.express_freight === "" ? 0 : arg.data.express_freight,
      vat: arg.data.vat === "" ? 0 : arg.data.vat,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "통관비용 수정에 실패했습니다.");
  }

  return res.json();
}

export function useUpdateCustomsCost() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/api/customs-costs",
    updateCustomsCost
  );

  return {
    updateCustomsCost: trigger,
    isUpdating: isMutating,
    error,
  };
}
