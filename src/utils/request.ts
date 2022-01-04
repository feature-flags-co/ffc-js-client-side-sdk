import { trackParam } from "../classes/interfaces";

// 最大重复请求次数
const maxRequestTimes: number = 1;

// 重复请求间隔时间，单位：s
const reRequestTime: number[] = [10, 30, 60, 600, 1800];

export const onRequest = async (params: trackParam, secretKey: string, url: string) => {

    params.timer && clearTimeout(params.timer);

    try {
        params.UtcTimeStampFromClientEnd = Date.now();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'envSecret': secretKey
            },
            body: JSON.stringify(params)
        });

        const data = await response.json();

        /**
         * 根据返回的结果与传递的 params 进行对比，确定是否存储成功
         *      返回的结果是否与传递的 params 相同
         *      返回的结果内的 timeStamp 为空
         */
        let flag = judgeSaveSuccess(params, data.data);

        if(!flag || !data.data.timeStamp) {
            // 重新发送
            reRequest(params, secretKey, url);
        }

    } catch(error) {
        // 重新发送
        reRequest(params, secretKey, url);
    }
}

// 判断是否存储成功
const judgeSaveSuccess = (params: trackParam, result: any): boolean => {

    let keys = Object.keys(params);
    let flag = true;

    last: for(let i = 0; i < keys.length; i++) {

        if(!["userKey", "UtcTimeStampFromClientEnd", "reRequestTimes", "reRequestTime"].includes(keys[i])) {

            let _params_keys = Object.keys(result[keys[i]]);

            for(let j = 0; j < _params_keys.length; j++) {

                if(result[keys[i]][_params_keys[j]] !== params[keys[i]][_params_keys[j]]) {
                    flag = false;
                    break last;
                }
            }
        }
    }

    return flag;
} 

// 重新请求
const reRequest = (params: trackParam, secretKey: string, url: string) => {
    const times = params.reRequestTimes as number;
    params.reRequestTime = reRequestTime[times];
    params.reRequestTimes = times + 1;

    if(params.reRequestTimes <= maxRequestTimes) {
        params.timer = setTimeout(() => {
            onRequest(params, secretKey, url);
        }, params.reRequestTime * 1000);
    }
}