"use client";

import { TextAlignCenter, TextAlignLeft, TextAlignRight } from "@phosphor-icons/react";
import { Control, Controller, FieldValues } from "react-hook-form";

import { TitleAlign } from "@/shared/lib/title-align";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

// TitleAlignField is the left/center/right picker shown next to a title
// input's label in every admin edit form that has a titleAlign field
// (news, project, page, service, product, branch) — extracted after this
// exact ToggleGroup+Controller block had been copy-pasted into 3 modules.
// Every form using this must name its field "titleAlign" (all of them do).
interface TitleAlignFieldProps<T extends FieldValues & { titleAlign: TitleAlign }> {
  control: Control<T>;
}

export function TitleAlignField<T extends FieldValues & { titleAlign: TitleAlign }>({
  control,
}: TitleAlignFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={"titleAlign" as never}
      render={({ field }) => (
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={field.value}
          onValueChange={(value) => {
            // Radix ToggleGroup type="single" fires onValueChange with ""
            // when the already-selected item is clicked again (its
            // "deselect" behavior) — ignore that so titleAlign can never
            // end up empty/unselected in the form.
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
