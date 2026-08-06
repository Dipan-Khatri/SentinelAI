import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  
  UserRound,
} from "lucide-react";


type TimelineEvent = {
  id: string;
  title: string;
  description: string;
  time: string;
  type:
    | "alert"
    | "detection"
    | "ai"
    | "analyst"
    | "resolved";
};


type InvestigationTimelineProps = {
  events?: TimelineEvent[];
};


function InvestigationTimeline({
  events,
}: InvestigationTimelineProps) {


  const timelineEvents =
    events ??
    defaultEvents;


  return (

    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">


      <div>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
          Investigation Timeline
        </p>


        <h2 className="mt-2 text-2xl font-bold text-white">
          Attack Activity Timeline
        </h2>


        <p className="mt-2 text-sm text-slate-400">
          Chronological view of detection events,
          analyst actions, and AI analysis.
        </p>

      </div>



      <div className="mt-8 space-y-1">


        {timelineEvents.map(
          (
            event,
            index,
          ) => {


            const config =
              getEventConfig(
                event.type,
              );


            const Icon =
              config.icon;



            return (

              <div
                key={event.id}
                className="flex gap-4"
              >


                <div className="flex flex-col items-center">


                  <div
                    className={`
                      flex h-11 w-11 items-center justify-center rounded-full border
                      ${config.iconClass}
                    `}
                  >

                    <Icon className="h-5 w-5" />

                  </div>



                  {index !==
                    timelineEvents.length - 1 && (

                    <div className="h-full min-h-16 w-px bg-slate-700" />

                  )}


                </div>





                <div className="flex-1 pb-8">


                  <div className="flex flex-wrap items-start justify-between gap-3">


                    <div>


                      <h3 className="font-semibold text-white">
                        {event.title}
                      </h3>


                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {event.description}
                      </p>


                    </div>



                    <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">
                      {event.time}
                    </span>


                  </div>



                  <span
                    className={`
                      mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold
                      ${config.badgeClass}
                    `}
                  >
                    {getTypeLabel(
                      event.type,
                    )}
                  </span>



                </div>


              </div>

            );

          },
        )}


      </div>


    </section>

  );

}



const defaultEvents: TimelineEvent[] = [

  {
    id: "1",
    title:
      "Multiple failed login attempts detected",
    description:
      "Authentication logs show repeated failures from suspicious source IP 192.168.1.45 targeting administrator account.",
    time:
      "10:14 AM",
    type:
      "alert",
  },


  {
    id: "2",
    title:
      "Brute force pattern identified",
    description:
      "Detection engine mapped activity to MITRE ATT&CK technique T1110 - Brute Force.",
    time:
      "10:15 AM",
    type:
      "detection",
  },


  {
    id: "3",
    title:
      "AI investigation completed",
    description:
      "AI analyzed attack behavior and generated recommended response actions.",
    time:
      "10:16 AM",
    type:
      "ai",
  },


  {
    id: "4",
    title:
      "Analyst started investigation",
    description:
      "SOC analyst reviewed evidence and began incident response workflow.",
    time:
      "10:18 AM",
    type:
      "analyst",
  },


  {
    id: "5",
    title:
      "Response actions completed",
    description:
      "IP blocking and account protection actions were successfully recorded.",
    time:
      "10:25 AM",
    type:
      "resolved",
  },

];



function getEventConfig(
  type: TimelineEvent["type"],
) {


  switch(type) {


    case "alert":

      return {

        icon:
          AlertTriangle,

        iconClass:
          "border-red-500/40 bg-red-500/15 text-red-300",

        badgeClass:
          "border-red-500/40 bg-red-500/15 text-red-300",

      };



    case "detection":

      return {

        icon:
          AlertTriangle,

        iconClass:
          "border-orange-500/40 bg-orange-500/15 text-orange-300",

        badgeClass:
          "border-orange-500/40 bg-orange-500/15 text-orange-300",

      };



    case "ai":

      return {

        icon:
          Bot,

        iconClass:
          "border-purple-500/40 bg-purple-500/15 text-purple-300",

        badgeClass:
          "border-purple-500/40 bg-purple-500/15 text-purple-300",

      };



    case "analyst":

      return {

        icon:
          UserRound,

        iconClass:
          "border-blue-500/40 bg-blue-500/15 text-blue-300",

        badgeClass:
          "border-blue-500/40 bg-blue-500/15 text-blue-300",

      };



    case "resolved":

      return {

        icon:
          CheckCircle2,

        iconClass:
          "border-green-500/40 bg-green-500/15 text-green-300",

        badgeClass:
          "border-green-500/40 bg-green-500/15 text-green-300",

      };


  }

}



function getTypeLabel(
  type: TimelineEvent["type"],
) {


  switch(type) {

    case "alert":
      return "Security Alert";

    case "detection":
      return "Detection";

    case "ai":
      return "AI Analysis";

    case "analyst":
      return "Analyst Action";

    case "resolved":
      return "Response Complete";

  }

}



export default InvestigationTimeline;
