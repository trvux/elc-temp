import { formatPrice } from "@/modules/catalog/domain/price";

interface FormattedPriceProps {
  price: number | null | undefined;
  strikethrough?: boolean;
}

export function FormattedPrice({ price, strikethrough = false }: FormattedPriceProps) {
  const formatted = formatPrice(price);

  if (formatted === "Liên hệ") {
    return <>{formatted}</>;
  }

  const numberPart = formatted.replace(/\s?₫$/, "").trim();
  const dong = <span className="text-sm font-semibold relative -top-0.5 ml-0.5">đ</span>;

  if (strikethrough) {
    return (
      <span className="line-through">
        {numberPart}
        {dong}
      </span>
    );
  }

  return (
    <>
      {numberPart}
      {dong}
    </>
  );
}
