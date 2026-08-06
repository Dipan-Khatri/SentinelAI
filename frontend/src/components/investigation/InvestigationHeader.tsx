import {
  
  Calendar,
  UserRound,
  ShieldCheck,
  Clock,
} from "lucide-react";


type InvestigationHeaderProps = {
  id: string;
  title: string;
  severity: string;
  status: string;
  analyst: string;
  riskScore: number;
  createdAt?: string;
  updatedAt?: string;
};


function InvestigationHeader({
  id,
  title,
  severity,
  status,
  analyst,
  riskScore,
  createdAt,
  updatedAt,
}: InvestigationHeaderProps) {

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">

      <div className="flex flex-wrap items-start justify-between gap-5">


        <div>

          <div className="flex items-center gap-3">

            <span className="rounded-lg bg-red-500/15 px-3 py-1 text-sm font-bold text-red-300">
              {id}
            </span>


            <span
              className={`
                rounded-full px-3 py-1 text-xs font-semibold
                ${getSeverityStyle(severity)}
              `}
            >
              {severity}
            </span>

          </div>


          <h1 className="mt-4 text-3xl font-bold text-white">
            {title}
          </h1>


          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">


            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-blue-400" />

              Analyst:
              <span className="text-white">
                {analyst}
              </span>
            </div>



            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />

              Status:
              <span className="text-white">
                {status}
              </span>
            </div>


          </div>

        </div>



        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 text-center">

          <ShieldCheck className="mx-auto h-7 w-7 text-blue-400"/>

          <p className="mt-2 text-xs uppercase tracking-wider text-slate-400">
            Risk Score
          </p>


          <p className="mt-1 text-4xl font-bold text-blue-300">
            {riskScore}
          </p>


          <p className="text-xs text-slate-500">
            /100
          </p>

        </div>


      </div>




      <div className="mt-6 grid gap-4 sm:grid-cols-2">


        <InfoCard
          icon={Calendar}
          label="Created"
          value={
            createdAt ??
            "Unknown"
          }
        />


        <InfoCard
          icon={Calendar}
          label="Last Updated"
          value={
            updatedAt ??
            "Unknown"
          }
        />


      </div>


    </section>
  );
}



function InfoCard({
  icon: Icon,
  label,
  value,
}:{
  icon:any;
  label:string;
  value:string;
}) {

  return (

    <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4">

      <div className="flex items-center gap-2 text-sm text-slate-400">

        <Icon className="h-4 w-4 text-blue-400"/>

        {label}

      </div>


      <p className="mt-2 text-sm font-semibold text-white">
        {value}
      </p>


    </div>

  );
}



function getSeverityStyle(
  severity:string
){

  switch(
    severity.toLowerCase()
  ){

    case "critical":
      return "bg-red-500/20 text-red-300 border border-red-500/30";


    case "high":
      return "bg-orange-500/20 text-orange-300 border border-orange-500/30";


    case "medium":
      return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";


    default:
      return "bg-blue-500/20 text-blue-300 border border-blue-500/30";

  }

}



export default InvestigationHeader;
