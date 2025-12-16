module.exports = () => ({
	'populate-all': {
		enabled: true,
		config: {
			// Populate all relations recursively (default)
			relations: true,
		},
	},
	"custom-csv-import-export-javascript": {
		enabled: true,
		resolve: "./src/plugins/custom-csv-import-export-javascript",
	},
});
