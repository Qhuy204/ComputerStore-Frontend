import React from 'react';
import NotFound from '../pages/admin/notfound.js';

const Custom404 = () => {
    return <NotFound />;
};

Custom404.getLayout = function getLayout(page) {
    return page;
};

export default Custom404;
