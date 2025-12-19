
const exportController = ({ strapi }) => ({
    async export(ctx) {
        try {
            const { contentTypeUid } = ctx.params;
            const csv = await strapi
                .plugin('custom-csv-import-export-javascript')
                .service('exportService')
                .exportData(contentTypeUid);

            ctx.body = { data: csv };
            ctx.set('Content-Type', 'application/json');
        } catch (error) {
            strapi.log.error('Error in export controller:', error);
            ctx.status = 500;
            ctx.body = {
                error: {
                    message: 'Failed to export data',
                    details: error.message,
                },
            };
        }
    },
});

export default exportController;
