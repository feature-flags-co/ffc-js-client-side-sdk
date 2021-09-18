<!doctype html>
<html lang="en">

<head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Bootstrap CSS -->
    <link href="assets/css/bootstrap.min.511.css" rel="stylesheet" />
    <script src="assets/js/bootstrap.min.js"></script>
    <script src="index.js"></script>

    <title>feature-flags.co</title>
</head>

<body style="background-color: rgb(217 239 233);">
    <div class="container" id="version-a">
        <div class="row">
            <h3>产品经理版1</h3>
            <a href="#" style="font-size: 32px;">开始使用</a>
        </div>
    </div>
    <div class="container" id="version-b">
        <div class="row">
            <h3>程序员版1</h3>
            <a href="#" style="font-size: 32px;">开始使用</a>
        </div>
    </div>
    <div class="container" id="version-c">
        <div class="row">
            <h3>产品经理版2</h3>
            <a href="#" style="font-size: 32px;">开始使用</a>
        </div>
    </div>

    <style>
        .row {
            margin-top: 20px;
            text-align: center;
        }

        #version-a {
            display: none;
        }

        #version-b {
            display: none;
        }

        #version-c {
            display: none;
        }
    </style>

    <script src="http://pv.sohu.com/cityjson?ie=utf-8"></script>
    <script type="text/javascript">
        let userName = Date.now();

        // 初始化sdk，传入环境Secret Key和用户信息
        FFCJsClient.initialize('YThmLWRmZjUtNCUyMDIxMDkxNzA3NTYyMV9fMl9fMjJfXzExNl9fZGVmYXVsdF82NTM3Mg==');

        // 初始化用户信息，通常这一步会在登录后被调用
        FFCJsClient.initUserInfo({
            userName: 'sdk-sample-js-1252',
            email: '',
            key: 'sdk-sample-js-1252',
            customizeProperties: [
                {
                    name: "外放地址",
                    value: "?from=zhihu&group=pm"
                }
            ]
        });

        const result = FFCJsClient.variation('主页---话术版本', '产品经理版1');
        if (result === '产品经理版1') {
            document.getElementById('version-a').style.display = 'block';
        }
        else if (result === '程序员版1') {
            document.getElementById('version-b').style.display = 'block';
        }
        else if (result === '产品经理版2') {
            document.getElementById('version-c').style.display = 'block';
        }
        else {
            document.getElementById('version-a').style.display = 'block';
        }

        document.addEventListener("click", async function (e) {
            if (e.target && e.target.innerText == '使用文档' ||
                e.target && e.target.innerText == '开始使用') {

                await FFCJsClient.trackCustomEventAsync([
                    {
                        eventName: "开始使用点击事件"
                    }
                ]);
            }
        });

    </script>
</body>

</html>