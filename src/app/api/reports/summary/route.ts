interface SummaryResponse {
  totalAmount: number;
  totalCount: number;
  statusCounts: Record<string, number>;
  topCompanies: { company_name: string; total_amount: number }[];
  topItems: { name: string; total_quantity: number; unit_price: number }[];
}

export async function GET() {}
