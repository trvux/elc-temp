import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function ProductPagination({
  currentPage,
  totalPages,
}: ProductPaginationProps) {
  const getPageUrl = (page: number): string => `?page=${page}`;

  const renderPageLinks = (): (import("react").JSX.Element | null)[] => {
    const pages: number[] = [];
    const delta = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== -1) {
        pages.push(-1);
      }
    }

    return pages.map((page, index) => (
      <PaginationItem key={index}>
        {page === -1 ? (
          <PaginationEllipsis />
        ) : (
          <PaginationLink
            href={getPageUrl(page)}
            isActive={currentPage === page}
          >
            {page}
          </PaginationLink>
        )}
      </PaginationItem>
    ));
  };

  return (
    <Pagination className="mt-12">
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious href={getPageUrl(currentPage - 1)} text="Trước" />
          </PaginationItem>
        )}

        {renderPageLinks()}

        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext href={getPageUrl(currentPage + 1)} text="Sau" />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
