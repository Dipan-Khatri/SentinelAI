import {
  BrainCircuit,
  CheckCircle2,
  Crosshair,
  ShieldAlert,
  Sparkles,
} from "lucide-react";


function AIInvestigationReport() {


  return (

    <section className="rounded-xl border border-purple-500/30 bg-slate-800 p-6">


      <div className="flex items-center gap-3">


        <div className="rounded-lg bg-purple-500/15 p-3">

          <BrainCircuit className="h-6 w-6 text-purple-400" />

        </div>



        <div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
            Artificial Intelligence
          </p>


          <h2 className="mt-1 text-2xl font-bold text-white">
            AI Investigation Report
          </h2>

        </div>


      </div>





      <div className="mt-6 grid gap-5 lg:grid-cols-2">



        <ReportCard

          icon={ShieldAlert}

          title="Attack Classification"

          value="Credential Brute Force"

          color="text-red-400"

        />



        <ReportCard

          icon={Crosshair}

          title="MITRE ATT&CK Mapping"

          value="T1110 - Brute Force"

          color="text-orange-400"

        />



        <ReportCard

          icon={Sparkles}

          title="AI Confidence"

          value="94% Confidence"

          color="text-purple-400"

        />



        <ReportCard

          icon={ShieldAlert}

          title="Risk Assessment"

          value="HIGH RISK"

          color="text-red-400"

        />


      </div>





      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/50 p-5">


        <h3 className="font-semibold text-white">
          AI Analyst Summary
        </h3>


        <p className="mt-3 leading-7 text-slate-300">

          SentinelAI identified a credential brute force
          attack pattern. Multiple failed authentication
          attempts originated from a suspicious external
          IP address targeting an administrator account.
          The activity matches MITRE ATT&CK technique
          T1110 and requires immediate investigation.

        </p>


      </div>





      <div className="mt-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">


        <h3 className="font-semibold text-blue-300">
          Recommended Response
        </h3>


        <div className="mt-4 space-y-3">


          <ActionItem text="Block malicious source IP" />


          <ActionItem text="Reset affected user credentials" />


          <ActionItem text="Enable multi-factor authentication" />


          <ActionItem text="Monitor authentication logs" />


        </div>


      </div>



    </section>

  );

}





function ReportCard({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon:any;
  title:string;
  value:string;
  color:string;
}) {


  return (

    <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-5">


      <div className="flex items-center gap-3">

        <Icon className={`h-5 w-5 ${color}`} />

        <p className="text-sm text-slate-400">
          {title}
        </p>

      </div>



      <p className="mt-3 text-lg font-bold text-white">
        {value}
      </p>


    </div>

  );

}





function ActionItem({
  text,
}:{
  text:string;
}) {


  return (

    <div className="flex items-center gap-3">


      <CheckCircle2 className="h-5 w-5 text-green-400"/>


      <span className="text-slate-200">
        {text}
      </span>


    </div>

  );

}



export default AIInvestigationReport;
