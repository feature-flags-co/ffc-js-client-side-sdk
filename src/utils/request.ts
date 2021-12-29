import { trackParam } from "../classes/interfaces";

const devurl: string = "https://ffc-api-ce2-dev.chinacloudsites.cn/api/public/analytics/userbehaviortrack";

export const onRequest = async (params: trackParam, secretKey: string) => {

    console.log(params);
    console.log(secretKey);

    const response = await fetch(devurl, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'envSecret': secretKey
        },
        body: JSON.stringify(params)
    });

    console.log(response)
    const reader = response.body!.getReader();
    while(true) {
    const {done, value} = await reader.read();
    if (done) {
        break;
    }
        console.log(value)
    }
}