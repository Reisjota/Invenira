const { MoleculerClientError } = require("moleculer").Errors;

const DbService = require("../mixins/db.mixin");

module.exports = {
	name: "iap",
	mixins: [
		DbService("iaps")
	],

	settings: {

		rest: "iap/",

		/** Public fields */
		fields: ["_id", "name", "properties", "nodes", "edges"],

		/** Validator schema for entity */
		entityValidator: {
			name: { type: "string" },
			properties: { type: "object" },
			nodes: { type: "array" },
			edges: { type: "array" },
		}
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Register a new iap
		 *
		 * @actions
		 * @param {Object} iap - IAP details. Name is mandatory
		 * @returns {Object} Created entity + id
		 */
		create: {
			params: {
				name: { type: "string" }
			},
			async handler(ctx) {
				let entity = ctx.params;
				this.logger.info("Create IAP: " + JSON.stringify(entity));
				const doc = await this.adapter.insert(entity);
				const iap = await this.transformDocuments(ctx, {}, doc);
				return this.entityChanged("created", iap, ctx).then(() => iap);
			}
		},
		/**
		 * Get IAP
		 *
		 * @actions
		 * @param {String} id - IAP ID
		 * @returns {Object} IAP if found
		 */
		get: {
			rest: "GET /:id",
			params: {
				id: { type: "string" }
			},
			async handler(ctx) {
				const entity = await ctx.params.id;
				this.logger.info("Search by IAP ID: " + JSON.stringify(entity));
				const find = await this.adapter.findById(entity);
				this.logger.info("Search result: " + JSON.stringify(find));
				if (!find)
					throw new MoleculerClientError("IAP not found!", 404);
				return await find;
			}
		},
		/**
		 * List IAPs
		 *
		 * @actions
		 * @returns {Array} List of available IAPs
		 */
		list: {
			rest: "GET /",
			async handler() {
				const listIAPs = await this.adapter.find({});
				this.logger.info("listIAPs: " + JSON.stringify(listIAPs));
				return listIAPs;
			}
		}
	},
};
