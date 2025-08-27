import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    const productId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "6months";

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (range) {
      case "1month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "3months":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "6months":
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "1year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "all":
        startDate.setFullYear(2020); // Or your system start date
        break;
    }

    // Get product details with current inventory
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select(`
        *,
        inventory (
          current_stock,
          reserved_stock,
          available_stock
        )
      `)
      .eq("id", productId)
      .single();

    if (productError) throw productError;

    // Aggregate inventory data
    const product = {
      ...productData,
      current_stock: productData.inventory?.reduce((sum: number, inv: any) => sum + (inv.current_stock || 0), 0) || 0,
      available_stock: productData.inventory?.reduce((sum: number, inv: any) => sum + (inv.available_stock || 0), 0) || 0,
      reserved_stock: productData.inventory?.reduce((sum: number, inv: any) => sum + (inv.reserved_stock || 0), 0) || 0,
    };
    delete product.inventory;

    // Get all transactions for this product in date range
    const { data: transactions, error: transError } = await supabase
      .from("documents")
      .select(`
        id,
        type,
        doc_number,
        created_at,
        content,
        status,
        companies (
          id,
          name
        )
      `)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .in("type", ["quote", "order", "purchase_order"])
      .eq("status", "completed");

    if (transError) throw transError;

    // Process transactions to extract product-specific data
    const productTransactions: any[] = [];
    const customerStats = new Map();
    const monthlyStats = new Map();
    let totalSales = 0;
    let totalRevenue = 0;
    const prices: number[] = [];
    const priceHistory: any[] = [];

    transactions?.forEach((doc) => {
      const items = doc.content?.items || [];
      const relevantItems = items.filter((item: any) => {
        // Match by product name or code (considering normalization)
        const itemName = item.description?.toLowerCase() || "";
        const productName = product.name?.toLowerCase() || "";
        const productCode = product.code?.toLowerCase() || "";
        
        return itemName.includes(productName) || 
               itemName.includes(productCode) ||
               item.productId === productId;
      });

      relevantItems.forEach((item: any) => {
        const quantity = parseFloat(item.quantity || 0);
        const unitPrice = parseFloat(item.unitPrice || 0);
        const totalAmount = quantity * unitPrice;

        // Add to transactions list
        productTransactions.push({
          id: doc.id,
          date: doc.created_at,
          type: doc.type === "purchase_order" ? "IN" : "OUT",
          document_type: doc.type,
          document_number: doc.doc_number,
          company_name: doc.companies?.name || "Unknown",
          quantity,
          unit_price: unitPrice,
          total_amount: totalAmount
        });

        // Update statistics
        if (doc.type !== "purchase_order") {
          totalSales += quantity;
          totalRevenue += totalAmount;
          prices.push(unitPrice);

          // Price history
          priceHistory.push({
            date: doc.created_at,
            price: unitPrice,
            quantity,
            company: doc.companies?.name || "Unknown"
          });

          // Customer analysis
          const companyId = doc.companies?.id;
          if (companyId) {
            if (!customerStats.has(companyId)) {
              customerStats.set(companyId, {
                company_id: companyId,
                company_name: doc.companies?.name,
                total_quantity: 0,
                total_amount: 0,
                order_count: 0,
                orders: [],
                prices: []
              });
            }
            const stats = customerStats.get(companyId);
            stats.total_quantity += quantity;
            stats.total_amount += totalAmount;
            stats.order_count += 1;
            stats.orders.push(new Date(doc.created_at));
            stats.prices.push(unitPrice);
          }

          // Monthly trend
          const monthKey = new Date(doc.created_at).toISOString().slice(0, 7);
          if (!monthlyStats.has(monthKey)) {
            monthlyStats.set(monthKey, {
              month: monthKey,
              sales_quantity: 0,
              revenue: 0,
              order_count: 0
            });
          }
          const monthStat = monthlyStats.get(monthKey);
          monthStat.sales_quantity += quantity;
          monthStat.revenue += totalAmount;
          monthStat.order_count += 1;
        }
      });
    });

    // Calculate customer analytics
    const customerAnalysis = Array.from(customerStats.values()).map(stats => {
      const sortedOrders = stats.orders.sort((a: Date, b: Date) => a.getTime() - b.getTime());
      let totalDaysBetween = 0;
      let orderPairs = 0;

      for (let i = 1; i < sortedOrders.length; i++) {
        const daysBetween = Math.floor(
          (sortedOrders[i].getTime() - sortedOrders[i - 1].getTime()) / (1000 * 60 * 60 * 24)
        );
        totalDaysBetween += daysBetween;
        orderPairs++;
      }

      return {
        company_id: stats.company_id,
        company_name: stats.company_name,
        total_quantity: stats.total_quantity,
        total_amount: stats.total_amount,
        order_count: stats.order_count,
        last_order_date: sortedOrders[sortedOrders.length - 1]?.toISOString() || null,
        average_price: stats.total_amount / stats.total_quantity,
        purchase_frequency: orderPairs > 0 ? Math.round(totalDaysBetween / orderPairs) : 0
      };
    }).sort((a, b) => b.total_quantity - a.total_quantity);

    // Calculate statistics
    const uniqueCustomers = new Set(customerAnalysis.map(c => c.company_id));
    const repeatCustomers = customerAnalysis.filter(c => c.order_count > 1).length;
    
    const statistics = {
      totalSales,
      totalRevenue,
      averagePrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0
      },
      totalCustomers: uniqueCustomers.size,
      repeatCustomers,
      averageOrderSize: productTransactions.filter(t => t.type === "OUT").length > 0 
        ? totalSales / productTransactions.filter(t => t.type === "OUT").length 
        : 0,
      lastOrderDate: productTransactions.length > 0 
        ? productTransactions[productTransactions.length - 1].date 
        : null,
      firstOrderDate: productTransactions.length > 0 
        ? productTransactions[0].date 
        : null,
      orderFrequency: 0 // Will calculate if needed
    };

    // Sort and prepare data
    const monthlyTrend = Array.from(monthlyStats.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(stat => ({
        ...stat,
        month: new Date(stat.month + "-01").toLocaleDateString("ko-KR", { 
          year: "numeric", 
          month: "short" 
        })
      }));

    const sortedPriceHistory = priceHistory.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const recentTransactions = productTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50); // Last 50 transactions

    return NextResponse.json({
      product,
      statistics,
      priceHistory: sortedPriceHistory,
      customerAnalysis,
      monthlyTrend,
      recentTransactions
    });
  } catch (error) {
    console.error("Error fetching product analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch product analytics" },
      { status: 500 }
    );
  }
}