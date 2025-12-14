export default {
    async export(ctx) {
        try {
            // Call the export service
            const csv = await strapi
                .plugin('custom-csv-import-export')
                .service('exportService')
                .exportHotels();

            // Set response headers for CSV download
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `hotels-${timestamp}.csv`;

            // Wrap CSV in JSON to ensure safe transport via useFetchClient
            ctx.body = {
                data: csv
            };
            ctx.set('Content-Type', 'application/json');
        } catch (error) {
            strapi.log.error('Error in export controller:', error);
            ctx.status = 500;
            ctx.body = {
                error: {
                    message: 'Failed to export hotels',
                    details: error.message,
                },
            };
        }
    },
};
