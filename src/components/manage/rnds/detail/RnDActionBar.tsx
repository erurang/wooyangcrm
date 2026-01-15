"use client";

interface RnDActionBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddClick: () => void;
  onEditNotesClick: () => void;
}

export default function RnDActionBar({
  searchTerm,
  onSearchChange,
  onAddClick,
  onEditNotesClick,
}: RnDActionBarProps) {
  return (
    <div className="flex my-4 gap-4">
      <div
        className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
        onClick={onAddClick}
      >
        <span className="mr-2">+</span>
        <span>내역 추가</span>
      </div>
      <div
        className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
        onClick={onEditNotesClick}
      >
        <span className="mr-2">+</span>
        <span>비고 추가/수정</span>
      </div>
      <div className="flex items-center border-b-2 border-gray-400 w-1/3 max-w-sm py-1 focus-within:border-black">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 50 50"
          width="18px"
          height="18px"
          className="text-gray-500"
        >
          <path d="M 21 3 C 11.601563 3 4 10.601563 4 20 C 4 29.398438 11.601563 37 21 37 C 24.355469 37 27.460938 36.015625 30.09375 34.34375 L 42.375 46.625 L 46.625 42.375 L 34.5 30.28125 C 36.679688 27.421875 38 23.878906 38 20 C 38 10.601563 30.398438 3 21 3 Z M 21 7 C 28.199219 7 34 12.800781 34 20 C 34 27.199219 28.199219 33 21 33 C 13.800781 33 8 27.199219 8 20 C 8 12.800781 7 21 7 Z" />
        </svg>
        <input
          type="text"
          placeholder="내역 검색"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="px-2 py-1 w-full focus:outline-none focus:border-none font-semibold text-gray-700"
        />
      </div>
    </div>
  );
}
