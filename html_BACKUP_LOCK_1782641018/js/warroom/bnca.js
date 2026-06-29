import {api} from "../core/api.js";

export async function buildConsensus(prompt,responses){

    return api("/api/collective/signal",{

        prompt,

        responses

    });

}
