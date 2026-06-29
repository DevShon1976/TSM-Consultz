import {api} from "../core/api.js";

const ROUTES={

    hc:"/api/hc/query",

    insurance:"/api/insurance/query",

    financial:"/api/financial/query",

    mortgage:"/api/mortgage/query",

    legal:"/api/legal/query",

    construction:"/api/construction/query",

    re:"/api/re/query",

    bpo:"/api/bpo/query"

};

export async function dispatch(prompt,verticals){

    const jobs=[];

    verticals.forEach(v=>{

        if(ROUTES[v]){

            jobs.push(

                api(ROUTES[v],{

                    text:prompt

                })

            );

        }

    });

    return Promise.all(jobs);

}
