import React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type DynamicFieldType = "text" | "textarea" | "number" | "date" | "dropdown" | "checkbox" | "file";

export interface DynamicField {
  id: number;
  key: string;
  label: string;
  fieldType: DynamicFieldType;
  isRequired: boolean;
  placeholder?: string | null;
  options: string[];
  sectionId: number | null;
  sortOrder: number;
  isActive: boolean;
}

export interface DynamicSection {
  id: number;
  title: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

interface DynamicUserProfileFieldsProps {
  fields: DynamicField[];
  sections: DynamicSection[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  className?: string;
}

export function DynamicUserProfileFields({
  fields,
  sections,
  values,
  onChange,
  className,
}: DynamicUserProfileFieldsProps) {
  // Filter and sort active sections and fields
  const activeSections = React.useMemo(() => {
    return [...sections]
      .filter((s) => s.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [sections]);

  const activeFields = React.useMemo(() => {
    return [...fields]
      .filter((f) => f.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [fields]);

  // Group fields by sectionId
  const fieldsBySection = React.useMemo(() => {
    const grouped: Record<string, DynamicField[]> = {};
    activeFields.forEach((field) => {
      const secId = field.sectionId ? String(field.sectionId) : "unsectioned";
      if (!grouped[secId]) {
        grouped[secId] = [];
      }
      grouped[secId]!.push(field);
    });
    return grouped;
  }, [activeFields]);

  const renderFieldInput = (field: DynamicField) => {
    const value = values[field.key] ?? "";
    const id = `dynamic-field-${field.key}`;

    switch (field.fieldType) {
      case "text":
        return (
          <Input
            id={id}
            type="text"
            required={field.isRequired}
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            className="h-11 border-slate-200 dark:border-slate-800"
          />
        );
      case "number":
        return (
          <Input
            id={id}
            type="number"
            required={field.isRequired}
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            className="h-11 border-slate-200 dark:border-slate-800"
          />
        );
      case "date":
        return (
          <Input
            id={id}
            type="date"
            required={field.isRequired}
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            className="h-11 border-slate-200 dark:border-slate-800"
          />
        );
      case "textarea":
        return (
          <Textarea
            id={id}
            required={field.isRequired}
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            className="min-h-[80px] border-slate-200 dark:border-slate-800"
          />
        );
      case "dropdown":
        return (
          <div className="relative">
            <select
              id={id}
              required={field.isRequired}
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="w-full h-11 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:bg-slate-950 dark:border-slate-800"
            >
              <option value="">{field.placeholder || "Select an option..."}</option>
              {field.options.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );
      case "checkbox":
        return (
          <div className="flex items-center space-x-2 py-2">
            <input
              id={id}
              type="checkbox"
              required={field.isRequired}
              checked={Boolean(value)}
              onChange={(e) => onChange(field.key, e.target.checked)}
              className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor={id}
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none cursor-pointer"
            >
              {field.placeholder || "Agree or acknowledge this setting"}
            </label>
          </div>
        );
      case "file":
        return (
          <div className="flex flex-col gap-1.5">
            <Input
              id={id}
              type="file"
              required={field.isRequired}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Mock a file upload object for dynamic profile compatibility
                  onChange(field.key, {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                  });
                } else {
                  onChange(field.key, null);
                }
              }}
              className="cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/40 dark:file:text-blue-300 hover:file:bg-blue-100"
            />
            {value && typeof value === "object" && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Selected: {value.name} ({Math.round(value.size / 1024)} KB)
              </span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderFieldsList = (fieldList: DynamicField[]) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fieldList.map((field) => (
          <div
            key={field.id}
            className={cn(
              "space-y-1.5",
              field.fieldType === "textarea" ? "sm:col-span-2" : ""
            )}
          >
            <label
              htmlFor={`dynamic-field-${field.key}`}
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderFieldInput(field)}
          </div>
        ))}
      </div>
    );
  };

  if (activeFields.length === 0) return null;

  return (
    <div className={cn("space-y-6 mt-4", className)}>
      {/* Sections with their specific fields */}
      {activeSections.map((sec) => {
        const sectionFields = fieldsBySection[String(sec.id)] || [];
        if (sectionFields.length === 0) return null;

        return (
          <div
            key={sec.id}
            className="p-5 rounded-xl border border-slate-200/60 bg-slate-50/50 dark:border-slate-800/60 dark:bg-slate-900/30 space-y-4"
          >
            <div className="border-b border-slate-200/50 dark:border-slate-800/50 pb-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {sec.title}
              </h4>
            </div>
            {renderFieldsList(sectionFields)}
          </div>
        );
      })}

      {/* Unsectioned Fields */}
      {fieldsBySection["unsectioned"] && fieldsBySection["unsectioned"].length > 0 && (
        <div className="space-y-4 pt-2">
          {renderFieldsList(fieldsBySection["unsectioned"])}
        </div>
      )}
    </div>
  );
}

export default DynamicUserProfileFields;
