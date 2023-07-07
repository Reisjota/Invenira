const { MoleculerClientError } = require("moleculer").Errors;
const DbService = require("../mixins/db.mixin");
const moodle_client = require("moodle-client");

module.exports = {
	name: "host_system_handler",
	mixins: [
		DbService("users")
	],

	settings: {

		rest: "users/",

		/** Public fields */
		fields: [],

		/** Validator schema for entity */
		entityValidator: {}
	},

	/**
	 * Actions
	 */
	actions: {
				/**
		 * Register a new iap
		 *
		 * @actions
		 * @param {Object} user - User details. 
		 * @returns {Object} Created entity + id
		 */
		create: {
			rest: "POST /:lmsStdId/:iap",
			params: {
				lmsStdId: { type: "string" },
				iap: { type: "string" }
			},
			async handler(ctx) {
				let entity = ctx.params;
				this.logger.info("Create user: " + JSON.stringify(entity));
				const doc = await this.adapter.insert(entity);
				const user = await this.transformDocuments(ctx, {}, doc);
				return this.entityChanged("created", user, ctx).then(() => user);
			}
		},
		/**
		 * Get user
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
				this.logger.info("Search by USER ID: " + JSON.stringify(entity));
				const find = await this.adapter.findById(entity);
				this.logger.info("Search result: " + JSON.stringify(find));
				if (!find)
					throw new MoleculerClientError("USER not found!", 404);
				return await find;
			}
		},
		find: {
			rest: "GET /:lmsStdId/:iap",
			params: {
				lmsStdId: { type: "string" },
				iap: { type: "string" }
			},
			async handler(ctx) {
				const lmsStdId = await ctx.params.lmsStdId;
				const iap = await ctx.params.iap;
				this.logger.info("Search by USER ID: " + JSON.stringify(lmsStdId));
				const query = {lmsStdId : lmsStdId, iap : iap};
				var find = await this.adapter.findOne(query,{});
				this.logger.info("Search result: " + JSON.stringify(find));
				if(find===null){
					find={};
				}
				return await find;
			}
		},
		/**
		 * List Users from Moodle
		 *
		 * @actions
		 * @returns {Array} List of users
		 */
		list: {
			rest: "GET /",
			async handler() {
				const listUsers = await this.adapter.find({});
				this.logger.info("listUsers: " + JSON.stringify(listUsers));
				return listUsers;
			}
		}
	},

	methods: {
		init_moodle() {
			moodle_client.init({
				wwwroot: "http://localhost",
				token: "51dd38d7539155560e87974c2f843686"

			}).then(function (client) {
				return client.call({
					wsfunction: "core_user_get_users_by_field",
					method: "GET",
					args: {
						field: "email",
						values: ["api@invenira.com"]
					}
				}).then(function (response) {
					//this.logger.info("Moodle Response: " + JSON.stringify(response));
					console.log("Moodle Response: " + JSON.stringify(response));
					return;
				});

			}).catch(function (err) {
				//this.logger.info("Unable to initialize moodle client: " + err);
			});
		}

	}
};
