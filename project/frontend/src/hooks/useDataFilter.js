import { useMemo } from "react";

export const useDataFilter = (data, filters) => {
  return useMemo(() => {
    if (!data || !filters) return data;

    let filtered = [...data];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((item) => {
        return Object.values(item).some(
          (val) =>
            val &&
            typeof val === "string" &&
            val.toLowerCase().includes(searchLower)
        );
      });
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date || item.created_at || item.breeding_date);
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          if (itemDate < fromDate) return false;
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (itemDate > toDate) return false;
        }
        return true;
      });
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(
        (item) =>
          item.status === filters.status ||
          item.breeding_status === filters.status ||
          item.payment_status === filters.status
      );
    }

    // Generic filters (custom fields)
    Object.entries(filters).forEach(([key, value]) => {
      if (
        value &&
        key !== "search" &&
        key !== "dateFrom" &&
        key !== "dateTo" &&
        key !== "status"
      ) {
        filtered = filtered.filter(
          (item) => item[key] === value || item[`${key}_id`] === value
        );
      }
    });

    return filtered;
  }, [data, filters]);
};
