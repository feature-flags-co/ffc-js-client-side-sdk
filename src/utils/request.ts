import { trackParam } from "../classes/interfaces";

const devurl: string = "https://ffc-api-ce2-dev.chinacloudsites.cn/api/public/analytics/userbehaviortrack";

export const onRequest = async (params: trackParam, secretKey: string) => {

    try {
        const response = await fetch(devurl, {
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
        } else {
            console.log("发送成功!");
        }

    } catch(error) {
        console.log(error);
    }
}

const judgeSaveSuccess = (params: trackParam, result: any): boolean => {

    let keys = Object.keys(params);
    let flag = true;

    last: for(let i = 0; i < keys.length; i++) {

        if(!["userKey", "UtcTimeStampFromClientEnd"].includes(keys[i])) {

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

