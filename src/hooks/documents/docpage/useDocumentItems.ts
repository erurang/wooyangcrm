"use client";

import { useState, useEffect, useCallback } from "react";
import { numberToKorean } from "@/lib/numberToKorean";

interface Item {
  name: string;
  spec?: string;
  quantity: string | number;
  unit_price: number;
  amount: number;
}

const initialItem: Item = {
  name: "",
  spec: "",
  quantity: "",
  unit_price: 0,
  amount: 0,
};

export function useDocumentItems() {
  const [items, setItems] = useState<Item[]>([{ ...initialItem }]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [koreanAmount, setKoreanAmount] = useState("");

  const calculateTotalAmount = useCallback(() => {
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    setTotalAmount(total);
    setKoreanAmount(numberToKorean(total));
  }, [items]);

  useEffect(() => {
    calculateTotalAmount();
  }, [calculateTotalAmount]);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { ...initialItem }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleQuantityChange = useCallback((index: number, value: string) => {
    const numericPart = value.replace(/[^0-9.,-]/g, "");
    const parsedNumber = parseFloat(numericPart.replace(/,/g, "")) || 0;
    const unit = value.replace(/[0-9.,-]/g, "").trim();

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              quantity: numericPart !== "" ? `${numericPart}${unit}` : "",
              amount: parsedNumber * item.unit_price,
            }
          : item
      )
    );
  }, []);

  const handleUnitPriceChange = useCallback((index: number, value: string) => {
    const numericValue = value.replace(/[^0-9.,-]/g, "");
    const parsedUnitPrice = parseFloat(numericValue.replace(/,/g, "")) || 0;

    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const quantityPart = String(item.quantity).replace(/[^0-9.,-]/g, "");
        const parsedQty = parseFloat(quantityPart.replace(/,/g, "")) || 0;

        return {
          ...item,
          unit_price: parsedUnitPrice,
          amount: parsedQty * parsedUnitPrice,
        };
      })
    );
  }, []);

  const resetItems = useCallback(() => {
    setItems([{ ...initialItem }]);
  }, []);

  const setItemsFromDocument = useCallback(
    (documentItems: Item[]) => {
      setItems(
        documentItems.map((item) => ({
          name: item.name,
          spec: item.spec,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
        }))
      );
    },
    []
  );

  return {
    items,
    setItems,
    totalAmount,
    koreanAmount,
    addItem,
    removeItem,
    handleQuantityChange,
    handleUnitPriceChange,
    resetItems,
    setItemsFromDocument,
  };
}
