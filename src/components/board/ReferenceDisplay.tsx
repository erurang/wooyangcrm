"use client";

import Link from "next/link";
import { Building2, FileText, MessageSquare, ExternalLink } from "lucide-react";
import type { PostReference, ReferenceType } from "@/types/post";

interface ReferenceDisplayProps {
  references: PostReference[];
}

const typeLabels: Record<ReferenceType, string> = {
  company: "거래처",
  consultation: "상담",
  document: "문서",
};

const typeIcons: Record<ReferenceType, React.ReactNode> = {
  company: <Building2 className="w-4 h-4" />,
  consultation: <MessageSquare className="w-4 h-4" />,
  document: <FileText className="w-4 h-4" />,
};

const typeColors: Record<ReferenceType, string> = {
  company: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  consultation: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
  document: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
};

const getLink = (type: ReferenceType, id: string): string => {
  switch (type) {
    case "company":
      return `/companies/${id}`;
    case "consultation":
      return `/consultations/${id}`;
    case "document":
      return `/documents/estimate?search=${id}`;
    default:
      return "#";
  }
};

export default function ReferenceDisplay({ references }: ReferenceDisplayProps) {
  if (!references || references.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <span className="text-gray-500">연결된 항목</span>
        <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">
          {references.length}
        </span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {references.map((ref) => (
          <Link
            key={ref.id}
            href={getLink(ref.reference_type, ref.reference_id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors ${typeColors[ref.reference_type]}`}
          >
            {typeIcons[ref.reference_type]}
            <span className="font-medium">{ref.reference_name || typeLabels[ref.reference_type]}</span>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </Link>
        ))}
      </div>
    </div>
  );
}
