var FFCJsClient = {
    user: {
        userName: '',
        email: '',
        country: '',
        key: '',
        customizeProperties: []
    },
    environmentSecret: '',
    baseUrl: 'https://api.feature-flags.co',
	appType: 'Javascript',
    initialize: function (environmentSecret, user, baseUrl, appType) {
		this.environmentSecret = environmentSecret;
		this.user = user;
		this.baseUrl = baseUrl || this.baseUrl;
		this.appType = appType || this.appType;
	},
	initUserInfo (user) {
		if (!!user) {
			this.user = Object.assign({}, this.user, user);
		}
	},
	async trackCustomEventAsync (data) {
		data = data || [];
		return await this.trackAsync(data.map(d => Object.assign({}, d, {type: 'CustomEvent'})));
	},
	trackCustomEvent (data) {
		data = data || [];
		return this.track(data.map(d => Object.assign({}, d, {type: 'CustomEvent'})));
	},
	async trackAsync(data) {
		try {
			var postUrl = this.baseUrl + '/ExperimentsDataReceiver/PushData';

			const payload = data.map(d => Object.assign({}, {
				secret: this.environmentSecret,
				route: location.pathname,
				timeStamp: Date.now(),
				appType: this.appType,
				user: {
					fFUserName: this.user.userName,
					fFUserEmail: this.user.email,
					fFUserCountry: this.user.country,
					fFUserKeyId: this.user.key,
					fFUserCustomizedProperties: this.user.customizeProperties
				}
			}, d));

			const response = await fetch(postUrl, {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				  },
				  body: JSON.stringify(payload)
			});

			if (!response.ok) {
				throw new Error(`An error has occured: ${response.status}`);
			}

			return true;
		} catch(error) {
			console.log(error);
			return false;
		}
	},
	track: function (data) {
		try {
			var postUrl = this.baseUrl + '/ExperimentsDataReceiver/PushData';

			var xhr = new XMLHttpRequest();
			xhr.open("POST", postUrl, false);

			xhr.setRequestHeader("Content-type", "application/json");

			const payload = data.map(d => Object.assign({}, {
				secret: this.environmentSecret,
				route: location.pathname,
				timeStamp: Date.now(),
				appType: this.appType,
				user: {
					fFUserName: this.user.userName,
					fFUserEmail: this.user.email,
					fFUserCountry: this.user.country,
					fFUserKeyId: this.user.key,
					fFUserCustomizedProperties: this.user.customizeProperties
				}
			}, d));

			//将用户输入值序列化成字符串
			xhr.send(JSON.stringify(payload));

			if (xhr.status !== 200) {
				return false;
			}

			return true;
		} catch (err) {
			return false;
		}
	},
	getVariationPayloadStr(featureFlagKey) {
		return JSON.stringify({
			featureFlagKeyName: featureFlagKey,
			environmentSecret: this.environmentSecret,
			ffUserName: this.user.userName,
			ffUserEmail: this.user.email,
			ffUserCountry: this.user.country,
			ffUserKeyId: this.user.key,
			ffUserCustomizedProperties: this.user.customizeProperties
		});
	},
	async variationAsync(featureFlagKey, defaultResult) {
		if (defaultResult === undefined || defaultResult === null) {
			defaultResult = 'false';
		}
		
		try {
			var postUrl = this.baseUrl + '/Variation/GetMultiOptionVariation';

			const response = await fetch(postUrl, {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				  },
				  body: this.getVariationPayloadStr(featureFlagKey)
			});

			if (!response.ok) {
				throw new Error(`An error has occured: ${response.status}`);
			}

			const result = await response.text();
			return JSON.parse(result);
		} catch(error) {
			console.log(error);
			return defaultResult;
		}
	},
	variation: function (featureFlagKey, defaultResult) {
		if (defaultResult === undefined || defaultResult === null) {
			defaultResult = 'false';
		}

		try {
			var postUrl = this.baseUrl + '/Variation/GetMultiOptionVariation';

			var xhr = new XMLHttpRequest();
			xhr.open("POST", postUrl, false);

			xhr.setRequestHeader("Content-type", "application/json");

			//将用户输入值序列化成字符串
			xhr.send(this.getVariationPayloadStr(featureFlagKey));

			if (xhr.status !== 200) {
				return defaultResult;
			}

			const result = JSON.parse(xhr.responseText);

			if (!!result['code'] && result['code'] === 'Error') {
				return defaultResult;
			}

			return result.variationValue;
		} catch (err) {
			return defaultResult;
		}
	}
}

export { FFCJsClient };
