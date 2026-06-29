import {classifyMission} from "./classifier.js";
import {dispatch} from "./dispatcher.js";
import {buildConsensus} from "./bnca.js";
import {saveMission} from "./reporter.js";

export async function runMission(prompt){

    addStatus("Analyzing Mission");

    const cls=

        await classifyMission(prompt);

    addStatus("Launching Specialists");

    const results=

        await dispatch(

            prompt,

            cls.verticals

        );

    addStatus("Collective Intelligence");

    const collective=

        await buildConsensus(

            prompt,

            results

        );

    addStatus("Saving Mission");

    await saveMission({

        prompt,

        verticals:cls.verticals,

        recommendations:results,

        severity:"AUTO"

    });

    addStatus("Mission Complete");

    return{

        classify:cls,

        collective,

        results

    };

}
