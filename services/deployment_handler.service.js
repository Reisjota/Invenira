const { MoleculerClientError } = require("moleculer").Errors;
const request = require("request");

const DbService = require("../mixins/db.mixin");

module.exports = {
	name: "deploymenthandler",
	mixins: [
		DbService("deployed_iaps")
	],

	settings: {

		rest: "deploy/",

		/** Public fields */
		fields: ["_id", "name", "properties", "nodes", "edges"],

		/** Validator schema for entity */
		entityValidator: {
			name: { type: "string" },
			properties: { type: "array" },
			nodes: { type: "array" },
			edges: { type: "array" },
			objectives: { type: "array" }
		}
	},

	/**
	 * Actions
	 */
	actions: {
		get: {
			rest: "GET /:id",
			params: {
				id: { type: "string" }
			},
			/*async handler(ctx) {
				const entity = await ctx.params.id;
				this.logger.info("Search by deployed IAP ID: " + JSON.stringify(entity));
				const find = await this.adapter.findById(entity);
				this.logger.info("Search result: " + JSON.stringify(find));
				if (!find)
					throw new MoleculerClientError("deployed IAP not found!", 404);
				return await find;
			}*/

			async handler(ctx) {
				const entity = await ctx.params.id;
				const find = await this.adapter.find(entity);
				this.logger.info("Search result: " + JSON.stringify(find));
				return find;
			}
		},
		/**
		 * Deploy a IAP
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
				let entity = await ctx.params;
				let url = await "http://localhost:"+process.env.PORT+process.env.ENDPOINT;
				const activityId = await entity.nodes[0].act_id;
				let activity = await new Promise(function (resolve, reject) {
					request.get(url+"/activity/"+activityId, function (error, res, body) {
						if (!error && res.statusCode == 200) {
							const jsonData = JSON.parse(body);
							resolve(jsonData);
						} else {
							reject(error);
						}
					});
				});
				let deployURL = await new Promise(function (resolve, reject) {
					request.post(activity.user_url+"/"+activityId, function (error, res, body) {
						if (!error && res.statusCode == 200) {
							const jsonData = JSON.parse(body);
							console.log("Json response: " + JSON.stringify(jsonData));
							resolve(jsonData.deployURL);
						} else {
							reject(error);
						}
					});
				});
				
				entity.deployURL= deployURL;
				this.logger.info("Deploy IAP: " + JSON.stringify(entity));
				const doc = await this.adapter.insert(entity);
				const iap = await this.transformDocuments(ctx, {}, doc);
				return this.entityChanged("created", iap, ctx).then(() => iap);
			}
		},
		/**
		 * Get list of activity links for given IAP
		 *
		 * @actions
		 * @param {String} id - IAP ID
		 * @returns {Object} List of activity urls
		 */
		getActivitiesForIAP: {
			rest: "GET /activities/:id",
			params: {
				id: { type: "string" }
			},
			async handler(ctx) {
				console.log("hey");
				const entity = await ctx.params.id;
				this.logger.info("ID: " + JSON.stringify(entity));

				const sample_payload = [
					{
						"_id": "123",
						"name": "Group Roles",
						"deployment_url": "http://tiagoc.xyz/invenira/deploy/activity?id=64a3fa101345d4b792686a56"
					}/*,
					//{
						"_id": "1234",
						"name": "Youtube Video",
						"deployment_url": "http://tiagoc.xyz/invenira/deploy/activity?id=1234"
					}*/
				];
				return sample_payload;
			}
		},
		/**
		 * Triggers a deployed activity and redirects to configured url, with given configuration
		 *
		 * @actions
		 * @param {String} id - Activity ID
		 * @returns {Object} Activity
		 */
		initiateActivity: {
			rest: "GET /activity",
			params: {
				id: { type: "string" },
				userId: { type: "string" }
			},
			async handler(ctx) {
				this.logger.info("Deployed Activity ID: " + ctx.params.id);
				this.logger.info("Deployed Activity Moodle ID: " + ctx.params.userId);

				let url = await "http://localhost:"+process.env.PORT+process.env.ENDPOINT;

				// Find student
				this.logger.info("Deployed Activity Internal Student ID: " + ctx.params.userId);
				let user = await new Promise(function (resolve, reject) {
					request.get(url+"/users/"+ctx.params.userId+"/"+ctx.params.id, function (error, res, body) {
						if (!error && res.statusCode == 200) {
							const jsonData = JSON.parse(body);
							resolve(jsonData);
						} else {
							reject(error);
						}
					});
				});

				this.logger.info("... the user: " + JSON.stringify(user));

				if(Object.keys(user).length === 0){
					user = await new Promise(function (resolve, reject) {
						request.post(url+"/users/"+ctx.params.userId+"/"+ctx.params.id, function (error, res, body) {
							if (!error && res.statusCode == 200) {
								const jsonData = JSON.parse(body);
								resolve(jsonData);
							} else {
								reject(error);
							}
						});
					});
				}

				//Find activity
				let activity = await new Promise(function (resolve, reject) {
					request.get(url+"/iap/"+ctx.params.id, function (error, res, body) {
						if (!error && res.statusCode == 200) {
							const jsonData = JSON.parse(body);
							resolve(jsonData);
						} else {
							reject(error);
						}
					});
				});
				this.logger.info("... the activity: " + JSON.stringify(activity));



				//Find deployed activity
				const deployed_iap = await this.adapter.find(ctx.params.id);
				this.logger.info("... the deployed_iap: " + JSON.stringify(deployed_iap));

				const json_payload = {
					"activityID": ctx.params.id,
					"inveniraStdID": user._id,
					"json_params": activity.nodes[0].params
				};

				this.logger.info("JSON Deploy Data: " + JSON.stringify(json_payload));

				this.logger.info("redirecting to: " + deployed_iap[0].deployURL[0]);

				var options = {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					},
					url: deployed_iap[0].deployURL[0],
					body: JSON.stringify(json_payload)
				  };

				let redirectURL = await new Promise(function (resolve, reject) {
					request.get(options, function (error, res, body) {
						if (!error && res.statusCode == 200) {
							const jsonData = JSON.parse(body);
							//console.log("Json response: " + JSON.stringify(jsonData));
							resolve(jsonData.deployURL);
						} else {
							reject(error);
						}
					});
				});

				console.log("redirectURL: " + redirectURL);

				ctx.meta.$statusCode = 301;
				ctx.meta.$location = redirectURL;
				return;
			}
		},
		/**
		 * Get a deployed IAP by ID
		 *
		 * @actions
		 * @param {String} id - IAP ID
		 * @returns {Object} IAP if found
		 */
		getDeployedIAP: {
			rest: "GET /iap/:id",
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
		 * List All Deployed IAPs
		 *
		 * @actions
		 * @returns {Array} List of available IAPs
		 */
		listDeployedIAPs: {
			rest: "GET /list",
			async handler() {
				const listDeployedIAPs = await this.adapter.find({});
				this.logger.info("listDeployedIAPs: " + JSON.stringify(listDeployedIAPs));
				return listDeployedIAPs;
			}
		}
	},
};
