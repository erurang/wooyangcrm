"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveTableWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * 반응형 테이블 래퍼 컴포넌트
 * - 모바일에서 가로 스크롤 지원
 * - 일관된 스타일링
 *
 * @example
 * <ResponsiveTableWrapper>
 *   <table className="min-w-full">...</table>
 * </ResponsiveTableWrapper>
 */
export function ResponsiveTableWrapper({
  children,
  className,
}: ResponsiveTableWrapperProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto -mx-4 sm:mx-0 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent",
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

/**
 * 반응형 테이블 컴포넌트
 * - 자동 가로 스크롤
 * - 일관된 스타일링
 *
 * @example
 * <ResponsiveTable>
 *   <thead>...</thead>
 *   <tbody>...</tbody>
 * </ResponsiveTable>
 */
export function ResponsiveTable({
  children,
  className,
}: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
      <table
        className={cn(
          "min-w-full divide-y divide-slate-200",
          className
        )}
      >
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <thead className={cn("bg-slate-50", className)}>
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={cn("bg-white divide-y divide-slate-100", className)}>
      {children}
    </tbody>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  header?: boolean;
}

/**
 * 반응형 테이블 셀
 * @param hideOnMobile - 모바일에서 숨김 (< 640px)
 * @param hideOnTablet - 태블릿 이하에서 숨김 (< 768px)
 */
export function TableCell({
  children,
  className,
  hideOnMobile = false,
  hideOnTablet = false,
  header = false,
}: TableCellProps) {
  const Tag = header ? "th" : "td";
  const baseClasses = header
    ? "px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
    : "px-4 py-3 whitespace-nowrap text-sm";

  const responsiveClasses = hideOnTablet
    ? "hidden md:table-cell"
    : hideOnMobile
    ? "hidden sm:table-cell"
    : "";

  return (
    <Tag className={cn(baseClasses, responsiveClasses, className)}>
      {children}
    </Tag>
  );
}

/**
 * 모바일 카드 레이아웃과 데스크톱 테이블 레이아웃을 함께 사용할 때
 * @example
 * // 모바일 카드 보기
 * <MobileOnlyView>
 *   <CardList items={items} />
 * </MobileOnlyView>
 *
 * // 데스크톱 테이블 보기
 * <DesktopOnlyView>
 *   <ResponsiveTable>...</ResponsiveTable>
 * </DesktopOnlyView>
 */
export function MobileOnlyView({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("sm:hidden", className)}>
      {children}
    </div>
  );
}

export function DesktopOnlyView({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("hidden sm:block", className)}>
      {children}
    </div>
  );
}
