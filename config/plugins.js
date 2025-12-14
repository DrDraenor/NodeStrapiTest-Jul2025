module.exports = () => ({
	'populate-all': {
		enabled: true,
		config: {
			// Populate all relations recursively (default)
			relations: true,
		},
	},
	'strapi-csv-import-export': {
		config: {
			authorizedExports: ["api::machine.machine", "api::hotel"],
			authorizedImports: ["api::machine.machine"]
		},
	},
	"custom-csv-import-export": {
		enabled: true,
		resolve: "./src/plugins/custom-csv-import-export",
	},
});
