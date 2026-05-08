// function to calculate limit and offset for pagination
const getPagination = (page, size) => {
    // set limit (number of items per page), default is 10
    const limit = size ? +size : 10;

    // calculate offset (starting point)
    const offset = page ? page * limit : 0;

    return { limit, offset };
};

// function to format paginated response data
const getPagingData = (data, page, limit) => {
    // extract total count and rows from database result
    const { count: totalItems, rows: items } = data;

    // get current page number
    const currentPage = page ? +page : 0;

    // calculate total number of pages
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, items, totalPages, currentPage };
};

// export functions
module.exports = { getPagination, getPagingData };