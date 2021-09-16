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
	trackCustomEvent (data) {
		data = data || [];
		return this.track(data.map(d => Object.assign({}, d, {type: 'CustomEvent'})));
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
	variation: function (featureFlagKey, defaultResult) {
		try {
			if (defaultResult === undefined || defaultResult === null) {
				defaultResult = 'false';
			}

			var postUrl = this.baseUrl + '/Variation/GetMultiOptionVariation';

			var xhr = new XMLHttpRequest();
			xhr.open("POST", postUrl, false);

			xhr.setRequestHeader("Content-type", "application/json");

			var sendData = {
				featureFlagKeyName: featureFlagKey,
				environmentSecret: this.environmentSecret,
				ffUserName: this.user.userName,
				ffUserEmail: this.user.email,
				ffUserCountry: this.user.country,
				ffUserKeyId: this.user.key,
				ffUserCustomizedProperties: this.user.customizeProperties
			}
			//将用户输入值序列化成字符串
			xhr.send(JSON.stringify(sendData));

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
