import {
  Globe,
  ShieldAlert,
  Activity,
  MapPin,
  Database,
} from "lucide-react";


type ThreatIntelligenceCardProps = {
  ip?: string;
};



function ThreatIntelligenceCard({
  ip = "185.220.101.12",
}: ThreatIntelligenceCardProps) {


  return (

    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">


      <div className="flex items-center gap-3">

        <div className="rounded-lg bg-red-500/10 p-3">
          <ShieldAlert className="h-6 w-6 text-red-400"/>
        </div>


        <div>

          <p className="text-xs uppercase tracking-[0.2em] text-red-400 font-semibold">
            Live Intelligence
          </p>

          <h2 className="text-2xl font-bold">
            Threat Intelligence
          </h2>

        </div>


      </div>



      <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-5">


        <div className="flex items-center justify-between">

          <div>

            <p className="text-sm text-slate-400">
              Suspicious IP
            </p>

            <p className="mt-1 text-xl font-bold text-white">
              {ip}
            </p>

          </div>


          <span className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-bold text-red-300">
            HIGH RISK
          </span>


        </div>


      </div>




      <div className="mt-5 grid gap-4 sm:grid-cols-2">


        <InfoCard
          icon={Globe}
          title="Location"
          value="Germany 🇩🇪"
        />


        <InfoCard
          icon={Activity}
          title="Attack Type"
          value="Credential Attack"
        />


        <InfoCard
          icon={Database}
          title="Abuse Reports"
          value="152 Reports"
        />


        <InfoCard
          icon={MapPin}
          title="Confidence"
          value="94%"
        />


      </div>




      <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">

        <p className="font-semibold text-blue-300">
          Recommended Action
        </p>


        <p className="mt-2 text-sm text-slate-300">
          Block the source IP, monitor authentication logs,
          and review compromised accounts.
        </p>


      </div>


    </section>

  );

}




function InfoCard({
  icon: Icon,
  title,
  value,
}:{
  icon:any;
  title:string;
  value:string;
}) {


  return (

    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">


      <div className="flex items-center gap-3">

        <Icon className="h-5 w-5 text-blue-400"/>

        <p className="text-sm text-slate-400">
          {title}
        </p>

      </div>


      <p className="mt-3 font-semibold text-white">
        {value}
      </p>


    </div>

  );

}


export default ThreatIntelligenceCard;

