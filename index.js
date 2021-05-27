

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

    variation: function (featureFlagKey, defaultValue, isHttps = true) {
        const Http = new XMLHttpRequest();
        const url = 'https://ffc-ce2.chinaeast2.cloudapp.chinacloudapi.cn';
        if (isHttps == false)
            url = 'http://ffc-ce2.chinaeast2.cloudapp.chinacloudapi.cn';
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

        return xhr.responseText;
    }
}

export { FFCJsClient };