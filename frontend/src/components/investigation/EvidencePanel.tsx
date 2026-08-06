import {
  Activity,
  Globe,
  Hash,
  LockKeyhole,
  Server,
  ShieldAlert,
  User,
} from "lucide-react";


type EvidencePanelProps = {
  sourceIp?: string;
  username?: string;
  hostname?: string;
  technique?: string;
  attempts?: number;
};


function EvidencePanel({
  sourceIp = "185.220.101.12",
  username = "administrator",
  hostname = "WIN-SERVER-01",
  technique = "T1110 - Brute Force",
  attempts = 15,
}: EvidencePanelProps) {


  const evidence = [
    {
      title: "Source IP",
      value: sourceIp,
      icon: Globe,
      color: "text-orange-400",
    },

    {
      title: "Target User",
      value: username,
      icon: User,
      color: "text-blue-400",
    },

    {
      title: "Hostname",
      value: hostname,
      icon: Server,
      color: "text-purple-400",
    },

    {
      title: "MITRE ATT&CK",
      value: technique,
      icon: Hash,
      color: "text-red-400",
    },

    {
      title: "Failed Attempts",
      value: `${attempts} attempts`,
      icon: Activity,
      color: "text-yellow-400",
    },

    {
      title: "Access Type",
      value: "Authentication Attack",
      icon: LockKeyhole,
      color: "text-green-400",
    },
  ];



  return (

    <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">


      <div className="flex items-center gap-3">


        <div className="rounded-lg bg-red-500/10 p-3">
          <ShieldAlert className="h-6 w-6 text-red-400" />
        </div>


        <div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
            Evidence Collection
          </p>

          <h2 className="mt-1 text-2xl font-bold text-white">
            Technical Evidence
          </h2>

        </div>


      </div>




      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">


        {evidence.map(
          (item) => {


            const Icon =
              item.icon;


            return (

              <div
                key={item.title}
                className="rounded-lg border border-slate-700 bg-slate-900/50 p-5"
              >

                <div className="flex items-center gap-3">


                  <Icon
                    className={`h-5 w-5 ${item.color}`}
                  />


                  <p className="text-sm text-slate-400">
                    {item.title}
                  </p>


                </div>



                <p className="mt-3 break-all text-lg font-semibold text-white">
                  {item.value}
                </p>


              </div>

            );

          },
        )}


      </div>




      <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">


        <div className="flex items-center gap-3">


          <ShieldAlert className="h-5 w-5 text-red-400"/>


          <p className="font-semibold text-red-300">
            Threat Intelligence Result
          </p>


        </div>


        <p className="mt-2 text-sm text-slate-300">
          Source IP has been identified as suspicious.
          Multiple failed authentication attempts detected.
          Recommended action: block IP and investigate affected account.
        </p>


      </div>



    </section>

  );

}


export default EvidencePanel;
