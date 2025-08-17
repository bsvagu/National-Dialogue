import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    onPageChange: (offset: number) => void;
  };
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  pagination,
  loading = false,
  emptyMessage = "No data available"
}: DataTableProps<T>) {
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0;
  const currentPage = pagination ? Math.floor(pagination.offset / pagination.limit) + 1 : 0;

  const handlePrevPage = () => {
    if (pagination && pagination.offset > 0) {
      pagination.onPageChange(Math.max(0, pagination.offset - pagination.limit));
    }
  };

  const handleNextPage = () => {
    if (pagination && currentPage < totalPages) {
      pagination.onPageChange(pagination.offset + pagination.limit);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)} className={column.className}>
                  {column.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={columns.length} 
                className="text-center py-8 text-slate-500"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow key={item.id || index}>
                {columns.map((column) => (
                  <TableCell key={String(column.key)} className={column.className}>
                    {column.render 
                      ? column.render(item) 
                      : item[column.key as keyof T]
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
          </TableBody>
        </Table>
      </div>

      {pagination && data.length > 0 && (
        <div className="px-3 sm:px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
          <p className="text-sm text-slate-600 order-2 sm:order-1">
            <span className="hidden sm:inline">Showing <span className="font-medium">{pagination.offset + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(pagination.offset + pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-medium">{pagination.total}</span> results</span>
            <span className="sm:hidden">{pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}</span>
          </p>
          <div className="flex items-center space-x-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              data-testid="button-prev-page"
              className="text-xs sm:text-sm"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <span className="text-sm text-slate-600 px-2">
              <span className="hidden sm:inline">Page {currentPage} of {totalPages}</span>
              <span className="sm:hidden">{currentPage}/{totalPages}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              data-testid="button-next-page"
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 sm:ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
