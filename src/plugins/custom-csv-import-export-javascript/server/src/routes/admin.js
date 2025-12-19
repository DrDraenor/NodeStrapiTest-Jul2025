
export default {
    type: 'admin',
    routes: [
        {
            method: 'GET',
            path: '/export/hotels',
            handler: 'exportController.export',
            config: {
                policies: [],
            },
        },
        {
            method: 'POST',
            path: '/import/hotels',
            handler: 'importController.importHotels',
            config: {
                policies: [],
            },
        },
    ],
};
