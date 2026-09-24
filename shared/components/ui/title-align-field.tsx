"use client";

import { TextAlignCenter, TextAlignLeft, TextAlignRight } from "@phosphor-icons/react";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";

import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

// TitleAlignField is the left/center/right picker shown next to a title/name
// input's label in every admin edit form that has a left/center/right
// alignment field — extracted after this exact ToggleGroup+Controller block
// had been copy-pasted into 3 modules. `name` is required (not hardcoded to
// "titleAlign") because the title-equivalent field is called "name" in some
// modules (product, branch) and "title" in others (news, project, page,
// service) — the alignment field follows suit (nameAlign vs titleAlign).
interface TitleAlignFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
}

export function TitleAlignField<T extends FieldValues>({
  control,
  name,
}: TitleAlignFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={field.value}
          onValueChange={(value) => {
            // Radix ToggleGroup type="single" fires onValueChange with ""
            // when the already-selected item is clicked again (its
            // "deselect" behavior) — ignore that so the field can never end
            // up empty/unselected in the form.
            if (value) field.onChange(value);
          }}
        >
          <ToggleGroupItem value="left" aria-label="Căn trái" title="Căn trái">
            <TextAlignLeft className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Căn giữa" title="Căn giữa">
            <TextAlignCenter className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Căn phải" title="Căn phải">
            <TextAlignRight className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      )}
    />
  );
}
