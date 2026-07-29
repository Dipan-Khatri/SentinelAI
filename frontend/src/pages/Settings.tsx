import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  RefreshCcw,
  Save,
  Settings2,
  Shield,
  SlidersHorizontal,
  UserRoundCog,
} from "lucide-react";

const SETTINGS_STORAGE_KEY = "sentinelai_detection_settings";

export type SentinelSettings = {
  bruteForceThreshold: number;
  passwordSprayingThreshold: number;
  invalidUserThreshold: number;
  privilegedAccounts: string[];
  riskWeights: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
};

const DEFAULT_SETTINGS: SentinelSettings = {
  bruteForceThreshold: 3,
  passwordSprayingThreshold: 3,
  invalidUserThreshold: 2,
  privilegedAccounts: [
    "root",
    "admin",
    "administrator",
  ],
  riskWeights: {
    critical: 50,
    high: 30,
    medium: 15,
    low: 5,
  },
};

function Settings() {
  const [settings, setSettings] =
    useState<SentinelSettings>(DEFAULT_SETTINGS);

  const [privilegedAccountInput, setPrivilegedAccountInput] =
    useState("");

  const [saveMessage, setSaveMessage] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] =
    useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem(
      SETTINGS_STORAGE_KEY,
    );

    if (!savedSettings) {
      return;
    }

    try {
      const parsedSettings = JSON.parse(
        savedSettings,
      ) as Partial<SentinelSettings>;

      setSettings({
        ...DEFAULT_SETTINGS,
        ...parsedSettings,
        riskWeights: {
          ...DEFAULT_SETTINGS.riskWeights,
          ...parsedSettings.riskWeights,
        },
        privilegedAccounts:
          parsedSettings.privilegedAccounts ??
          DEFAULT_SETTINGS.privilegedAccounts,
      });
    } catch {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    }
  }, []);

  function updateSetting<
    Key extends keyof SentinelSettings,
  >(
    key: Key,
    value: SentinelSettings[Key],
  ) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));

    markAsChanged();
  }

  function updateRiskWeight(
    severity: keyof SentinelSettings["riskWeights"],
    value: number,
  ) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      riskWeights: {
        ...currentSettings.riskWeights,
        [severity]: value,
      },
    }));

    markAsChanged();
  }

  function markAsChanged() {
    setHasUnsavedChanges(true);
    setSaveMessage("");
  }

  function addPrivilegedAccount() {
    const normalizedAccount =
      privilegedAccountInput.trim().toLowerCase();

    if (!normalizedAccount) {
      return;
    }

    if (
      settings.privilegedAccounts.includes(
        normalizedAccount,
      )
    ) {
      setSaveMessage(
        "That privileged account already exists.",
      );
      return;
    }

    setSettings((currentSettings) => ({
      ...currentSettings,
      privilegedAccounts: [
        ...currentSettings.privilegedAccounts,
        normalizedAccount,
      ],
    }));

    setPrivilegedAccountInput("");
    markAsChanged();
  }

  function removePrivilegedAccount(account: string) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      privilegedAccounts:
        currentSettings.privilegedAccounts.filter(
          (currentAccount) =>
            currentAccount !== account,
        ),
    }));

    markAsChanged();
  }

  function saveSettings() {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    );

    setHasUnsavedChanges(false);
    setSaveMessage(
      "Detection settings saved successfully.",
    );
  }

  function restoreDefaults() {
    setSettings(DEFAULT_SETTINGS);

    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(DEFAULT_SETTINGS),
    );

    setPrivilegedAccountInput("");
    setHasUnsavedChanges(false);
    setSaveMessage(
      "Default detection settings restored.",
    );
  }

  const maximumRiskWeight = Math.max(
    settings.riskWeights.critical,
    settings.riskWeights.high,
    settings.riskWeights.medium,
    settings.riskWeights.low,
  );

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-500/15 p-3">
              <Settings2 className="h-8 w-8 text-blue-400" />
            </div>

            <div>
              <h1 className="text-4xl font-bold">
                Detection Settings
              </h1>

              <p className="mt-2 max-w-3xl text-slate-400">
                Configure SentinelAI detection thresholds,
                privileged accounts, and risk-score weights.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={restoreDefaults}
              className="flex items-center gap-2 rounded-lg border border-slate-600 px-5 py-3 font-medium text-slate-200 transition hover:border-slate-400 hover:bg-slate-800"
            >
              <RefreshCcw className="h-5 w-5" />
              Restore Defaults
            </button>

            <button
              type="button"
              onClick={saveSettings}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
            >
              <Save className="h-5 w-5" />
              Save Settings
            </button>
          </div>
        </header>

        {hasUnsavedChanges && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-300">
            <AlertTriangle className="h-5 w-5 shrink-0" />

            <p className="text-sm">
              You have unsaved changes. Select Save Settings
              before leaving this page.
            </p>
          </div>
        )}

        {saveMessage && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />

            <p className="text-sm">{saveMessage}</p>
          </div>
        )}

        <section className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-6">
          <SectionHeader
            icon={SlidersHorizontal}
            title="Detection Thresholds"
            description="Control how much activity is required before SentinelAI creates a detection."
          />

          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            <ThresholdCard
              title="Brute Force"
              description="Failed login attempts from one source IP."
              value={settings.bruteForceThreshold}
              minimum={2}
              maximum={50}
              unit="attempts"
              mitreId="T1110"
              onChange={(value) =>
                updateSetting(
                  "bruteForceThreshold",
                  value,
                )
              }
            />

            <ThresholdCard
              title="Password Spraying"
              description="Different accounts targeted by one source IP."
              value={
                settings.passwordSprayingThreshold
              }
              minimum={2}
              maximum={25}
              unit="accounts"
              mitreId="T1110.003"
              onChange={(value) =>
                updateSetting(
                  "passwordSprayingThreshold",
                  value,
                )
              }
            />

            <ThresholdCard
              title="Invalid-User Probing"
              description="Nonexistent usernames attempted by one source."
              value={settings.invalidUserThreshold}
              minimum={2}
              maximum={25}
              unit="usernames"
              mitreId="T1110.001"
              onChange={(value) =>
                updateSetting(
                  "invalidUserThreshold",
                  value,
                )
              }
            />
          </div>

          <div className="mt-6 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
            <p className="text-sm leading-6 text-blue-200">
              Lower thresholds generate alerts sooner but may
              create more false positives. Higher thresholds
              reduce noise but can miss smaller attacks.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-6">
          <SectionHeader
            icon={UserRoundCog}
            title="Privileged Accounts"
            description="Authentication failures against these accounts generate a privileged-account targeting detection."
          />

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={privilegedAccountInput}
              onChange={(event) => {
                setPrivilegedAccountInput(
                  event.target.value,
                );
                setSaveMessage("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addPrivilegedAccount();
                }
              }}
              placeholder="Enter an account name"
              className="flex-1 rounded-lg border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />

            <button
              type="button"
              onClick={addPrivilegedAccount}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium transition hover:bg-blue-700"
            >
              Add Account
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {settings.privilegedAccounts.length > 0 ? (
              settings.privilegedAccounts.map(
                (account) => (
                  <div
                    key={account}
                    className="flex items-center gap-3 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2"
                  >
                    <Shield className="h-4 w-4 text-purple-400" />

                    <span className="font-mono text-purple-200">
                      {account}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removePrivilegedAccount(account)
                      }
                      className="ml-1 text-sm text-slate-500 transition hover:text-red-400"
                      aria-label={`Remove ${account}`}
                    >
                      Remove
                    </button>
                  </div>
                ),
              )
            ) : (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
                No privileged accounts are configured.
              </p>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-6">
          <SectionHeader
            icon={Gauge}
            title="Risk-Score Weights"
            description="Control how strongly each detection severity contributes to the overall risk score."
          />

          <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <RiskWeightCard
              severity="Critical"
              value={settings.riskWeights.critical}
              maximum={100}
              barMaximum={maximumRiskWeight}
              valueClass="text-red-300"
              barClass="bg-red-500"
              onChange={(value) =>
                updateRiskWeight("critical", value)
              }
            />

            <RiskWeightCard
              severity="High"
              value={settings.riskWeights.high}
              maximum={100}
              barMaximum={maximumRiskWeight}
              valueClass="text-orange-300"
              barClass="bg-orange-500"
              onChange={(value) =>
                updateRiskWeight("high", value)
              }
            />

            <RiskWeightCard
              severity="Medium"
              value={settings.riskWeights.medium}
              maximum={100}
              barMaximum={maximumRiskWeight}
              valueClass="text-amber-300"
              barClass="bg-amber-500"
              onChange={(value) =>
                updateRiskWeight("medium", value)
              }
            />

            <RiskWeightCard
              severity="Low"
              value={settings.riskWeights.low}
              maximum={100}
              barMaximum={maximumRiskWeight}
              valueClass="text-blue-300"
              barClass="bg-blue-500"
              onChange={(value) =>
                updateRiskWeight("low", value)
              }
            />
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-6">
          <SectionHeader
            icon={Shield}
            title="Current Configuration"
            description="Preview of the settings saved for the SentinelAI detection engine."
          />

          <div className="mt-7 overflow-hidden rounded-lg border border-slate-700">
            <table className="w-full text-left">
              <thead className="bg-slate-950/70 text-sm text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-medium">
                    Setting
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Current value
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Purpose
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-700">
                <ConfigurationRow
                  setting="Brute-force threshold"
                  value={`${settings.bruteForceThreshold} attempts`}
                  purpose="Detect repeated failed authentication from one IP."
                />

                <ConfigurationRow
                  setting="Password-spraying threshold"
                  value={`${settings.passwordSprayingThreshold} accounts`}
                  purpose="Detect one source targeting multiple users."
                />

                <ConfigurationRow
                  setting="Invalid-user threshold"
                  value={`${settings.invalidUserThreshold} usernames`}
                  purpose="Detect username enumeration or probing."
                />

                <ConfigurationRow
                  setting="Privileged accounts"
                  value={
                    settings.privilegedAccounts.join(
                      ", ",
                    ) || "None"
                  }
                  purpose="Identify attacks against sensitive accounts."
                />

                <ConfigurationRow
                  setting="Severity weights"
                  value={`Critical ${settings.riskWeights.critical}, High ${settings.riskWeights.high}, Medium ${settings.riskWeights.medium}, Low ${settings.riskWeights.low}`}
                  purpose="Calculate the overall security risk score."
                />
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-6">
          <div>
            <h2 className="text-xl font-bold">
              Apply your configuration
            </h2>

            <p className="mt-1 text-sm text-slate-300">
              Save the settings, then analyze the log again
              after the backend settings integration is added.
            </p>
          </div>

          <button
            type="button"
            onClick={saveSettings}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium transition hover:bg-blue-700"
          >
            <Save className="h-5 w-5" />
            Save Settings
          </button>
        </section>
      </div>
    </div>
  );
}

type SectionHeaderProps = {
  icon: typeof Settings2;
  title: string;
  description: string;
};

function SectionHeader({
  icon: Icon,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-blue-500/15 p-3">
        <Icon className="h-6 w-6 text-blue-400" />
      </div>

      <div>
        <h2 className="text-2xl font-bold">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

type ThresholdCardProps = {
  title: string;
  description: string;
  value: number;
  minimum: number;
  maximum: number;
  unit: string;
  mitreId: string;
  onChange: (value: number) => void;
};

function ThresholdCard({
  title,
  description,
  value,
  minimum,
  maximum,
  unit,
  mitreId,
  onChange,
}: ThresholdCardProps) {
  return (
    <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>

          <p className="mt-1 font-mono text-sm text-blue-400">
            {mitreId}
          </p>
        </div>

        <AlertTriangle className="h-5 w-5 text-amber-400" />
      </div>

      <p className="mt-4 min-h-12 text-sm leading-6 text-slate-400">
        {description}
      </p>

      <div className="mt-5 flex items-end gap-3">
        <input
          type="number"
          min={minimum}
          max={maximum}
          value={value}
          onChange={(event) => {
            const nextValue = Number(
              event.target.value,
            );

            if (Number.isNaN(nextValue)) {
              return;
            }

            onChange(
              Math.min(
                maximum,
                Math.max(minimum, nextValue),
              ),
            );
          }}
          className="w-24 rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-2xl font-bold text-white outline-none transition focus:border-blue-500"
        />

        <p className="pb-3 text-sm text-slate-400">
          {unit}
        </p>
      </div>

      <input
        type="range"
        min={minimum}
        max={maximum}
        value={value}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
        className="mt-5 w-full accent-blue-500"
      />

      <div className="mt-2 flex justify-between text-xs text-slate-600">
        <span>{minimum}</span>
        <span>{maximum}</span>
      </div>
    </article>
  );
}

type RiskWeightCardProps = {
  severity: string;
  value: number;
  maximum: number;
  barMaximum: number;
  valueClass: string;
  barClass: string;
  onChange: (value: number) => void;
};

function RiskWeightCard({
  severity,
  value,
  maximum,
  barMaximum,
  valueClass,
  barClass,
  onChange,
}: RiskWeightCardProps) {
  const widthPercentage =
    barMaximum > 0
      ? Math.min(100, (value / barMaximum) * 100)
      : 0;

  return (
    <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-5">
      <p className="text-sm text-slate-400">
        {severity}
      </p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <input
          type="number"
          min={0}
          max={maximum}
          value={value}
          onChange={(event) => {
            const nextValue = Number(
              event.target.value,
            );

            if (Number.isNaN(nextValue)) {
              return;
            }

            onChange(
              Math.min(
                maximum,
                Math.max(0, nextValue),
              ),
            );
          }}
          className={`w-24 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-2xl font-bold outline-none transition focus:border-blue-500 ${valueClass}`}
        />

        <span className="text-sm text-slate-500">
          points
        </span>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{
            width: `${widthPercentage}%`,
          }}
        />
      </div>
    </article>
  );
}

type ConfigurationRowProps = {
  setting: string;
  value: string;
  purpose: string;
};

function ConfigurationRow({
  setting,
  value,
  purpose,
}: ConfigurationRowProps) {
  return (
    <tr className="bg-slate-800/40">
      <td className="px-5 py-4 font-medium text-white">
        {setting}
      </td>

      <td className="max-w-xs break-words px-5 py-4 text-blue-300">
        {value}
      </td>

      <td className="px-5 py-4 text-sm text-slate-400">
        {purpose}
      </td>
    </tr>
  );
}

export default Settings;
