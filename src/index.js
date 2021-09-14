const kernal = {
	user: {
        userName: '',
        email: '',
        country: '',
        key: '',
        customizeProperties: []
    },
    environmentSecret: '',
	storage: {setItem: () => {}, getItem: () => '{}'},
    baseUrl: 'https://api.feature-flags.co',
	initialize: function (environmentSecret, user, storage, baseUrl) {
		this.environmentSecret = environmentSecret;
		this.user = user;
		this.baseUrl = baseUrl || this.baseUrl;
		this.storage = storage || this.storage;
	},
	getPayloadStr(featureFlagKey) {
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
	async variationAsync(featureFlagKey) {
		const storageKey = `ffc_ffkey_${featureFlagKey}`;
		try {
			var postUrl = this.baseUrl + '/Variation/GetMultiOptionVariation';

			const response = await fetch(postUrl, {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				  },
				  body: this.getPayloadStr(featureFlagKey)
			});

			if (!response.ok) {
				throw new Error(`An error has occured: ${response.status}`);
			}

			const result = await response.text();
			this.storage.setItem(storageKey, result);
			return JSON.parse(result);
		} catch(error) {
			console.log(error);
			var item = this.storage.getItem(storageKey);
			if (item === null) {
				return null;
			}

			return JSON.parse(item);
		}
	},
	variationSync(featureFlagKey) {
		const storageKey = `ffc_ffkey_${featureFlagKey}`;
		try {
			var postUrl = this.baseUrl + '/Variation/GetMultiOptionVariation';

			var xhr = new XMLHttpRequest();
			xhr.open("POST", postUrl, false);
			xhr.setRequestHeader("Content-type", "application/json");

			//将用户输入值序列化成字符串
			xhr.send(this.getPayloadStr(featureFlagKey));

			if (xhr.status !== 200) {
				throw new Error(`An error has occured: ${xhr.status}`);
			}

			this.storage.setItem(storageKey, xhr.responseText);
			return JSON.parse(xhr.responseText);
		} catch (error) {
			console.log(error);
			var item = this.storage.getItem(storageKey);
			if (item === null) {
				return null;
			}

			return JSON.parse(item);
		}
	}
};

const client = new Proxy(kernal, {
	get (target, name, receiver) {
		if (name in target) {
			const value = target[name];
			if (typeof value === 'function') {
				return value.bind(target);
			} else {
				return value;
			}
		} else {
			return target.variationSync(name);
		}
	}
});

export { client };
