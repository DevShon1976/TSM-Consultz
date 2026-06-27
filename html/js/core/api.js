export async function api(endpoint, body = {}, method = "POST") {

    const opts = {
        method,
        headers: {
            "Content-Type":"application/json"
        }
    };

    if(method !== "GET"){
        opts.body = JSON.stringify(body);
    }

    const res = await fetch(endpoint, opts);

    if(!res.ok){

        throw new Error(await res.text());

    }

    return res.json();

}
