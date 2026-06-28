import {api} from "../core/api.js";

export async function saveMission(data){

    return api("/api/node-report",data);

}
