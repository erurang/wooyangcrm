"use client";

import { Fragment } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface HeadlessSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  focusClass?: string;
}

export default function HeadlessSelect({
  value,
  onChange,
  options,
  placeholder = "선택하세요",
  disabled = false,
  icon,
  className = "",
  focusClass = "focus:ring-blue-500",
}: HeadlessSelectProps) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <ListboxButton
          className={`relative w-full ${
            icon ? "pl-10" : "pl-4"
          } pr-10 py-2.5 text-left bg-white border border-gray-300 rounded-lg text-sm cursor-pointer focus:outline-none focus:ring-2 ${focusClass} focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-150 hover:border-gray-400 ${className}`}
        >
          {icon && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              {icon}
            </span>
          )}
          <span
            className={`block truncate ${
              selectedOption ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {selectedOption ? (
              <>
                {selectedOption.label}
                {selectedOption.sublabel && (
                  <span className="text-gray-500 ml-1">
                    {selectedOption.sublabel}
                  </span>
                )}
              </>
            ) : (
              placeholder
            )}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </span>
        </ListboxButton>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
            {options.length === 0 ? (
              <div className="py-2.5 px-4 text-gray-400 text-center">
                옵션이 없습니다
              </div>
            ) : (
              options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  className="relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors data-[active]:bg-blue-50 data-[active]:text-blue-900 text-gray-900 data-[selected]:bg-blue-50"
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-semibold" : "font-normal"
                        }`}
                      >
                        {option.label}
                        {option.sublabel && (
                          <span className="text-gray-500 ml-1 font-normal">
                            {option.sublabel}
                          </span>
                        )}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </ListboxOption>
              ))
            )}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
}
