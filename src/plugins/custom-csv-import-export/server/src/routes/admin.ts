export default [
    {
        method: 'GET',
        path: '/export/hotels',
        handler: 'exportController.export',
        config: {
            policies: [],
        },
    },
];
