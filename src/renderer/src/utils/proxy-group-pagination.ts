export const PROXY_GROUP_PAGINATION_THRESHOLD = 50
export const PROXY_GROUP_PAGE_SIZE = 50

export interface GroupPaginationState {
  needsPagination: boolean
  page: number
  pageCount: number
  startIndex: number
  endIndex: number
}

export function getGroupPagination(
  totalCount: number,
  page: number
): GroupPaginationState {
  if (totalCount <= PROXY_GROUP_PAGINATION_THRESHOLD) {
    return {
      needsPagination: false,
      page: 1,
      pageCount: 1,
      startIndex: 0,
      endIndex: totalCount
    }
  }

  const pageCount = Math.ceil(totalCount / PROXY_GROUP_PAGE_SIZE)
  const safePage = Math.min(Math.max(page, 1), pageCount)
  const startIndex = (safePage - 1) * PROXY_GROUP_PAGE_SIZE
  const endIndex = Math.min(startIndex + PROXY_GROUP_PAGE_SIZE, totalCount)

  return {
    needsPagination: true,
    page: safePage,
    pageCount,
    startIndex,
    endIndex
  }
}

export function paginateItems<T>(items: T[], page: number): { visibleItems: T[]; pagination: GroupPaginationState } {
  const pagination = getGroupPagination(items.length, page)
  const visibleItems = items.slice(pagination.startIndex, pagination.endIndex)

  return { visibleItems, pagination }
}
