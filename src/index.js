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
    initialize: function (environmentSecret, user, baseUrl) {
		this.environmentSecret = environmentSecret;
		this.user = user;
		this.baseUrl = baseUrl || this.baseUrl;
	},
	track: function (data) {
		try {
			var postUrl = this.baseUrl + '/ExperimentsDataReceiver/PushData';

			var xhr = new XMLHttpRequest();
			xhr.open("POST", postUrl, false);

			xhr.setRequestHeader("Content-type", "application/json");

			const payload = data.map(d => Object.assign({}, {
				secret: this.environmentSecret,
				user: {
					ffUserName: this.user.userName,
					ffUserEmail: this.user.email,
					ffUserCountry: this.user.country,
					ffUserKeyId: this.user.key,
					ffUserCustomizedProperties: this.user.customizeProperties
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
	variation: function (featureFlagKey, defaultResult = false) {
		try {
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
