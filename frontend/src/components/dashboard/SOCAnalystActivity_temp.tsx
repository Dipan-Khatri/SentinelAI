import {
   
  Bot,
  FileSearch,
  ShieldAlert,
  User,
} from "lucide-react";


type Investigation = {
  id?: number | string;
  title?: string;
  status?: string;
  analyst?: string;
  severity?: string;
};



type SOCAnalystActivityProps = {
  investigations?: Investigation[];
};



function SOCAnalystActivity({
  investigations = [],
}: SOCAnalystActivityProps) {


  const activities = [

    {
      time: "10:16 AM",
      title: "Analyst reviewed investigation",
      description:
        "Dipan reviewed security evidence and verified attack activity.",
      icon: User,
      color: "text-blue-400",
    },


    {
      time: "10:15 AM",
      title: "Detection engine analyzed logs",
      description:
        "SentinelAI mapped suspicious behavior to MITRE ATT&CK.",
      icon: Bot,
      color: "text-purple-400",
    },


    {
      time: "10:14 AM",
      title: "Security alert generated",
      description:
        "Multiple failed login attempts triggered an alert.",
      icon: ShieldAlert,
      color: "text-red-400",
    },


    {
      time: "10:13 AM",
      title: "Evidence collected",
      description:
        "Authentication logs were processed for investigation.",
      icon: FileSearch,
      color: "text-green-400",
    },

  ];




  return (

    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">


      <div className="mb-6">


        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
          SOC Operations
        </p>


        <h2 className="mt-2 text-2xl font-bold text-white">
          SOC Analyst Activity
        </h2>


        <p className="mt-2 text-sm text-slate-400">
          Recent analyst actions and automated security operations.
        </p>


      </div>






      <div className="space-y-5">


        {
          activities.map(
            (
              activity,
              index,
            ) => {


              const Icon =
                activity.icon;


              return (

                <div
                  key={index}
                  className="flex gap-4 rounded-lg border border-slate-700 bg-slate-900 p-4"
                >


                  <div
                    className={`
                    flex h-10 w-10 items-center justify-center rounded-full
                    bg-slate-800
                    ${activity.color}
                    `}
                  >

                    <Icon className="h-5 w-5"/>

                  </div>





                  <div className="flex-1">


                    <div className="flex items-center justify-between">


                      <h3 className="font-semibold text-white">

                        {activity.title}

                      </h3>



                      <span className="text-xs text-slate-500">

                        {activity.time}

                      </span>


                    </div>





                    <p className="mt-1 text-sm text-slate-400">

                      {activity.description}

                    </p>


                  </div>



                </div>


              );

            }

          )

        }


      </div>





      {
        investigations.length > 0 && (

          <div className="mt-6 border-t border-slate-700 pt-4">


            <p className="text-sm text-slate-400">

              Active investigations:

              <span className="ml-2 font-bold text-white">

                {investigations.length}

              </span>

            </p>


          </div>

        )
      }



    </section>

  );

}



export default SOCAnalystActivity;
