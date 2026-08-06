import {
  AlertTriangle,
  Clock,
  ShieldAlert,
} from "lucide-react";

import type {
  Detection,
} from "../../services/api";


type RecentDetectionTimelineProps = {
  detections: Detection[];
};


function RecentDetectionTimeline({
  detections,
}: RecentDetectionTimelineProps) {


  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">


      <div className="mb-6">

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
          Detection Monitoring
        </p>


        <h2 className="mt-2 text-2xl font-bold text-white">
          Recent Detections Timeline
        </h2>


        <p className="mt-2 text-sm text-slate-400">
          Latest security detections identified by SentinelAI.
        </p>


      </div>




      {
        detections.length === 0 && (

          <p className="text-slate-400">
            No detections available.
          </p>

        )
      }






      <div className="space-y-5">


        {
          detections.slice(0,5).map(
            (
              detection,
              index
            ) => (

              <div
                key={index}
                className="flex gap-4 rounded-lg border border-slate-700 bg-slate-900 p-4"
              >



                <div
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-full
                    ${
                      detection.severity === "Critical"
                      ?
                      "bg-red-500/20 text-red-400"
                      :
                      detection.severity === "High"
                      ?
                      "bg-orange-500/20 text-orange-400"
                      :
                      "bg-blue-500/20 text-blue-400"
                    }
                  `}
                >


                  {
                    detection.severity === "Critical"
                    ?
                    <ShieldAlert className="h-5 w-5"/>
                    :
                    <AlertTriangle className="h-5 w-5"/>

                  }


                </div>






                <div className="flex-1">


                  <div className="flex justify-between gap-3">


                    <h3 className="font-semibold text-white">

                      Security Detection

                    </h3>



                    <span className="text-xs text-slate-400">

                      {detection.severity}

                    </span>


                  </div>






                  <p className="mt-2 text-sm text-slate-400">

                    Suspicious activity detected during log analysis.

                  </p>






                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">


                    <Clock className="h-3 w-3"/>

                    Recently detected


                  </div>



                </div>



              </div>


            )
          )
        }


      </div>



    </section>
  );
}


export default RecentDetectionTimeline;
