var FFCJsClient = {
    user: {
        userName: '',
        email: '',
        country: '',
        key: '',
        customizeProperties: []
    },
    environmentSecret: '',
    isHttps: true,
    initialize: function (environmentSecret, user, isHttps = true) {
        this.environmentSecret = environmentSecret;
        this.user = user;
        this.isHttps = isHttps;
    },

    variation: function (featureFlagKey, defaultResult = false) {
        try {
            const Http = new XMLHttpRequest();
            let url = 'https://api.feature-flags.co';
            if (this.isHttps === false || this.isHttps === 'false')
                url = 'http://api.feature-flags.co';
            var postUrl = url + '/Variation/GetUserVariationResult';

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

            if (xhr.status === 200) {
                console.log(xhr.responseText);
            }
            if (xhr.responseText === 'true')
                return true;
            if (xhr.responseText === 'false')
                return false;

            return xhr.responseText;
        } catch (err) {
            return defaultResult;
        }
    }
}

export { FFCJsClient };
