import { ChatLogKind } from "./types";

export const CHAT_LOG_KINDS: { value: ChatLogKind; label: string }[] = [
  { value: "search", label: "Tìm kiếm sản phẩm" },
  { value: "compare", label: "So sánh sản phẩm" },
  { value: "rank", label: "Xếp hạng theo tiêu chí" },
  { value: "purchase_intent", label: "Muốn mua hàng" },
  { value: "off_topic", label: "Hỏi bảo hành/giao hàng/lắp đặt" },
  { value: "no_context_compare", label: "So sánh (chưa rõ đang xem loại nào)" },
];
