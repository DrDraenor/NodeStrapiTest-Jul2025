'use strict';

module.exports = ({ strapi }) => ({
    async getContentTypes(ctx) {
        try {
            const data = await strapi
                .plugin('custom-csv-import-export-javascript')
                .service('adminService')
                .getContentTypes();
            ctx.body = { data };
        } catch (err) {
            ctx.throw(500, err.message);
        }
    },
});
