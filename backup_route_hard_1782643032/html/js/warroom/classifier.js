import {api} from "../core/api.js";

export async function classifyMission(prompt){

    return api("/api/classify",{
        text:prompt
    });

}
