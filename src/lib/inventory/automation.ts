import { supabase } from "@/lib/supabaseClient";

interface DocumentItem {
  id: string;
  product_id: string | null;
  name: string;
  spec: string | null;
  quantity: string;
  unit: string | null;
  unit_price: number;
  amount: number;
}

interface ProcessResult {
  success: boolean;
  taskId?: string;
  lotsCreated: number;
  lotsDeducted: number;
  stockUpdated: number;
  warnings: string[];
  errors: string[];
}

/**
 * 문서 완료 시 재고 자동 처리
 *
 * - 발주서(order) 완료 → inventory_task(inbound) + LOT 생성 + stock 증가
 * - 견적서(estimate) 완료 → inventory_task(outbound) + FIFO 차감 + stock 감소
 *
 * 비차단: 재고 처리 실패해도 문서 상태 변경은 유지됨
 */
export async function processDocumentCompletion(
  documentId: string,
  userId?: string
): Promise<ProcessResult> {
  const result: ProcessResult = {
    success: false,
    lotsCreated: 0,
    lotsDeducted: 0,
    stockUpdated: 0,
    warnings: [],
    errors: [],
  };

  try {
    // 1. 문서 정보 조회
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, document_number, type, company_id, delivery_date, status")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      result.errors.push(`문서 조회 실패: ${docError?.message || "문서 없음"}`);
      return result;
    }

    if (document.status !== "completed") {
      result.errors.push("완료된 문서만 재고 처리 가능합니다.");
      return result;
    }

    // 2. document_items 조회
    const { data: items, error: itemsError } = await supabase
      .from("document_items")
      .select("id, product_id, name, spec, quantity, unit, unit_price, amount")
      .eq("document_id", documentId);

    if (itemsError) {
      result.errors.push(`품목 조회 실패: ${itemsError.message}`);
      return result;
    }

    // product_id가 연결된 품목만 필터
    const linkedItems = (items || []).filter((item) => item.product_id);
    const unlinkedItems = (items || []).filter((item) => !item.product_id);

    if (unlinkedItems.length > 0) {
      result.warnings.push(
        `${unlinkedItems.length}개 품목이 제품에 연결되지 않아 재고 처리가 생략됩니다: ${unlinkedItems.map((i) => i.name).join(", ")}`
      );
    }

    if (linkedItems.length === 0) {
      result.warnings.push("연결된 품목이 없어 재고 처리를 건너뜁니다.");
      result.success = true;
      return result;
    }

    // 3. inventory_task 생성 (이미 존재하는지 확인)
    const { data: existingTask } = await supabase
      .from("inventory_tasks")
      .select("id")
      .eq("document_id", documentId)
      .maybeSingle();

    const taskType = document.type === "order" ? "inbound" : "outbound";
    let taskId: string;

    if (existingTask) {
      taskId = existingTask.id;
    } else {
      const { data: newTask, error: taskError } = await supabase
        .from("inventory_tasks")
        .insert({
          document_id: document.id,
          document_number: document.document_number,
          document_type: document.type,
          task_type: taskType,
          company_id: document.company_id,
          expected_date: document.delivery_date,
          status: "pending",
          assigned_by: userId || null,
        })
        .select("id")
        .single();

      if (taskError) {
        result.errors.push(`재고 작업 생성 실패: ${taskError.message}`);
        return result;
      }
      taskId = newTask.id;
    }

    result.taskId = taskId;

    // 4. 문서 유형별 재고 처리
    if (document.type === "order") {
      // 발주서 → 입고 처리
      await processInbound(linkedItems, document, taskId, userId, result);
    } else if (document.type === "estimate") {
      // 견적서 → 출고 처리
      await processOutbound(linkedItems, document, taskId, userId, result);
    }

    // 5. 작업 상태 완료로 변경
    await supabase
      .from("inventory_tasks")
      .update({
        status: "completed",
        completed_by: userId || null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    result.success = true;

    // 로그 기록
    await supabase.from("logs").insert({
      table_name: "inventory_tasks",
      operation: "AUTO_PROCESS",
      record_id: taskId,
      old_data: null,
      new_data: {
        document_id: documentId,
        document_type: document.type,
        task_type: taskType,
        lots_created: result.lotsCreated,
        lots_deducted: result.lotsDeducted,
        stock_updated: result.stockUpdated,
        warnings: result.warnings,
      },
      changed_by: userId || null,
    });

    return result;
  } catch (error) {
    result.errors.push(`재고 처리 중 예외: ${String(error)}`);
    return result;
  }
}

/**
 * 발주서 완료 → 입고 처리
 * 각 product_id 있는 item에 대해:
 * 1. LOT 생성 (source_type: "purchase")
 * 2. lot_transaction 기록
 * 3. products.current_stock += quantity
 * 4. product_transactions 기록
 */
async function processInbound(
  items: DocumentItem[],
  document: any,
  taskId: string,
  userId: string | undefined,
  result: ProcessResult
) {
  for (const item of items) {
    if (!item.product_id) continue;

    const quantity = parseFloat(item.quantity) || 0;
    if (quantity <= 0) {
      result.warnings.push(`${item.name}: 수량이 0 이하입니다.`);
      continue;
    }

    try {
      // LOT 번호 생성
      const { data: lotNumber, error: lotNumError } = await supabase.rpc(
        "generate_lot_number"
      );

      if (lotNumError) {
        result.errors.push(`${item.name}: LOT 번호 생성 실패`);
        continue;
      }

      // LOT 생성
      const { data: lot, error: lotError } = await supabase
        .from("inventory_lots")
        .insert({
          product_id: item.product_id,
          lot_number: lotNumber,
          initial_quantity: quantity,
          current_quantity: quantity,
          unit: item.unit,
          source_type: "purchase",
          source_document_id: document.id,
          supplier_company_id: document.company_id,
          status: "available",
          unit_cost: item.unit_price || null,
          total_cost: item.amount || null,
          received_at: new Date().toISOString(),
          notes: `자동 입고: ${document.document_number}`,
          created_by: userId || null,
        })
        .select("id")
        .single();

      if (lotError) {
        result.errors.push(`${item.name}: LOT 생성 실패 - ${lotError.message}`);
        continue;
      }

      result.lotsCreated++;

      // lot_transaction 기록
      await supabase.from("lot_transactions").insert({
        lot_id: lot.id,
        transaction_type: "inbound",
        quantity,
        quantity_before: 0,
        quantity_after: quantity,
        document_id: document.id,
        notes: `발주서 완료 자동 입고: ${document.document_number}`,
        created_by: userId || null,
      });

      // product stock 업데이트
      const { data: product } = await supabase
        .from("products")
        .select("current_stock")
        .eq("id", item.product_id)
        .single();

      const stockBefore = product?.current_stock || 0;
      const stockAfter = stockBefore + quantity;

      await supabase
        .from("products")
        .update({ current_stock: stockAfter, updated_at: new Date().toISOString() })
        .eq("id", item.product_id);

      // product_transactions 기록
      await supabase.from("product_transactions").insert({
        product_id: item.product_id,
        transaction_type: "inbound",
        quantity,
        stock_before: stockBefore,
        stock_after: stockAfter,
        reference_type: "document",
        reference_id: document.id,
        notes: `발주서 완료 자동 입고: ${document.document_number}`,
        transaction_date: new Date().toISOString(),
        created_by: userId || null,
      });

      result.stockUpdated++;
    } catch (error) {
      result.errors.push(`${item.name}: 입고 처리 예외 - ${String(error)}`);
    }
  }
}

/**
 * 견적서 완료 → 출고 처리
 * 각 product_id 있는 item에 대해:
 * 1. FIFO로 available LOT에서 차감
 * 2. lot_transaction 기록
 * 3. products.current_stock -= quantity
 * 4. product_transactions 기록
 * 5. 재고 부족 시 경고 (차단하지 않음)
 */
async function processOutbound(
  items: DocumentItem[],
  document: any,
  taskId: string,
  userId: string | undefined,
  result: ProcessResult
) {
  for (const item of items) {
    if (!item.product_id) continue;

    const quantity = parseFloat(item.quantity) || 0;
    if (quantity <= 0) {
      result.warnings.push(`${item.name}: 수량이 0 이하입니다.`);
      continue;
    }

    try {
      // 현재 재고 확인
      const { data: product } = await supabase
        .from("products")
        .select("current_stock")
        .eq("id", item.product_id)
        .single();

      const stockBefore = product?.current_stock || 0;

      if (stockBefore < quantity) {
        result.warnings.push(
          `${item.name}: 재고 부족 (현재: ${stockBefore}, 필요: ${quantity}). 가능한 만큼만 차감합니다.`
        );
      }

      // FIFO: 가장 오래된 available LOT부터 차감
      const { data: lots } = await supabase
        .from("inventory_lots")
        .select("id, current_quantity, lot_number")
        .eq("product_id", item.product_id)
        .eq("status", "available")
        .gt("current_quantity", 0)
        .order("received_at", { ascending: true })
        .order("created_at", { ascending: true });

      let remaining = quantity;

      for (const lot of lots || []) {
        if (remaining <= 0) break;

        const deductQty = Math.min(remaining, lot.current_quantity);
        const qtyBefore = lot.current_quantity;
        const qtyAfter = qtyBefore - deductQty;

        // LOT 수량 업데이트
        await supabase
          .from("inventory_lots")
          .update({
            current_quantity: qtyAfter,
            status: qtyAfter <= 0 ? "depleted" : "available",
            updated_at: new Date().toISOString(),
          })
          .eq("id", lot.id);

        // lot_transaction 기록
        await supabase.from("lot_transactions").insert({
          lot_id: lot.id,
          transaction_type: "outbound",
          quantity: deductQty,
          quantity_before: qtyBefore,
          quantity_after: qtyAfter,
          document_id: document.id,
          notes: `견적서 완료 자동 출고: ${document.document_number}`,
          created_by: userId || null,
        });

        remaining -= deductQty;
        result.lotsDeducted++;
      }

      // 실제 차감된 수량 (재고 부족 시 전체 수량보다 적을 수 있음)
      const actualDeducted = quantity - Math.max(remaining, 0);

      // product stock 업데이트
      const stockAfter = Math.max(stockBefore - actualDeducted, 0);

      await supabase
        .from("products")
        .update({ current_stock: stockAfter, updated_at: new Date().toISOString() })
        .eq("id", item.product_id);

      // product_transactions 기록
      await supabase.from("product_transactions").insert({
        product_id: item.product_id,
        transaction_type: "outbound",
        quantity: actualDeducted,
        stock_before: stockBefore,
        stock_after: stockAfter,
        reference_type: "document",
        reference_id: document.id,
        notes: `견적서 완료 자동 출고: ${document.document_number}`,
        transaction_date: new Date().toISOString(),
        created_by: userId || null,
      });

      result.stockUpdated++;

      if (remaining > 0) {
        result.warnings.push(
          `${item.name}: ${remaining}${item.unit || "개"} 재고 부족으로 미차감`
        );
      }
    } catch (error) {
      result.errors.push(`${item.name}: 출고 처리 예외 - ${String(error)}`);
    }
  }
}
