import { isServer, TPagedList, TPagedParams } from '@cromwell/core';

export const getPageId = (pageNum: number) => "infinity-page_" + pageNum;

export const getPageNumsAround = (currentPage: number, quantity: number, maxPageNum: number): number[] => {
    const pages: number[] = [];
    const half = Math.floor(quantity / 2);
    const fromStart = currentPage - half < 1 ? true : false;
    const fromEnd = currentPage + half > maxPageNum ? true : false;
    const startIndex = fromStart ? 1 : fromEnd ? (maxPageNum - quantity) : currentPage - half;
    const endIndex = fromStart ? quantity : fromEnd ? maxPageNum : currentPage + half;
    // console.log('fromStart', fromStart, 'fromEnd', fromEnd, 'startIndex', startIndex, 'endIndex', endIndex)
    for (let i = startIndex; i <= endIndex; i++) {
        const num = i;
        if (num <= maxPageNum)
            pages.push(num)
    }
    return pages;
}

export const getPagedUrl = (pageNum: number, pathname?: string): string | undefined => {
    if (!isServer()) {
        const urlParams = new URLSearchParams(window.location.search);
        if (pageNum) urlParams.set('pageNumber', pageNum + '');
        else urlParams.delete('pageNumber');
        return window.location.pathname + '?' + urlParams.toString();
    }
    else {
        return pathname ? pathname + `?pageNumber=${pageNum}` : undefined;
    }

}