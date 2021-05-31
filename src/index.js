

var FFCJsClient = {
    user: {
        userName: '',
        email: '',
        country: '',
        key: '',
        customizeProperties: []
    },
    workspaceSecret: '',
    initialize: function (workspaceSecret, user) {
        this.workspaceSecret = workspaceSecret;
        this.user = user;
    },

    variation: function (featureFlagKey, isHttps = true) {
        const Http = new XMLHttpRequest();
        const url = 'https://api.feature-flags.co';
        if (isHttps === false || isHttps === 'false')
            url = 'http://api.feature-flags.co';
        var postUrl = url + '/Variation/GetUserVariationResult';

        var xhr = new XMLHttpRequest();
        xhr.open("POST", postUrl, false);

        xhr.setRequestHeader("Content-type", "application/json");

        var sendData = {
            featureFlagKeyName: featureFlagKey,
            workspaceSecret: this.workspaceSecret,
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
    }
}

export { FFCJsClient };