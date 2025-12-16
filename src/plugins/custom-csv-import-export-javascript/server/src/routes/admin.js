
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
    ],
};
