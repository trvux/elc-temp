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
  const dong = <span className="type-label relative -top-0.5 ml-0.5">đ</span>;

  if (strikethrough) {
    return (
      <s>
        {numberPart}
        {dong}
      </s>
    );
  }

  return (
    <>
      {numberPart}
      {dong}
    </>
  );
}
