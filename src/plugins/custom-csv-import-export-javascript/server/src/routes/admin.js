
export default {
    type: 'admin',
    routes: [
        {
            method: 'GET',
            path: '/content-types',
            handler: 'contentTypeController.getContentTypes',
            config: { policies: [] },
        },
        {
            method: 'GET',
            path: '/export/:contentTypeUid',
            handler: 'exportController.export',
            config: { policies: [] },
        },
        {
            method: 'POST',
            path: '/import',
            handler: 'importController.importData',
            config: { policies: [] },
        },
        {
            method: 'POST',
            path: '/import-summary',
            handler: 'importController.importSummary',
            config: { policies: [] },
        },
    ],
};
