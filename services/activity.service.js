const { MoleculerClientError } = require("moleculer").Errors;
const DbService = require("../mixins/db.mixin");


module.exports = {
	name: "activity",
	mixins: [
		DbService("activities")
	],

	settings: {

		rest: "activity/",

		/** Public fields */
		fields: ["_id", "name", "properties", "config_url", "json_params_url", "user_url", "analytics_url", "analytics_list_url"],

		/** Validator schema for entity */
		entityValidator: {
			name: { type: "string" },
			properties: { type: "string" },
			config_url: { type: "string" },
			json_params_url: { type: "string" },
			user_url: { type: "string" },
			analytics_url: { type: "string" },
			analytics_list_url: { type: "array" }
		}
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Register a new activity
		 *
		 * @actions
		 * @param {Object} Activity - Activity details. Name is mandatory
		 * @returns {Object} Created entity + id
		 */
		create: {
			params: {
				name: { type: "string" }
			},
			async handler(ctx) {
				let entity = ctx.params;
				this.logger.info("Create Activity: " + JSON.stringify(entity));
				const doc = await this.adapter.insert(entity);
				const activity = await this.transformDocuments(ctx, {}, doc);
				return this.entityChanged("created", activity, ctx).then(() => activity);
			}
		},
		/**
		 * Get Activity
		 *
		 * @actions
		 * @param {String} id - Activity ID
		 * @returns {Object} Activity if found
		 */
		get: {
			rest: "GET /:id",
			params: {
				id: { type: "string" }
			},
			async handler(ctx) {
				const entity = await ctx.params.id;
				this.logger.info("Search by Activity ID: " + JSON.stringify(entity));
				const find = await this.adapter.findById(entity);
				this.logger.info("Search result: " + JSON.stringify(find));
				if (!find)
					throw new MoleculerClientError("Activity not found!", 404);
				return await find;
			}
		},
		/**
		 * List Activities
		 *
		 * @actions
		 * @returns {Array} List of available IAPs
		 */
		list: {
			rest: "GET /",
			async handler() {
				const listActivities = await this.adapter.find({});
				this.logger.info("listActivities: " + JSON.stringify(listActivities));
				return listActivities;
			}
		}
	},
};

